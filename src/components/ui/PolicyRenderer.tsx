'use client';

import React from 'react';
import Link from 'next/link';

interface PolicyRendererProps {
  content: string;
}

export default function PolicyRenderer({ content }: PolicyRendererProps) {
  const parseBlocks = (raw: string) => {
    const lines = raw.split('\n');
    const blocks: { type: 'h2' | 'h3' | 'p' | 'ul' | 'alert' | 'quote' | 'raw'; content: string; extra?: string }[] = [];
    
    let currentUl: string[] = [];
    let currentAlert: { type: string; lines: string[] } | null = null;
    let currentParagraph: string[] = [];

    const flushUl = () => {
      if (currentUl.length > 0) {
        blocks.push({ type: 'ul', content: currentUl.join('\n') });
        currentUl = [];
      }
    };

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        blocks.push({ type: 'p', content: currentParagraph.join(' ') });
        currentParagraph = [];
      }
    };

    const flushAlert = () => {
      if (currentAlert) {
        blocks.push({
          type: 'alert',
          extra: currentAlert.type,
          content: currentAlert.lines.join('\n'),
        });
        currentAlert = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushUl();
        flushAlert();
        continue;
      }

      // Check alert box (> [!WARNING] or > [!IMPORTANT] or > [!NOTE])
      if (trimmed.startsWith('> [!') && trimmed.endsWith(']')) {
        flushParagraph();
        flushUl();
        const alertType = trimmed.substring(4, trimmed.length - 1).toUpperCase();
        currentAlert = { type: alertType, lines: [] };
        continue;
      }

      if (currentAlert && trimmed.startsWith('>')) {
        currentAlert.lines.push(trimmed.replace(/^>\s?/, ''));
        continue;
      } else if (currentAlert) {
        flushAlert();
      }

      // Headings
      if (trimmed.startsWith('## ')) {
        flushParagraph();
        flushUl();
        blocks.push({ type: 'h2', content: trimmed.replace(/^##\s+/, '') });
        continue;
      }

      if (trimmed.startsWith('### ')) {
        flushParagraph();
        flushUl();
        blocks.push({ type: 'h3', content: trimmed.replace(/^###\s+/, '') });
        continue;
      }

      // Unordered lists (- or *)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        flushParagraph();
        currentUl.push(trimmed.replace(/^[-*]\s+/, ''));
        continue;
      }

      // Blockquotes without alert tags
      if (trimmed.startsWith('> ')) {
        flushParagraph();
        flushUl();
        blocks.push({ type: 'quote', content: trimmed.replace(/^>\s+/, '') });
        continue;
      }

      // Normal paragraph text
      flushUl();
      currentParagraph.push(trimmed);
    }

    flushParagraph();
    flushUl();
    flushAlert();

    return blocks;
  };

  const renderInlineFormatted = (text: string) => {
    // Process **bold**
    const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-stone-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          const [, label, href] = linkMatch;
          return (
            <Link
              key={index}
              href={href}
              className="text-rose-700 underline underline-offset-2 hover:text-rose-800"
            >
              {label}
            </Link>
          );
        }
      }
      return part;
    });
  };

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-5 text-stone-700 leading-relaxed text-xs sm:text-sm">
      {blocks.map((block, idx) => {
        if (block.type === 'h2') {
          return (
            <h2
              key={idx}
              className="text-lg sm:text-xl font-bold font-serif text-stone-900 border-l-4 border-rose-700 pl-3 pt-3"
            >
              {block.content}
            </h2>
          );
        }

        if (block.type === 'h3') {
          return (
            <h3
              key={idx}
              className="text-sm sm:text-base font-bold text-stone-900 border-l-3 border-rose-600 pl-3 pt-3"
            >
              {block.content}
            </h3>
          );
        }

        if (block.type === 'ul') {
          const items = block.content.split('\n');
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5 marker:text-rose-700">
              {items.map((item, i) => (
                <li key={i}>{renderInlineFormatted(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'alert') {
          const alertType = block.extra;
          let borderClass = 'border-amber-300 bg-amber-50/80 text-amber-900';
          let badgeText = 'Notice';

          if (alertType === 'WARNING') {
            borderClass = 'border-rose-300 bg-rose-50/80 text-rose-950';
            badgeText = 'Critical Warning';
          } else if (alertType === 'IMPORTANT') {
            borderClass = 'border-amber-400 bg-amber-50/90 text-amber-950';
            badgeText = 'Statutory Notice';
          } else if (alertType === 'NOTE') {
            borderClass = 'border-rose-300 bg-rose-50/80 text-rose-950';
            badgeText = 'Security Protocol';
          }

          return (
            <div
              key={idx}
              className={`border rounded-lg p-4 my-3 text-xs sm:text-sm ${borderClass}`}
            >
              <div className="font-bold uppercase tracking-wider text-[10px] mb-1">
                {badgeText}
              </div>
              <div className="space-y-1 whitespace-pre-line leading-relaxed">
                {renderInlineFormatted(block.content)}
              </div>
            </div>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={idx}
              className="border-l-4 border-stone-300 pl-4 py-1 text-stone-600 italic text-xs sm:text-sm"
            >
              {renderInlineFormatted(block.content)}
            </blockquote>
          );
        }

        return (
          <p key={idx} className="text-stone-700 leading-relaxed">
            {renderInlineFormatted(block.content)}
          </p>
        );
      })}
    </div>
  );
}
