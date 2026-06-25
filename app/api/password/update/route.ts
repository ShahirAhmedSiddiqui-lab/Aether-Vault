import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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
    const normalizedCurrentPassword = String(currentPassword ?? '');
    const normalizedPassword = String(password ?? '');

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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publishableKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables.' }, { status: 500 });
    }

    // Verify the current password with an isolated client so we don't disturb the
    // active authenticated session that will be used for the actual password update.
    const verificationClient = createSupabaseClient(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: signInError } = await verificationClient.auth.signInWithPassword({
      email: user.email,
      password: normalizedCurrentPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    await verificationClient.auth.signOut();

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
