import type { Metadata } from 'next';
import { MarketingLanding } from './_components/marketing-landing';
import {
  buildPageMetadata,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Private AI Second Brain for Saving and Recalling Knowledge',
  description:
    'Save YouTube videos, PDFs, articles, social links, images, and voice notes in Memora, then turn them into searchable summaries and recall-ready flashcards.',
  path: '/',
  keywords: [
    'AI knowledge vault',
    'YouTube summarizer',
    'article summarizer',
    'AI research notes',
    'flashcards from notes',
  ],
});

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <MarketingLanding />
    </>
  );
}
