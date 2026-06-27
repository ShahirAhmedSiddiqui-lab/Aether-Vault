import { type BrainResponseStyle, type Flashcard, type KnowledgeItem } from '@/lib/db';
import { answerFromGeneralKnowledge, askSecondBrain, summarizeAndExtract } from '@/lib/gemini';

type UploadedFileData = {
  base64: string;
  mimeType: string;
  name?: string;
  size?: number;
};

type VaultChatHistory = {
  role: 'user' | 'model';
  content: string;
}[];

type VaultChatSource = {
  itemId: string;
  title: string;
  source: string;
  type: string;
};

type VaultChatResult = {
  answer: string;
  summaryBlock?: string;
  referencedSources: VaultChatSource[];
  tags: string[];
};

const MAX_RETRIEVED_ITEMS = 10;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'any',
  'about',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'there',
  'these',
  'this',
  'to',
  'was',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'with',
  'your',
]);

export async function generateKnowledgeItemAnalysis(
  content: string,
  sourceUrl?: string,
  customType?: 'Videos' | 'Articles' | 'PDFs' | 'Social Links' | 'Voice Notes' | 'Images',
  fileData?: UploadedFileData
): Promise<{
  title: string;
  summary: string;
  keyPoints: string[];
  type: 'Videos' | 'Articles' | 'PDFs' | 'Social Links' | 'Voice Notes' | 'Images';
  tags: string[];
  readTime: string;
  source: string;
  author?: string;
  flashcards: Omit<Flashcard, 'id'>[];
}> {
  return summarizeAndExtract(content, sourceUrl, customType, fileData);
}

export async function generateVaultChatAnswer(
  query: string,
  items: KnowledgeItem[],
  chatHistory: VaultChatHistory,
  options?: {
    responseStyle?: BrainResponseStyle;
  }
): Promise<VaultChatResult> {
  const readyItems = items.filter((item) => item.processingStatus === 'ready' && !item.deletedAt);
  const responseStyle = options?.responseStyle;

  if (readyItems.length === 0) {
    return buildNoResultsChatResponse(query, responseStyle);
  }

  const retrievedItems = retrieveRelevantVaultItems(query, readyItems);

  if (retrievedItems.length === 0) {
    return buildNoResultsChatResponse(query, responseStyle);
  }

  const response = await askSecondBrain(query, retrievedItems, chatHistory, responseStyle);
  const referencedSources = resolveReferencedSources(response.referencedSources, retrievedItems);

  return {
    answer: response.answer,
    summaryBlock: response.summaryBlock,
    referencedSources,
    tags: normalizeTags(response.tags, retrievedItems),
  };
}

