import { NextRequest, NextResponse } from 'next/server';
import { ApiRouteError, apiSuccess, handleApiRouteError, unauthorized } from '@/lib/api/errors';
import { ensureObject, readJsonBody, readOptionalBoolean, readOptionalObject, readOptionalString } from '@/lib/api/validation';
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
      return unauthorized();
    }

    const profile = await getOrCreateProfile(supabase, user);
    const avatarUrl = profile.avatar_path
      ? await createSignedAvatarUrl(supabase, profile.avatar_path)
      : undefined;

    return apiSuccess(mapUserProfile(profile, avatarUrl));
  } catch (error) {
    return handleApiRouteError(error, 'profile.get');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    const body = ensureObject(await readJsonBody(req));
    const existingProfile = await getOrCreateProfile(supabase, user);
    const updates: Record<string, unknown> = {};
    const fullName = readOptionalString(body.fullName, {
      field: 'Full name',
      maxLength: 80,
    })?.replace(/\s+/g, ' ');

    if (fullName !== undefined) {
      updates.full_name = fullName || null;
    }

    const preferences = readOptionalObject(body.preferences, 'preferences');
    if (preferences !== undefined) {
      updates.preferences = normalizeUserPreferences({
        ...getDefaultUserPreferences(),
        ...normalizeUserPreferences(existingProfile.preferences),
        ...preferences,
      });
    }

    let nextAvatarPath = existingProfile.avatar_path;
    const shouldRemoveAvatar = readOptionalBoolean(body.removeAvatar, 'removeAvatar') === true;

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
        throw new ApiRouteError(400, 'Avatar upload payload is invalid.', {
          code: 'invalid_upload',
        });
      }

      if (!ALLOWED_AVATAR_MIME_TYPES.has(avatarFileData.mimeType)) {
        throw new ApiRouteError(400, 'Avatar must be a JPG, PNG, WEBP, or GIF image.', {
          code: 'invalid_upload_type',
        });
      }

      if ((avatarFileData.size ?? 0) > MAX_AVATAR_SIZE) {
        throw new ApiRouteError(400, 'Avatar must be 5 MB or smaller.', {
          code: 'upload_too_large',
        });
      }

      const extension = getFileExtension(avatarFileData.name, avatarFileData.mimeType);
      const avatarPath = `${user.id}/avatar-${Date.now()}.${extension}`;
      const fileBuffer = Buffer.from(avatarFileData.base64, 'base64');

      const { error: uploadError } = await supabase.storage.from(PROFILE_ASSETS_BUCKET).upload(avatarPath, fileBuffer, {
        contentType: avatarFileData.mimeType,
        upsert: false,
      });

      if (uploadError) {
        throw new ApiRouteError(500, 'Unable to upload avatar right now.', {
          code: 'avatar_upload_failed',
          cause: uploadError,
        });
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
        throw new ApiRouteError(500, 'Unable to update profile right now.', {
          code: 'profile_update_failed',
          cause: error,
        });
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

    return apiSuccess(mapUserProfile(updatedProfile, avatarUrl));
  } catch (error) {
    return handleApiRouteError(error, 'profile.update');
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
