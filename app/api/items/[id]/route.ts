import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapKnowledgeItem, VAULT_BUCKET } from '@/lib/supabase/vault';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: item, error } = await supabase
      .from('knowledge_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    let signedUrl: string | undefined;
    if (item.file_path) {
      const { data } = await supabase.storage.from(VAULT_BUCKET).createSignedUrl(item.file_path, 60 * 60);
      signedUrl = data?.signedUrl;
    }

    return NextResponse.json(mapKnowledgeItem(item, signedUrl));
  } catch (error) {
    console.error('Failed to get item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.bookmarked === 'boolean') {
      updates.bookmarked = body.bookmarked;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No supported updates provided' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('knowledge_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    let signedUrl: string | undefined;
    if (item.file_path) {
      const { data } = await supabase.storage.from(VAULT_BUCKET).createSignedUrl(item.file_path, 60 * 60);
      signedUrl = data?.signedUrl;
    }

    return NextResponse.json(mapKnowledgeItem(item, signedUrl));
  } catch (error) {
    console.error('Failed to update item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: deletedItem, error } = await supabase
      .from('knowledge_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('file_path')
      .single();

    if (error || !deletedItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (deletedItem.file_path) {
      await supabase.storage.from(VAULT_BUCKET).remove([deletedItem.file_path]);
    }

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Failed to delete item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
