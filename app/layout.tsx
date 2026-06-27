import type {Metadata} from 'next';
import { AuthSessionSync } from '@/app/_components/auth-session-sync';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Memora',
  description: 'Private AI second brain for saving, summarizing, and recalling your knowledge.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthSessionSync />
        {children}
      </body>
    </html>
  );
}
