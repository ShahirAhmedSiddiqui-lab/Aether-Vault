'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw } from 'lucide-react';
import { BrandLockup } from '@/app/_components/brand-lockup';
import { createClient } from '@/lib/supabase/client';

export function AuthCallbackClient() {
  const router = useRouter();
  const [message, setMessage] = React.useState('Finalizing your sign-in...');

  React.useEffect(() => {
    const supabase = createClient();

    const finishAuth = async () => {
      const hash = window.location.hash.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const code = search.get('code');
      const tokenHash = search.get('token_hash');
      const type = search.get('type');
      const next = search.get('next');

      try {
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'invite' | 'recovery' | 'email' | 'email_change' | 'magiclink',
          });

          if (error) {
            console.error('Auth callback error:', error.message);
            router.replace(`/login?message=${encodeURIComponent('This email confirmation link is invalid or has expired. Request a fresh one and try again.')}`);
            return;
          }
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Auth callback error:', error.message);
            router.replace(`/login?message=${encodeURIComponent('We could not complete email confirmation. Please try again.')}`);
            return;
          }
        }

        if (hash.includes('error=')) {
          const hashParams = new URLSearchParams(hash.slice(1));
          const errorDescription = hashParams.get('error_description') || hashParams.get('error') || 'Authentication failed.';
          console.error('Auth callback error:', errorDescription);
          router.replace(`/login?message=${encodeURIComponent(errorDescription)}`);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setMessage('Email confirmed. Redirecting to your vault...');
          router.replace(next || '/vault');
          return;
        }

        setMessage('Email confirmed. Redirecting to login...');
        router.replace(`/login?message=${encodeURIComponent('Email confirmed successfully. Please log in.')}`);
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace(`/login?message=${encodeURIComponent('We could not complete email confirmation. Please try again.')}`);
      }
    };

    void finishAuth();
  }, [router]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f7f3,_#ffffff_55%)] text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-full max-w-md rounded-[30px] border border-neutral-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex justify-center">
            <BrandLockup size="sm" />
          </div>
          <div className="mt-8 flex justify-center">
            <RefreshCcw className="h-5 w-5 animate-spin text-neutral-500" />
          </div>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-neutral-950">Confirming your account</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">{message}</p>
        </div>
      </div>
    </main>
  );
}
