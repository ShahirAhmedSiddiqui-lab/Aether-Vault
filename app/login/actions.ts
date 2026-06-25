'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SUPABASE_EMAIL_CONFIRMATION_REDIRECT_URL } from '@/lib/supabase/auth-redirects';

function redirectWithMessage(message: string) {
  redirect(`/login?message=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  if (!email || !password) {
    redirectWithMessage('Email and password are required.');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithMessage(error.message);
  }

  revalidatePath('/', 'layout');
  redirect('/vault');
}

export async function signup(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();
  const name = String(formData.get('name') ?? formData.get('fullName') ?? '').trim();

  if (!email || !password) {
    redirectWithMessage('Email and password are required.');
  }

  if (password.length < 6) {
    redirectWithMessage('Password must be at least 6 characters long.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: SUPABASE_EMAIL_CONFIRMATION_REDIRECT_URL,
      data: {
        full_name: name || undefined,
        name: name || undefined,
      },
    },
  });

  if (error) {
    console.error('Signup error:', error.message);
    redirectWithMessage(error.message);
  }

  revalidatePath('/', 'layout');

  if (!data.session) {
    redirectWithMessage('Account created. Check your email to confirm your signup, then log in.');
  }

  redirect('/vault');
}
