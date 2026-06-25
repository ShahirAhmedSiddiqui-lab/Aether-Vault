import { type User } from '@supabase/supabase-js';
import { type createClient as createServerClientFactory } from '@/lib/supabase/server';

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerClientFactory>>;

type SafeUserResult = {
  user: User | null;
  hadRecoverableAuthError: boolean;
};

export async function getSafeUser(supabase: ServerSupabaseClient): Promise<SafeUserResult> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      user,
      hadRecoverableAuthError: false,
    };
  } catch (error) {
    if (isRecoverableAuthError(error)) {
      console.warn('Recovered from stale Supabase auth session.', error);

      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.warn('Failed to clear stale Supabase auth session.', signOutError);
      }

      return {
        user: null,
        hadRecoverableAuthError: true,
      };
    }

    throw error;
  }
}

function isRecoverableAuthError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string; message?: string; status?: number };
  const message = candidate.message?.toLowerCase() || '';

  return candidate.code === 'refresh_token_not_found'
    || message.includes('invalid refresh token')
    || message.includes('refresh token not found')
    || message.includes('jwt expired')
    || message.includes('invalid jwt')
    || candidate.status === 400;
}