function retrieveRelevantVaultItems(query: string, items: KnowledgeItem[]) {
  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  const broadOverviewIntent =
    tokens.length === 0
    || /(?:overview|summarize|summary|synthesis|synthesize|everything|all\s+(?:saved|vault)|entire\s+vault|saved\s+knowledge)/i.test(query);

  const scoredItems = items
    .map((item) => ({
      item,
      score: scoreKnowledgeItem(item, normalizedQuery, tokens, broadOverviewIntent),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || compareByRecency(left.item, right.item))
    .slice(0, MAX_RETRIEVED_ITEMS)
    .map((entry) => entry.item);

  if (scoredItems.length > 0) {
    return scoredItems;
  }

  if (broadOverviewIntent) {
    return [...items]
      .sort(compareByRecency)
      .slice(0, Math.min(MAX_RETRIEVED_ITEMS, items.length));
  }

  return [];
}

function scoreKnowledgeItem(
  item: KnowledgeItem,
  normalizedQuery: string,
  tokens: string[],
  broadOverviewIntent: boolean
) {
  if (broadOverviewIntent) {
    return 1;
  }

  const haystacks = {
    title: normalizeText(item.title),
    summary: normalizeText(item.summary),
    content: normalizeText(item.content),
    extractedText: normalizeText(item.extractedText ?? ''),
    tags: item.tags.map((tag) => normalizeText(tag)),
    source: normalizeText(item.source),
    author: normalizeText(item.author ?? ''),
    type: normalizeText(item.type),
  };

  let score = 0;

  if (normalizedQuery && haystacks.title.includes(normalizedQuery)) {
    score += 30;
  }
  if (normalizedQuery && haystacks.summary.includes(normalizedQuery)) {
    score += 24;
  }
  if (normalizedQuery && haystacks.extractedText.includes(normalizedQuery)) {
    score += 18;
  }
  if (normalizedQuery && haystacks.content.includes(normalizedQuery)) {
    score += 10;
  }

  for (const token of tokens) {
    if (haystacks.title.includes(token)) score += 12;
    if (haystacks.summary.includes(token)) score += 8;
    if (haystacks.extractedText.includes(token)) score += 7;
    if (haystacks.content.includes(token)) score += 4;
    if (haystacks.source.includes(token)) score += 7;
    if (haystacks.author.includes(token)) score += 6;
    if (haystacks.type.includes(token)) score += 5;
    if (haystacks.tags.some((tag) => tag.includes(token))) score += 8;
  }

  return score;
}

function resolveReferencedSources(
  sources: Array<{ title: string; source: string; type: string }> | undefined,
  items: KnowledgeItem[]
): VaultChatSource[] {
  const resolved = (sources ?? [])
    .map((source) => {
      const match = findMatchingItem(source, items);
      if (!match) {
        return null;
      }

      return {
        itemId: match.id,
        title: match.title,
        source: match.source,
        type: toCitationType(match.type),
      };
    })
    .filter((entry): entry is VaultChatSource => entry !== null);

  if (resolved.length > 0) {
    return dedupeSources(resolved);
  }

  return items.slice(0, Math.min(3, items.length)).map((item) => ({
    itemId: item.id,
    title: item.title,
    source: item.source,
    type: toCitationType(item.type),
  }));
}

function findMatchingItem(source: { title: string; source: string; type: string }, items: KnowledgeItem[]) {
  const normalizedTitle = normalizeText(source.title);
  const normalizedSource = normalizeText(source.source);
  const normalizedType = normalizeText(source.type);

  return items.find((item) => {
    const itemTitle = normalizeText(item.title);
    const itemSource = normalizeText(item.source);
    const itemType = normalizeText(toCitationType(item.type));

    return (
      itemTitle === normalizedTitle
      || itemTitle.includes(normalizedTitle)
      || normalizedTitle.includes(itemTitle)
      || (
        itemSource === normalizedSource
        && itemType === normalizedType
        && (itemTitle.includes(normalizedTitle) || normalizedTitle.includes(itemTitle))
      )
    );
  });
}

function normalizeTags(tags: string[] | undefined, items: KnowledgeItem[]) {
  const cleaned = (tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (cleaned.length > 0) {
    return cleaned;
  }

  return items.slice(0, 3).flatMap((item) => item.tags).filter(Boolean).slice(0, 3);
}

function dedupeSources(sources: VaultChatSource[]) {
  const seen = new Set<string>();

  return sources.filter((source) => {
    const key = `${source.itemId}:${source.title}:${source.source}:${source.type}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function compareByRecency(left: KnowledgeItem, right: KnowledgeItem) {
  return new Date(right.createdAtDate).getTime() - new Date(left.createdAtDate).getTime();
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function toCitationType(type: KnowledgeItem['type']) {
  switch (type) {
    case 'Videos':
      return 'video';
    case 'PDFs':
      return 'pdf';
    case 'Social Links':
      return 'tweet';
    case 'Voice Notes':
      return 'note';
    case 'Images':
      return 'note';
    default:
      return 'article';
  }
}

function buildEmptyVaultChatResponse(): VaultChatResult {
  return {
    answer: "I couldn't find any ready items in your vault yet.",
    summaryBlock:
      'Save or finish processing an article, video, PDF, social link, image, or voice note first, then ask again for a grounded answer.',
    referencedSources: [],
    tags: ['No Results', 'Empty Vault'],
  };
}

async function buildNoResultsChatResponse(
  query: string,
  responseStyle?: BrainResponseStyle
): Promise<VaultChatResult> {
  const generalResponse = await answerFromGeneralKnowledge(query, responseStyle);

  return {
    answer: generalResponse.answer,
    summaryBlock: generalResponse.summaryBlock,
    referencedSources: [],
    tags: generalResponse.tags ?? ['No Results', 'General Reasoning'],
  };
}
