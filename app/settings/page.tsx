import { redirect } from 'next/navigation';
import { AccountShell } from '@/app/account/_components/account-shell';
import { SettingsPageClient } from './settings-page-client';
import { createClient } from '@/lib/supabase/server';
import { getProfileWithAvatarUrl } from '@/lib/supabase/profile';
import { getSafeUser } from '@/lib/supabase/auth';

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
      description="Save personal preferences, update your password, and keep account access under your control."
    >
      <SettingsPageClient initialProfile={profile} />
    </AccountShell>
  );
}
