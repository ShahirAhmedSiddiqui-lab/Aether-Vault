import { NextRequest, NextResponse } from 'next/server';
import { generateVaultChatAnswer } from '@/lib/ai/service';
import { createClient } from '@/lib/supabase/server';
import { mapChatMessage, mapKnowledgeItem } from '@/lib/supabase/vault';
import {
  assertChatSessionOwnership,
  buildChatSessionTitle,
  getChatMessages,
  touchChatSession,
} from '@/lib/vault/chat';

export async function GET(_: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await getChatMessages(supabase, user.id, sessionId);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, persist = true } = await req.json();

    if (typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    await assertChatSessionOwnership(supabase, user.id, sessionId);

    const [{ data: existingChats, error: chatError }, { data: itemRows, error: itemError }] = await Promise.all([
      supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true }),
      supabase
        .from('knowledge_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('processing_status', 'ready')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
    ]);

    if (chatError) {
      throw chatError;
    }
    if (itemError) {
      throw itemError;
    }

    const items = (itemRows ?? []).map((row) => mapKnowledgeItem(row));
    const formattedHistory = (existingChats ?? []).map((chat) => ({
      role: chat.role,
      content: chat.content,
    }));
    const aiResponse = await generateVaultChatAnswer(query, items, formattedHistory);

    if (!persist) {
      return NextResponse.json(
        {
          userMessage: {
            id: `preview-user-${Date.now()}`,
            sessionId,
            role: 'user',
            content: query,
            createdAt: 'Just now',
          },
          modelMessage: {
            id: `preview-model-${Date.now()}`,
            sessionId,
            role: 'model',
            content: aiResponse.answer,
            summaryBlock: aiResponse.summaryBlock,
            referencedSources: aiResponse.referencedSources,
            tags: aiResponse.tags,
            createdAt: 'Just now',
          },
        },
        { status: 201 }
      );
    }

    const lastMessageAt = new Date().toISOString();
    const { data: insertedMessages, error: insertError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: user.id,
          session_id: sessionId,
          role: 'user',
          content: query.trim(),
          summary_block: null,
          referenced_sources: [],
          tags: [],
        },
        {
          user_id: user.id,
          session_id: sessionId,
          role: 'model',
          content: aiResponse.answer,
          summary_block: aiResponse.summaryBlock ?? null,
          referenced_sources: aiResponse.referencedSources ?? [],
          tags: aiResponse.tags ?? [],
        },
      ])
      .select('*');

    if (insertError || !insertedMessages || insertedMessages.length < 2) {
      throw insertError ?? new Error('Failed to persist chat messages.');
    }

    await touchChatSession(supabase, sessionId, buildChatSessionTitle(query), lastMessageAt);

    const [userMessage, modelMessage] = insertedMessages.map(mapChatMessage);

    return NextResponse.json(
      {
        userMessage,
        modelMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to send session message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await assertChatSessionOwnership(supabase, user.id, sessionId);

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)
      .eq('session_id', sessionId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Chat session cleared' });
  } catch (error) {
    console.error('Failed to clear session messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
