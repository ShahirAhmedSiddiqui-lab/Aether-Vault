import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VaultWorkspace } from './_components/vault-workspace';
import { getProfileWithAvatarUrl } from '@/lib/supabase/profile';
import { getSafeUser } from '@/lib/supabase/auth';

export default async function VaultPage() {
  const supabase = await createClient();
  const { user } = await getSafeUser(supabase);

  if (!user) {
    redirect('/login?message=Please%20log%20in%20to%20access%20your%20vault.');
  }

  const profile = await getProfileWithAvatarUrl(supabase, user);
  const identity = {
    fullName: profile.fullName || user?.email?.split('@')[0] || 'Vault User',
    email: profile.email || user?.email || '',
    avatarUrl: profile.avatarUrl,
    defaultVoiceSpeed: profile.preferences.defaultVoiceSpeed,
  };

  return <VaultWorkspace identity={identity} />;
}
