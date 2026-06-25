import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, handleApiRouteError } from '@/lib/api/errors';
import { logApiEvent } from '@/lib/api/logging';
import { enforceRateLimit, getClientIp } from '@/lib/api/rate-limit';
import { ensureObject, readEmail, readJsonBody, readRequiredString } from '@/lib/api/validation';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = ensureObject(await readJsonBody(req));
    const normalizedEmail = readEmail(body.email, 'Email');
    const normalizedPassword = readRequiredString(body.password, {
      field: 'Password',
      minLength: 1,
      maxLength: 1024,
      trim: false,
    });
    const ip = getClientIp(req);

    enforceRateLimit({
      key: `auth:login:${ip}:${normalizedEmail}`,
      limit: 5,
      windowMs: 60_000,
      message: 'Too many login attempts. Please wait a minute and try again.',
      code: 'login_rate_limited',
    });

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (error) {
      const normalizedErrorMessage = error.message.toLowerCase();
      const status = normalizedErrorMessage.includes('email not confirmed') ? 403 : 400;
      const message = normalizedErrorMessage.includes('email not confirmed')
        ? 'Confirm your email before logging in. Check your inbox for the verification message.'
        : error.message;

      logApiEvent('warn', 'auth.login.rejected', {
        ip,
        status,
        code: normalizedErrorMessage.includes('email not confirmed') ? 'email_not_confirmed' : 'invalid_login',
      });

      return NextResponse.json({ error: message, code: normalizedErrorMessage.includes('email not confirmed') ? 'email_not_confirmed' : 'invalid_login' }, { status });
    }

    return apiSuccess({
      success: true,
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email ?? normalizedEmail,
          }
        : null,
    });
  } catch (error) {
    return handleApiRouteError(error, 'auth.login', {
      ip: getClientIp(req),
    });
  }
}
