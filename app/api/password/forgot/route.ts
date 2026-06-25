import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, handleApiRouteError } from '@/lib/api/errors';
import { logApiEvent } from '@/lib/api/logging';
import { enforceRateLimit, getClientIp } from '@/lib/api/rate-limit';
import { ensureObject, readEmail, readJsonBody } from '@/lib/api/validation';
import { createClient } from '@/lib/supabase/server';
import { SUPABASE_PASSWORD_RESET_REDIRECT_URL } from '@/lib/supabase/auth-redirects';

export async function POST(req: NextRequest) {
  try {
    const body = ensureObject(await readJsonBody(req));
    const normalizedEmail = readEmail(body.email, 'Email');
    const ip = getClientIp(req);

    enforceRateLimit({
      key: `auth:forgot-password:${ip}:${normalizedEmail}`,
      limit: 3,
      windowMs: 60_000,
      message: 'Too many reset requests. Please wait a minute and try again.',
      code: 'password_reset_rate_limited',
    });

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: SUPABASE_PASSWORD_RESET_REDIRECT_URL,
    });

    if (error) {
      logApiEvent('warn', 'auth.password_reset.request_rejected', {
        ip,
        code: 'password_reset_failed',
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return apiSuccess({
      success: true,
      message: 'If that account exists, a password reset email has been sent.',
    });
  } catch (error) {
    return handleApiRouteError(error, 'auth.password_reset.request', {
      ip: getClientIp(req),
    });
  }
}
