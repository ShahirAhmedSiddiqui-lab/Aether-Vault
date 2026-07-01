import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VaultWorkspace } from './_components/vault-workspace';
import { getProfileWithAvatarUrl } from '@/lib/supabase/profile';
import { getSafeUser } from '@/lib/supabase/auth';
import { attachSignedUrls } from '@/lib/supabase/vault';
import { listChatSessions } from '@/lib/vault/chat';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Vault',
  description: 'Private Memora vault workspace.',
  path: '/vault',
  noIndex: true,
});

export default async function VaultPage() {
  const supabase = await createClient();
  const { user } = await getSafeUser(supabase);

  if (!user) {
    redirect('/login?message=Please%20log%20in%20to%20access%20your%20vault.');
  }

  const [profile, sessions, itemQuery] = await Promise.all([
    getProfileWithAvatarUrl(supabase, user),
    listChatSessions(supabase, user.id),
    supabase
      .from('knowledge_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (itemQuery.error) {
    throw itemQuery.error;
  }

  const initialItems = await attachSignedUrls(supabase, itemQuery.data ?? []);
  const identity = {
    fullName: profile.fullName || user?.email?.split('@')[0] || 'Vault User',
    email: profile.email || user?.email || '',
    avatarUrl: profile.avatarUrl,
    preferences: profile.preferences,
  };

  return <VaultWorkspace identity={identity} initialItems={initialItems} initialChatSessions={sessions} />;
}
