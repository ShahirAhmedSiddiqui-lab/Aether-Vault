import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '../_components/auth-shell';
import { createClient } from '@/lib/supabase/server';
import { getSafeUser } from '@/lib/supabase/auth';
import { buildPageMetadata } from '@/lib/seo';
import { LoginFormClient } from './login-form-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'Log In',
  description: 'Log in to your private Memora workspace.',
  path: '/login',
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const { user } = await getSafeUser(supabase);

  if (user) {
    redirect('/vault');
  }

  const { message } = await searchParams;

  return (
    <AuthShell
      eyebrow="Account Access"
      title="Welcome back to your private second brain."
      description="Sign in to continue searching, saving, and organizing your vault across links, files, notes, and voice captures."
      formTitle="Log in to Memora"
    >
      <LoginFormClient initialMessage={message} mode="login" />
    </AuthShell>
  );
}
