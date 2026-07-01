import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/seo';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(145deg, #ffffff 0%, #f4f4f5 52%, #e5e7eb 100%)',
          color: '#111827',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '64px',
            border: '1px solid rgba(17,24,39,0.08)',
            borderRadius: '36px',
            background: 'rgba(255,255,255,0.82)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-80px',
            top: '-40px',
            width: '420px',
            height: '420px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(17,24,39,0.18), rgba(17,24,39,0))',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '96px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: 24, letterSpacing: '0.35em', fontWeight: 700 }}>MEMORA</div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 72,
                lineHeight: 1.05,
                fontWeight: 800,
                maxWidth: '780px',
              }}
            >
              Save knowledge.
              <br />
              Recall it instantly.
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.4, color: '#4b5563', maxWidth: '860px' }}>
              {siteConfig.shortDescription}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '18px', fontSize: 24, color: '#374151' }}>
            <div>YouTube</div>
            <div>PDFs</div>
            <div>Articles</div>
            <div>Voice Notes</div>
            <div>AI Flashcards</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
