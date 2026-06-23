import { createClient } from '@/lib/supabase/server';
import { VaultWorkspace } from './_components/vault-workspace';

export default async function VaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const identity = {
    fullName:
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Vault User',
    email: user?.email || '',
  };

  return <VaultWorkspace identity={identity} />;
}
