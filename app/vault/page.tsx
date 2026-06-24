import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VaultWorkspace } from './_components/vault-workspace';

export default async function VaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please%20log%20in%20to%20access%20your%20vault.');
  }

  const identity = {
    fullName:
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Vault User',
    email: user?.email || '',
  };

  return <VaultWorkspace identity={identity} />;
}
