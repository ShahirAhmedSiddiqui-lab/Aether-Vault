import { NextRequest, NextResponse } from 'next/server';
import { retryItemProcessing } from '@/lib/vault/ingestion';
import { createClient } from '@/lib/supabase/server';
import { mapKnowledgeItem, VAULT_BUCKET } from '@/lib/supabase/vault';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const item = await retryItemProcessing(supabase, user.id, id);

    let signedUrl: string | undefined;
    if (item.file_path) {
      const { data } = await supabase.storage.from(VAULT_BUCKET).createSignedUrl(item.file_path, 60 * 60);
      signedUrl = data?.signedUrl;
    }

    return NextResponse.json(mapKnowledgeItem(item, signedUrl));
  } catch (error) {
    console.error('Failed to reprocess item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
