import { type SupabaseClient } from '@supabase/supabase-js';
import {
  ChatMessage,
  ChatReferencedSource,
  Flashcard,
  KnowledgeItem,
  formatRelativeDate,
  getOnboardingItem,
} from '@/lib/db';

export const VAULT_BUCKET = 'vault-files';

type JsonRecord = Record<string, unknown>;

type KnowledgeItemRow = {
  id: string;
  title: string;
  content: string;
  summary: string;
  item_type: KnowledgeItem['type'];
  tags: string[] | null;
  source: string;
  author: string | null;
  url: string | null;
  flashcards: unknown;
  image_url: string | null;
  read_time: string | null;
  is_synthesized: boolean;
  bookmarked: boolean;
  file_path: string | null;
  file_mime: string | null;
  file_name: string | null;
  created_at: string;
};

type ChatMessageRow = {
  id: string;
  role: ChatMessage['role'];
  content: string;
  summary_block: string | null;
  referenced_sources: unknown;
  tags: string[] | null;
  created_at: string;
};

function normalizeFlashcards(value: unknown): Flashcard[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      const card = (entry ?? {}) as JsonRecord;
      const question = typeof card.question === 'string' ? card.question : '';
      const answer = typeof card.answer === 'string' ? card.answer : '';

      if (!question || !answer) {
        return null;
      }

      return {
        id: typeof card.id === 'string' ? card.id : `flashcard-${index}`,
        type: typeof card.type === 'string' ? card.type : 'Concept',
        question,
        answer,
      };
    })
    .filter((entry): entry is Flashcard => entry !== null);
}

function normalizeReferencedSources(value: unknown): ChatReferencedSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const source = (entry ?? {}) as JsonRecord;
      const title = typeof source.title === 'string' ? source.title : '';
      const origin = typeof source.source === 'string' ? source.source : '';
      const type = typeof source.type === 'string' ? source.type : 'note';

      if (!title || !origin) {
        return null;
      }

      return { title, source: origin, type };
    })
    .filter((entry): entry is ChatReferencedSource => entry !== null);
}

export function mapKnowledgeItem(row: KnowledgeItemRow, fileUrl?: string): KnowledgeItem {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    type: row.item_type,
    tags: row.tags ?? [],
    createdAt: formatRelativeDate(row.created_at),
    createdAtDate: row.created_at,
    source: row.source,
    author: row.author ?? undefined,
    url: row.url ?? undefined,
    flashcards: normalizeFlashcards(row.flashcards),
    imageUrl: row.image_url ?? undefined,
    readTime: row.read_time ?? undefined,
    isSynthesized: row.is_synthesized,
    bookmarked: row.bookmarked,
    filePath: row.file_path ?? undefined,
    fileMime: row.file_mime ?? undefined,
    fileName: row.file_name ?? undefined,
    fileUrl,
  };
}

export function mapChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    summaryBlock: row.summary_block ?? undefined,
    referencedSources: normalizeReferencedSources(row.referenced_sources),
    tags: row.tags ?? [],
    createdAt: formatRelativeDate(row.created_at),
  };
}

export async function attachSignedUrls(
  supabase: SupabaseClient,
  rows: KnowledgeItemRow[]
): Promise<KnowledgeItem[]> {
  const items = await Promise.all(
    rows.map(async (row) => {
      if (!row.file_path) {
        return mapKnowledgeItem(row);
      }

      const { data } = await supabase.storage
        .from(VAULT_BUCKET)
        .createSignedUrl(row.file_path, 60 * 60);

      return mapKnowledgeItem(row, data?.signedUrl);
    })
  );

  return items.length > 0 ? items : [getOnboardingItem()];
}

export function matchesSearch(item: KnowledgeItem, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return (
    item.title.toLowerCase().includes(normalized) ||
    item.content.toLowerCase().includes(normalized) ||
    item.summary.toLowerCase().includes(normalized) ||
    item.tags.some((tag) => tag.toLowerCase().includes(normalized))
  );
}
