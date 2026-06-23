import { NextRequest, NextResponse } from 'next/server';
import { summarizeAndExtract } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { attachSignedUrls, mapKnowledgeItem, matchesSearch, VAULT_BUCKET } from '@/lib/supabase/vault';

function getYouTubeThumbnail(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` : null;
}

function getFaviconOrLogo(urlInput: string): string | null {
  try {
    if (!urlInput) return null;
    const urlObj = new URL(urlInput);
    const domain = urlObj.hostname.replace('www.', '');
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  } catch {
    return null;
  }
}

function getFileExtension(fileName: string | undefined, mimeType: string | undefined) {
  const fromName = fileName?.split('.').pop()?.toLowerCase();
  if (fromName) {
    return fromName;
  }

  const lookup: Record<string, string> = {
    'application/pdf': 'pdf',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/webm': 'webm',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mp4': 'm4a',
    'audio/m4a': 'm4a',
  };

  return lookup[mimeType ?? ''] ?? 'bin';
}

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
    const search = searchParams.get('q')?.trim();

    let query = supabase
      .from('knowledge_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type && type !== 'All Knowledge') {
      query = query.eq('item_type', type);
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
      return NextResponse.json({ error: 'Content, URL or File is required' }, { status: 400 });
    }

    let filePath: string | undefined;

    if (fileData?.base64 && fileData?.mimeType) {
      const extension = getFileExtension(fileData.name, fileData.mimeType);
      filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const fileBuffer = Buffer.from(fileData.base64, 'base64');

      const { error: uploadError } = await supabase.storage.from(VAULT_BUCKET).upload(filePath, fileBuffer, {
        contentType: fileData.mimeType,
        upsert: false,
      });

      if (uploadError) {
        throw uploadError;
      }
    }

    const analysisText = content || (fileData ? `File upload: ${fileData.name}` : '') || url;
    const aiAnalysis = await summarizeAndExtract(analysisText, url, requestedType, fileData);
    const summaryWithKeyPoints = [aiAnalysis.summary, ...aiAnalysis.keyPoints.map((point) => `- ${point}`)]
      .filter(Boolean)
      .join('\n');

    let finalImageUrl = '';
    const ytThumb = getYouTubeThumbnail(url || '');

    if (ytThumb) {
      finalImageUrl = ytThumb;
    } else if (url) {
      const brandLogo = getFaviconOrLogo(url);
      if (brandLogo) {
        finalImageUrl = brandLogo;
      }
    }

    if (!finalImageUrl) {
      const imagePlaceholders: Record<string, string> = {
        Articles: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=60',
        Videos: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=60',
        PDFs: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=60',
        'Social Links':
          'https://images.unsplash.com/photo-1611605698335-8b15d27e03f2?w=800&auto=format&fit=crop&q=60',
        'Voice Notes':
          'https://images.unsplash.com/photo-1484712401471-05c7215a39eb?w=800&auto=format&fit=crop&q=60',
      };
      finalImageUrl = imagePlaceholders[aiAnalysis.type] || imagePlaceholders.Articles;
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from('knowledge_items')
      .insert({
        user_id: user.id,
        title: aiAnalysis.title,
        content:
          content ||
          (fileData
            ? `Uploaded file: ${fileData.name} (${((fileData.size ?? 0) / 1024).toFixed(1)} KB)`
            : `Saved link or bookmark: ${url}`),
        summary: summaryWithKeyPoints,
        item_type: aiAnalysis.type,
        tags: aiAnalysis.tags,
        source: fileData ? fileData.name : aiAnalysis.source || 'Upload',
        author: aiAnalysis.author,
        url: url || null,
        flashcards: aiAnalysis.flashcards.map((card, index) => ({
          ...card,
          id: `fc-gen-${index}-${Date.now()}`,
        })),
        image_url: finalImageUrl,
        read_time: aiAnalysis.readTime,
        is_synthesized: true,
        bookmarked: false,
        file_path: filePath ?? null,
        file_mime: fileData?.mimeType ?? null,
        file_name: fileData?.name ?? null,
      })
      .select('*')
      .single();

    if (insertError || !insertedRow) {
      throw insertError ?? new Error('Failed to insert knowledge item.');
    }

    let signedUrl: string | undefined;
    if (insertedRow.file_path) {
      const { data } = await supabase.storage.from(VAULT_BUCKET).createSignedUrl(insertedRow.file_path, 60 * 60);
      signedUrl = data?.signedUrl;
    }

    return NextResponse.json(mapKnowledgeItem(insertedRow, signedUrl), { status: 201 });
  } catch (error) {
    console.error('Failed to create item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
