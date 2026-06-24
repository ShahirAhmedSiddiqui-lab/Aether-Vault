'use client';

import * as React from 'react';
import Link from 'next/link';
import { Camera, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { type UserProfile } from '@/lib/db';

export function ProfilePageClient({ initialProfile }: { initialProfile: UserProfile }) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [fullName, setFullName] = React.useState(initialProfile.fullName ?? '');
  const [avatarFileData, setAvatarFileData] = React.useState<null | {
    base64: string;
    mimeType: string;
    name?: string;
    size?: number;
  }>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const displayAvatar = avatarPreview ?? (removeAvatar ? null : profile.avatarUrl ?? null);
  const avatarLetter = (fullName.trim() || profile.email).charAt(0).toUpperCase() || 'M';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const readPromise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Failed to read avatar file.'));
    });
    reader.readAsDataURL(file);

    try {
      const dataUrl = await readPromise;
      const base64 = dataUrl.split(',')[1] || '';
      setAvatarFileData({
        base64,
        mimeType: file.type,
        name: file.name,
        size: file.size,
      });
      setAvatarPreview(dataUrl);
      setRemoveAvatar(false);
      setError(null);
    } catch (fileError) {
      console.error(fileError);
      setError('Unable to prepare that avatar image.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          avatarFileData,
          removeAvatar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setProfile(data);
      setFullName(data.fullName ?? '');
      setAvatarFileData(null);
      setAvatarPreview(null);
      setRemoveAvatar(false);
      setFeedback('Profile updated successfully.');
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[30px] border border-neutral-200 bg-neutral-100 text-4xl font-black text-neutral-900"
              style={displayAvatar ? { backgroundImage: `url(${displayAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!displayAvatar ? avatarLetter : null}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Identity</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">
                  {profile.fullName || 'Set your profile details'}
                </h2>
              </div>
              <div className="space-y-1 text-sm text-neutral-600">
                <p>{profile.email}</p>
                <p>Profile last updated {profile.updatedAt}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 hover:bg-white">
              <Camera className="h-4 w-4" />
              Upload avatar
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>

            <button
              type="button"
              onClick={() => {
                setRemoveAvatar(true);
                setAvatarFileData(null);
                setAvatarPreview(null);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-600 transition hover:border-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Remove avatar
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Profile Details</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">Update your public identity inside Memora</h3>
          </div>

          <Link
            href="/settings"
            className="hidden rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-950 sm:inline-flex"
          >
            Open settings
          </Link>
        </div>

        <div className="mt-8 grid gap-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
              Full Name
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Memora User"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">Email</label>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              {profile.email}
            </div>
          </div>
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

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save profile
          </button>
          <Link
            href="/vault"
            className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-950"
          >
            Return to vault
          </Link>
        </div>
      </form>
    </div>
  );
}
