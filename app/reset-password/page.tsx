import type { Metadata } from 'next';
import { ResetPasswordClient } from './reset-password-client';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Reset Password',
  description: 'Set a new password for your Memora account.',
  path: '/reset-password',
  noIndex: true,
});

export default function ResetPasswordPage() {
  return <ResetPasswordClient entryMode="auto" />;
}
