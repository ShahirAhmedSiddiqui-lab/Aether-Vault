'use client';

import * as React from 'react';
import Link from 'next/link';
import { RefreshCcw, Save, ShieldCheck } from 'lucide-react';
import { PasswordInput } from '@/app/_components/password-input';
import { type UserPreferences, type UserProfile } from '@/lib/db';

export function SettingsPageClient({ initialProfile }: { initialProfile: UserProfile }) {
  const [preferences, setPreferences] = React.useState<UserPreferences>(initialProfile.preferences);
  const [isSavingPreferences, setIsSavingPreferences] = React.useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [securityFeedback, setSecurityFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [securityError, setSecurityError] = React.useState<string | null>(null);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const savePreferences = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingPreferences(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save settings.');
      }

      setPreferences(data.preferences);
      setFeedback('Settings saved successfully.');
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save settings.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSecurityFeedback(null);
    setSecurityError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityError('Current password, new password, and confirmation are all required.');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('New password confirmation does not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setSecurityError('Choose a new password that is different from your current password.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch('/api/password/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update password.');
      }

      setSecurityFeedback(data.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (updateError) {
      console.error(updateError);
      setSecurityError(updateError instanceof Error ? updateError.message : 'Unable to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const sendResetEmail = async () => {
    setSecurityFeedback(null);
    setSecurityError(null);

    try {
      const response = await fetch('/api/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: initialProfile.email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send reset email.');
      }

      setSecurityFeedback('Password reset email sent. Open the latest message to choose a new password.');
    } catch (sendError) {
      console.error(sendError);
      setSecurityError(sendError instanceof Error ? sendError.message : 'Unable to send reset email.');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={savePreferences} className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Preferences</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">Tune how Memora feels for you</h2>
          </div>

          <Link
            href="/profile"
            className="hidden rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-950 sm:inline-flex"
          >
            Edit profile
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">Brain response style</label>
            <select
              value={preferences.brainResponseStyle}
              onChange={(event) => updatePreference('brainResponseStyle', event.target.value as UserPreferences['brainResponseStyle'])}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white"
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">Default voice speed</label>
            <select
              value={String(preferences.defaultVoiceSpeed)}
              onChange={(event) => updatePreference('defaultVoiceSpeed', Number(event.target.value) as UserPreferences['defaultVoiceSpeed'])}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white"
            >
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <input
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(event) => updatePreference('reduceMotion', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-neutral-300"
            />
            <span className="space-y-1">
              <span className="block text-sm font-semibold text-neutral-900">Reduce motion</span>
              <span className="block text-sm leading-6 text-neutral-600">Use calmer transitions across future vault surfaces.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <input
              type="checkbox"
              checked={preferences.compactMode}
              onChange={(event) => updatePreference('compactMode', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-neutral-300"
            />
            <span className="space-y-1">
              <span className="block text-sm font-semibold text-neutral-900">Compact workspace mode</span>
              <span className="block text-sm leading-6 text-neutral-600">Prefer denser information layouts in future workspace updates.</span>
            </span>
          </label>
        </div>

        {(feedback || error) && (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
              error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || feedback}
          </div>
        )}

        <div className="mt-8">
          <button
            type="submit"
            disabled={isSavingPreferences}
            className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSavingPreferences ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save preferences
          </button>
        </div>
      </form>

      <section className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-neutral-900">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Security</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">Password management</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-600">
              Change your password directly by confirming the current one first. If you no longer know it, you can still request a reset email.
            </p>
          </div>
        </div>

        <form onSubmit={updatePassword} className="mt-8 space-y-4">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-5 text-sm leading-7 text-neutral-600">
            Signed in as <span className="font-semibold text-neutral-950">{initialProfile.email}</span>. Enter your current password so Memora can verify the change safely before updating Supabase.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
                Current password
              </label>
              <PasswordInput
                id="currentPassword"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
                New password
              </label>
              <PasswordInput
                id="newPassword"
                required
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
                Confirm new password
              </label>
              <PasswordInput
                id="confirmPassword"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          {securityFeedback && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {securityFeedback}
            </div>
          )}

          {securityError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {securityError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {isUpdatingPassword ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Update password
            </button>

            <button
              type="button"
              onClick={() => void sendResetEmail()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-950"
            >
              <RefreshCcw className="h-4 w-4" />
              Email me a reset link instead
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
