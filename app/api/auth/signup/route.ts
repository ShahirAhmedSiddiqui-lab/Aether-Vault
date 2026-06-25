import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveBaseUrlFromRequest } from '@/lib/site-url';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, name } = await req.json();

    const normalizedEmail = String(email ?? '').trim();
    const normalizedPassword = String(password ?? '').trim();
    const normalizedName = String(fullName ?? name ?? '').trim();

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (normalizedPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const supabase = await createClient();
    const baseUrl = resolveBaseUrlFromRequest(req);
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        emailRedirectTo: new URL('/login', baseUrl).toString(),
        data: {
          full_name: normalizedName || undefined,
          name: normalizedName || undefined,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: !data.session,
      message: data.session
        ? 'Account created successfully.'
        : 'Account created. Check your email to confirm your signup, then log in.',
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email ?? normalizedEmail,
          }
        : null,
    });
  } catch (error) {
    console.error('Failed to sign up:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
