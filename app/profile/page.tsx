import { redirect } from 'next/navigation';
import { AccountShell } from '@/app/account/_components/account-shell';
import { ProfilePageClient } from './profile-page-client';
import { createClient } from '@/lib/supabase/server';
import { getProfileWithAvatarUrl } from '@/lib/supabase/profile';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20log%20in%20to%20manage%20your%20profile.');
  }

  const profile = await getProfileWithAvatarUrl(supabase, user);

  return (
    <AccountShell
      current="profile"
      title="Profile"
      description="Manage your full name, private avatar, and the identity details shown across your vault."
    >
      <ProfilePageClient initialProfile={profile} />
    </AccountShell>
  );
}
