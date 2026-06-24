import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFileExtension } from '@/lib/vault/items';
import {
  createSignedAvatarUrl,
  getDefaultUserPreferences,
  getOrCreateProfile,
  mapUserProfile,
  normalizeUserPreferences,
  PROFILE_ASSETS_BUCKET,
} from '@/lib/supabase/profile';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

type AvatarFileData = {
  base64: string;
  mimeType: string;
  name?: string;
  size?: number;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(supabase, user);
    const avatarUrl = profile.avatar_path
      ? await createSignedAvatarUrl(supabase, profile.avatar_path)
      : undefined;

    return NextResponse.json(mapUserProfile(profile, avatarUrl));
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const existingProfile = await getOrCreateProfile(supabase, user);
    const updates: Record<string, unknown> = {};
    const fullName =
      typeof body.fullName === 'string'
        ? body.fullName.trim().replace(/\s+/g, ' ')
        : undefined;

    if (fullName !== undefined) {
      if (fullName.length > 80) {
        return NextResponse.json({ error: 'Full name must be 80 characters or fewer.' }, { status: 400 });
      }

      updates.full_name = fullName || null;
    }

    if (body.preferences !== undefined) {
      if (!body.preferences || typeof body.preferences !== 'object' || Array.isArray(body.preferences)) {
        return NextResponse.json({ error: 'Preferences must be an object.' }, { status: 400 });
      }

      updates.preferences = normalizeUserPreferences({
        ...getDefaultUserPreferences(),
        ...normalizeUserPreferences(existingProfile.preferences),
        ...body.preferences,
      });
    }

    let nextAvatarPath = existingProfile.avatar_path;
    const shouldRemoveAvatar = body.removeAvatar === true;

    if (shouldRemoveAvatar && nextAvatarPath) {
      const { error: removeError } = await supabase.storage.from(PROFILE_ASSETS_BUCKET).remove([nextAvatarPath]);

      if (removeError) {
        console.error('Failed to remove previous avatar:', removeError);
      }

      nextAvatarPath = null;
      updates.avatar_path = null;
    }

    if (body.avatarFileData !== undefined) {
      const avatarFileData = parseAvatarFileData(body.avatarFileData);

      if (!avatarFileData) {
        return NextResponse.json({ error: 'Avatar upload payload is invalid.' }, { status: 400 });
      }

      if (!ALLOWED_AVATAR_MIME_TYPES.has(avatarFileData.mimeType)) {
        return NextResponse.json({ error: 'Avatar must be a JPG, PNG, WEBP, or GIF image.' }, { status: 400 });
      }

      if ((avatarFileData.size ?? 0) > MAX_AVATAR_SIZE) {
        return NextResponse.json({ error: 'Avatar must be 5 MB or smaller.' }, { status: 400 });
      }

      const extension = getFileExtension(avatarFileData.name, avatarFileData.mimeType);
      const avatarPath = `${user.id}/avatar-${Date.now()}.${extension}`;
      const fileBuffer = Buffer.from(avatarFileData.base64, 'base64');

      const { error: uploadError } = await supabase.storage.from(PROFILE_ASSETS_BUCKET).upload(avatarPath, fileBuffer, {
        contentType: avatarFileData.mimeType,
        upsert: false,
      });

      if (uploadError) {
        console.error('Failed to upload avatar:', uploadError);
        return NextResponse.json({ error: 'Unable to upload avatar right now.' }, { status: 500 });
      }

      if (nextAvatarPath) {
        const { error: removeError } = await supabase.storage.from(PROFILE_ASSETS_BUCKET).remove([nextAvatarPath]);

        if (removeError) {
          console.error('Failed to remove replaced avatar:', removeError);
        }
      }

      nextAvatarPath = avatarPath;
      updates.avatar_path = avatarPath;
    }

    let updatedProfile = existingProfile;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('*')
        .single();

      if (error || !data) {
        console.error('Failed to update profile row:', error);
        return NextResponse.json({ error: 'Unable to update profile right now.' }, { status: 500 });
      }

      updatedProfile = data;
    }

    if (fullName !== undefined) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName || undefined,
        },
      });

      if (metadataError) {
        console.error('Failed to sync auth metadata full name:', metadataError);
      }
    }

    const avatarUrl = updatedProfile.avatar_path
      ? await createSignedAvatarUrl(supabase, updatedProfile.avatar_path)
      : undefined;

    return NextResponse.json(mapUserProfile(updatedProfile, avatarUrl));
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function parseAvatarFileData(value: unknown): AvatarFileData | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const data = value as Record<string, unknown>;
  const base64 = typeof data.base64 === 'string' ? data.base64 : '';
  const mimeType = typeof data.mimeType === 'string' ? data.mimeType : '';
  const name = typeof data.name === 'string' ? data.name : undefined;
  const size = typeof data.size === 'number' ? data.size : undefined;

  if (!base64 || !mimeType) {
    return null;
  }

  return { base64, mimeType, name, size };
}
