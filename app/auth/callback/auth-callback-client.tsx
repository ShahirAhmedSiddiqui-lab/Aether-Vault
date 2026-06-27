'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw } from 'lucide-react';
import { BrandLockup } from '@/app/_components/brand-lockup';
import { broadcastAuthLinkEvent } from '@/lib/auth-link-events';
import { createClient } from '@/lib/supabase/client';

function getLinkFingerprint() {
  if (typeof window === 'undefined') {
    return '';
  }

  const search = window.location.search;
  const hash = window.location.hash;

  if (!search && !hash) {
    return '';
  }

  return `${window.location.pathname}${search}${hash}`;
}

async function claimAuthLink(fingerprint: string, linkType: 'confirmation' | 'recovery') {
  const response = await fetch('/api/claim-auth-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fingerprint,
      linkType,
    }),
  });

  if (!response.ok) {
    throw new Error('Unable to validate auth link right now.');
  }

  const data = await response.json();
  return Boolean(data.claimed);
}

export function AuthCallbackClient() {
  const router = useRouter();
  const [message, setMessage] = React.useState('Preparing your confirmation link...');
  const [hasCompleted, setHasCompleted] = React.useState(false);
  const [isRedeeming, setIsRedeeming] = React.useState(false);
  const [canConfirm, setCanConfirm] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();

    const prepareAuth = async () => {
      const hash = window.location.hash.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const code = search.get('code');
      const tokenHash = search.get('token_hash');
      const type = search.get('type');
      const errorCode = search.get('error_code');
      const errorDescription = search.get('error_description');

      try {
        if (errorCode || errorDescription || hash.includes('error=')) {
          router.replace(`/login?message=${encodeURIComponent('This confirmation link has expired. Request a new one and try again.')}`);
          return;
        }

        const isHandledLink = Boolean(tokenHash && type) || Boolean(code);
        if (isHandledLink) {
          setCanConfirm(true);
          setMessage('Confirm this email in this tab to finish activation. After confirmation, return to the previous Memora tab and log in again.');
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          broadcastAuthLinkEvent({
            type: 'email_confirmed',
            message: 'Email confirmed successfully. Please log in.',
            issuedAt: Date.now(),
          });
          await supabase.auth.signOut();
          setHasCompleted(true);
          setMessage('Email confirmed successfully. You can now close this tab and continue from the previous Memora tab.');
          return;
        }

        if (isHandledLink) {
          router.replace(`/login?message=${encodeURIComponent('This confirmation link has expired. Request a new one and try again.')}`);
          return;
        }

        setMessage('Email confirmed. Redirecting to login...');
        router.replace(`/login?message=${encodeURIComponent('Email confirmed successfully. Please log in.')}`);
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace(`/login?message=${encodeURIComponent('We could not complete email confirmation. Please try again.')}`);
      }
    };

    void prepareAuth();
  }, [router]);

  const confirmEmail = async () => {
    setIsRedeeming(true);

    try {
      const supabase = createClient();
      const search = new URLSearchParams(window.location.search);
      const code = search.get('code');
      const tokenHash = search.get('token_hash');
      const type = search.get('type');
      const linkFingerprint = getLinkFingerprint();

      const claimed = await claimAuthLink(linkFingerprint, 'confirmation');
      if (!claimed) {
        router.replace(`/login?message=${encodeURIComponent('This confirmation link has expired. Request a new one and try again.')}`);
        return;
      }

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'signup' | 'invite' | 'recovery' | 'email' | 'email_change' | 'magiclink',
        });

        if (error) {
          router.replace(`/login?message=${encodeURIComponent('This confirmation link has expired. Request a new one and try again.')}`);
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/login?message=${encodeURIComponent('This confirmation link has expired. Request a new one and try again.')}`);
          return;
        }
      } else {
        router.replace(`/login?message=${encodeURIComponent('This confirmation link has expired. Request a new one and try again.')}`);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace(`/login?message=${encodeURIComponent('This confirmation link has expired. Request a new one and try again.')}`);
        return;
      }

      broadcastAuthLinkEvent({
        type: 'email_confirmed',
        message: 'Email confirmed successfully. Please log in.',
        issuedAt: Date.now(),
      });
      await supabase.auth.signOut();
      setCanConfirm(false);
      setHasCompleted(true);
      setMessage('Email confirmed successfully. You can now close this tab and continue from the previous Memora tab.');
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace(`/login?message=${encodeURIComponent('We could not complete email confirmation. Please try again.')}`);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f7f3,_#ffffff_55%)] text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-full max-w-md rounded-[30px] border border-neutral-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex justify-center">
            <BrandLockup size="sm" />
          </div>
          <div className="mt-8 flex justify-center">
            {hasCompleted ? null : <RefreshCcw className="h-5 w-5 animate-spin text-neutral-500" />}
          </div>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-neutral-950">
            {hasCompleted ? 'Email confirmed.' : 'Confirming your account'}
          </h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">{message}</p>
          {canConfirm ? (
            <button
              type="button"
              onClick={() => void confirmEmail()}
              disabled={isRedeeming}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {isRedeeming ? <RefreshCcw className="h-4 w-4 animate-spin" /> : null}
              Confirm email
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
