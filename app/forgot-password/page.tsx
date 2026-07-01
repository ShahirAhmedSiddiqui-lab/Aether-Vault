import type { Metadata } from 'next';
import { ResetPasswordClient } from '../reset-password/reset-password-client';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Forgot Password',
  description: 'Request a secure Memora password reset link.',
  path: '/forgot-password',
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ResetPasswordClient entryMode="request" />;
}
