import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createChatSession, getOrCreateLatestChatSession, listChatSessions } from '@/lib/vault/chat';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await listChatSessions(supabase, user.id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to list chat sessions:', error);
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

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title : undefined;
    const useLatest = body?.useLatest === true;

    const session = useLatest
      ? await getOrCreateLatestChatSession(supabase, user.id)
      : await createChatSession(supabase, user.id, title);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create chat session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
