'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { subscribeToAuthLinkEvents } from '@/lib/auth-link-events';

export function AuthSessionSync() {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const supabase = createClient();

    return subscribeToAuthLinkEvents((payload) => {
      void (async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Unable to clear session after auth link event:', error);
        }

        const target = `/login?message=${encodeURIComponent(payload.message)}`;
        if (pathname !== '/login') {
          router.replace(target);
        } else {
          router.replace(target);
        }
        router.refresh();
      })();
    });
  }, [pathname, router]);

  return null;
}
