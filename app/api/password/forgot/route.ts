import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SUPABASE_PASSWORD_RESET_REDIRECT_URL } from '@/lib/supabase/auth-redirects';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email ?? '').trim();

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: SUPABASE_PASSWORD_RESET_REDIRECT_URL,
    });

    if (error) {
      console.error('Reset password error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'If that account exists, a password reset email has been sent.',
    });
  } catch (error) {
    console.error('Failed to start password reset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
