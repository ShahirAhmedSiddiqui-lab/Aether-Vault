import { after, NextRequest, NextResponse } from 'next/server';
import { createPendingItem, processPendingItem } from '@/lib/vault/ingestion';
import { createClient } from '@/lib/supabase/server';
import { attachSignedUrls, mapKnowledgeItem, matchesSearch, VAULT_BUCKET } from '@/lib/supabase/vault';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('q')?.trim();
    const includeTrashed = searchParams.get('include_trashed') === 'true';

    let query = supabase
      .from('knowledge_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type && type !== 'All Knowledge') {
      query = query.eq('item_type', type);
    }

    if (status) {
      query = query.eq('processing_status', status);
    } else if (!includeTrashed) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    let items = await attachSignedUrls(supabase, data ?? []);

    if (search) {
      items = items.filter((item) => matchesSearch(item, search));
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, content, type: requestedType, fileData } = await req.json();

    if (!content && !url && !fileData) {
      return NextResponse.json({ error: 'Content, URL or file is required' }, { status: 400 });
    }

    const item = await createPendingItem(supabase, user.id, {
      url,
      content,
      requestedType,
      fileData,
    });

    if (item.processing_status === 'pending') {
      after(async () => {
        try {
          await processPendingItem(supabase, user.id, item.id);
        } catch (processingError) {
          console.error('Failed to process item after creation:', processingError);
        }
      });
    }

    let signedUrl: string | undefined;
    if (item.file_path) {
      const { data } = await supabase.storage.from(VAULT_BUCKET).createSignedUrl(item.file_path, 60 * 60);
      signedUrl = data?.signedUrl;
    }

    return NextResponse.json(mapKnowledgeItem(item, signedUrl), { status: 201 });
  } catch (error) {
    console.error('Failed to create item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
