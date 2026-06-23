'use client';

import * as React from 'react';

export function FormattedMarkdown({ text }: { text: string }) {
  if (!text) return null;

  let processedText = text;
  if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(text.trim());
      processedText = parsed.answer || parsed.summaryBlock || parsed.summary || text;
    } catch {
      // Ignore invalid JSON-like strings and render the original text.
    }
  }

  const lines = processedText.split('\n');

  return (
    <div className="space-y-1 text-xs leading-relaxed font-sans">
      {lines.map((line, idx) => {
        let content = line;
        const isBullet = content.trim().startsWith('- ') || content.trim().startsWith('* ');

        if (isBullet) {
          content = content.trim().substring(2);
        }

        const parts: React.ReactNode[] = [];
        const boldRegex = /\*\*([^*]+)\*\*/g;
        let match: RegExpExecArray | null;
        let lastIndex = 0;

        while ((match = boldRegex.exec(content)) !== null) {
          if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
          }
          parts.push(
            <strong key={match.index} className="font-extrabold text-neutral-900 border-b border-neutral-100/10">
              {match[1]}
            </strong>
          );
          lastIndex = boldRegex.lastIndex;
        }

        if (lastIndex < content.length) {
          parts.push(content.substring(lastIndex));
        }

        const renderedLine = parts.length > 0 ? parts : content;

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start space-x-1.5 ml-2.5">
              <span className="text-neutral-400 mt-1 shrink-0 font-bold">&bull;</span>
              <span className="text-neutral-750">{renderedLine}</span>
            </div>
          );
        }

        if (content.trim() === '') {
          return <div key={idx} className="h-1.5" />;
        }

        return <p key={idx} className="text-neutral-750">{renderedLine}</p>;
      })}
    </div>
  );
}
