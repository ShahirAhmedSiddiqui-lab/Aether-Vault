import type { Metadata } from 'next';

export const siteConfig = {
  name: 'Memora',
  title: 'Memora | Private AI Second Brain for Knowledge Capture and Recall',
  description:
    'Memora is a private AI second brain that helps you save videos, PDFs, social links, articles, images, and voice notes, then turn them into searchable summaries and recall-ready knowledge.',
  shortDescription: 'Private AI second brain for capturing, organizing, and recalling knowledge.',
  siteUrl: 'https://usememoraweb.vercel.app',
  locale: 'en_US',
  keywords: [
    'AI second brain',
    'knowledge management',
    'personal knowledge base',
    'save youtube videos',
    'PDF summarizer',
    'social link summarizer',
    'voice note transcription',
    'research organizer',
    'AI flashcards',
    'private knowledge vault',
  ],
} as const;

export function absoluteUrl(path = '/') {
  return new URL(path, siteConfig.siteUrl).toString();
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path = '/',
  keywords = [],
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: 'website',
      images: [
        {
          url: absoluteUrl('/opengraph-image'),
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} preview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl('/twitter-image')],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  };
}

export const privateRouteMetadata = buildPageMetadata({
  title: 'Memora',
  description: siteConfig.shortDescription,
  noIndex: true,
});

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.siteUrl,
  logo: absoluteUrl('/icon.png'),
  sameAs: [],
};

export const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteConfig.name,
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web',
  url: siteConfig.siteUrl,
  description: siteConfig.description,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Save YouTube videos, PDFs, articles, social links, images, and voice notes',
    'Generate AI summaries and structured takeaways',
    'Create recall flashcards from saved knowledge',
    'Search and chat across your private knowledge vault',
  ],
};
