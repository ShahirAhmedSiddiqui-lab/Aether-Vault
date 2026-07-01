import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccountShell } from '@/app/account/_components/account-shell';
import { SettingsPageClient } from './settings-page-client';
import { createClient } from '@/lib/supabase/server';
import { getProfileWithAvatarUrl } from '@/lib/supabase/profile';
import { getSafeUser } from '@/lib/supabase/auth';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Settings',
  description: 'Manage your private Memora settings.',
  path: '/settings',
  noIndex: true,
});

export default async function SettingsPage() {
  const supabase = await createClient();
  const { user } = await getSafeUser(supabase);

  if (!user) {
    redirect('/login?message=Please%20log%20in%20to%20manage%20your%20settings.');
  }

  const profile = await getProfileWithAvatarUrl(supabase, user);

  return (
    <AccountShell
      current="settings"
      title="Settings"
      description="Save personal preferences, tune your vault behavior, and manage your password securely."
    >
      <SettingsPageClient initialProfile={profile} />
    </AccountShell>
  );
}
