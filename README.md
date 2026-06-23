# Aether Vault

Next.js app for capturing articles, videos, PDFs, social links, and voice notes into a personal AI knowledge vault.

## Local development

1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example`
3. Set:
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Run:
   `npm run dev`

## Deploy on Vercel

1. Import the repository into Vercel
2. Add the same environment variables from `.env.example`
3. Deploy

## Notes

- `node_modules/`, `.next/`, local env files, and local agent folders are excluded from Git
- Supabase SQL lives in `supabase/migrations/`
