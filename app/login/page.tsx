import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LockKeyhole, UserRound } from 'lucide-react';
import { login, signup } from './actions';
import { BrandLockup } from '../_components/brand-lockup';
import { createClient } from '@/lib/supabase/server';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/vault');
  }

  const { message } = await searchParams;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f7f3,_#ffffff_55%)] text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
        <section className="max-w-xl space-y-6">
          <div className="inline-flex rounded-[26px] border border-neutral-200 bg-white/90 px-4 py-3 shadow-sm">
            <BrandLockup size="sm" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
              Sign in to your private second brain.
            </h1>
            <p className="max-w-lg text-sm leading-7 text-neutral-600 sm:text-base">
              Your notes, PDFs, screenshots, voice memos, and AI summaries now live in Supabase with
              per-user auth and private storage.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <LockKeyhole className="mb-3 h-5 w-5 text-neutral-900" />
              <h2 className="text-sm font-bold text-neutral-950">Protected sessions</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Only authenticated users can read, upload, or delete their vault data.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <UserRound className="mb-3 h-5 w-5 text-neutral-900" />
              <h2 className="text-sm font-bold text-neutral-950">Private file storage</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                PDFs, screenshots, and audio uploads are stored in a user-scoped Supabase bucket instead
                of local JSON.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:mt-0">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-neutral-400">Account Access</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">Login or create an account</h2>
          </div>

          {message ? (
            <div className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              {message}
            </div>
          ) : null}

          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Memora User"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white"
              />
            </div>

            <div className="flex justify-end">
              <Link href="/reset-password" className="text-xs font-semibold text-neutral-500 transition hover:text-neutral-950">
                Forgot your password?
              </Link>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <button
                formAction={login}
                className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-neutral-800"
              >
                Log In
              </button>
              <button
                formAction={signup}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 transition hover:border-neutral-900"
              >
                Sign Up
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
