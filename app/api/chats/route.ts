import { NextRequest, NextResponse } from 'next/server';
import { ApiRouteError, apiSuccess, handleApiRouteError, unauthorized } from '@/lib/api/errors';
import { logApiEvent } from '@/lib/api/logging';
import { enforceRateLimit } from '@/lib/api/rate-limit';
import { ensureObject, readJsonBody, readOptionalBoolean, readRequiredString } from '@/lib/api/validation';
import { generateVaultChatAnswer } from '@/lib/ai/service';
import { createClient } from '@/lib/supabase/server';
import { mapChatMessage, mapKnowledgeItem } from '@/lib/supabase/vault';
import { buildChatSessionTitle, getOrCreateLatestChatSession, touchChatSession } from '@/lib/vault/chat';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    const session = await getOrCreateLatestChatSession(supabase, user.id);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return apiSuccess((data ?? []).map(mapChatMessage));
  } catch (error) {
    return handleApiRouteError(error, 'chat.legacy.list');
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    enforceRateLimit({
      key: `chat:legacy:${user.id}`,
      limit: 20,
      windowMs: 60_000,
      message: 'Too many chat requests. Please wait a minute and try again.',
      code: 'chat_rate_limited',
    });

    const body = ensureObject(await readJsonBody(req));
    const query = readRequiredString(body.query, {
      field: 'Query',
      minLength: 1,
      maxLength: 2_000,
    });
    const persist = readOptionalBoolean(body.persist, 'persist') ?? true;

    const session = await getOrCreateLatestChatSession(supabase, user.id);

    const [{ data: existingChats, error: chatError }, { data: itemRows, error: itemError }] = await Promise.all([
      supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', session.id)
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
      return apiSuccess(
        {
          userMessage: {
            id: `preview-user-${Date.now()}`,
            sessionId: session.id,
            role: 'user',
            content: query,
            createdAt: 'Just now',
          },
          modelMessage: {
            id: `preview-model-${Date.now()}`,
            sessionId: session.id,
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
          session_id: session.id,
          role: 'user',
          content: query.trim(),
          summary_block: null,
          referenced_sources: [],
          tags: [],
        },
        {
          user_id: user.id,
          session_id: session.id,
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

    await touchChatSession(supabase, session.id, buildChatSessionTitle(query), lastMessageAt);

    const [userMessage, modelMessage] = insertedMessages.map(mapChatMessage);

    return apiSuccess(
      {
        userMessage,
        modelMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    logApiEvent('error', 'chat.legacy.send.failed', {
      cause: error instanceof Error ? error.message : 'Unknown error',
    });
    return handleApiRouteError(error, 'chat.legacy.send');
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    const { error } = await supabase.from('chat_sessions').delete().eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return apiSuccess({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    return handleApiRouteError(error, 'chat.legacy.clear');
  }
}
