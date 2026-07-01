import type { Metadata } from 'next';
import { ResetPasswordClient } from '../reset-password/reset-password-client';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Update Password',
  description: 'Update your Memora account password securely.',
  path: '/update-password',
  noIndex: true,
});

export default function UpdatePasswordPage() {
  return <ResetPasswordClient entryMode="update" />;
}
