import type { Metadata } from 'next';
import { AuthCallbackClient } from './auth-callback-client';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Authentication Callback',
  description: 'Memora authentication callback.',
  path: '/auth/callback',
  noIndex: true,
});

export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}
