import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, password } = await req.json();
    const normalizedCurrentPassword = String(currentPassword ?? '').trim();
    const normalizedPassword = String(password ?? '').trim();

    if (!normalizedCurrentPassword) {
      return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
    }

    if (!normalizedPassword) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    if (normalizedPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'This account does not have a password email identity.' }, { status: 400 });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: normalizedCurrentPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({
      password: normalizedPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('Failed to update password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
