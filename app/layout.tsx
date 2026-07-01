import type {Metadata} from 'next';
import { Manrope } from 'next/font/google';
import { AuthSessionSync } from '@/app/_components/auth-session-sync';
import { FlashToastSync } from '@/app/_components/flash-toast-sync';
import { siteConfig } from '@/lib/seo';
import { Toaster } from 'sonner';
import './globals.css'; // Global styles

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-memora',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.title,
    template: '%s | Memora',
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: 'productivity',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} preview`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: ['/twitter-image'],
  },
  verification: {
    google: 'hbPTvvz2cjeMTpgMRPrQXdFNrQ9xXrhg-g4ZO4KrUgQ',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${manrope.variable} font-[family:var(--font-memora)]`}>
        <AuthSessionSync />
        <FlashToastSync />
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            classNames: {
              toast: 'font-[family:var(--font-memora)]',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
