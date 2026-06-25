import { apiSuccess, handleApiRouteError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiRouteError(error, 'auth.logout');
  }
}
