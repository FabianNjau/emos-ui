/**
 * MessageContent — lightweight structured content renderer for EMOS AI responses.
 * Renders a controlled Markdown/structured text subset:
 * paragraphs, headings, bold, italic, links, lists, tables,
 * code blocks, inline code, blockquotes, horizontal rules, callouts.
 *
 * Does NOT use external markdown libraries — zero dependencies.
 */
import React from 'react';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface CalloutBlock {
  type: 'callout';
  label?: string;
  body: InlineContent[];
}

interface TextSegment {
  type: 'text';
  text: string;
}

interface BoldSegment {
  type: 'bold';
  content: InlineContent[];
}

interface ItalicSegment {
  type: 'italic';
  content: InlineContent[];
}

interface CodeSegment {
  type: 'code';
  text: string;
}

interface LinkSegment {
  type: 'link';
  href: string;
  content: InlineContent[];
}

export type InlineContent =
  | CalloutBlock
  | TextSegment
  | BoldSegment
  | ItalicSegment
  | CodeSegment
  | LinkSegment;

export interface ParagraphBlock {
  type: 'paragraph';
  content: InlineContent[];
}

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  content: InlineContent[];
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  items: InlineContent[][];
}

export interface CodeBlock {
  type: 'code_block';
  lang?: string;
  code: string;
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface BlockquoteBlock {
  type: 'blockquote';
  content: InlineContent[];
}

export interface HRBlock {
  type: 'hr';
}

export type Block = ParagraphBlock | HeadingBlock | ListBlock | CodeBlock | TableBlock | BlockquoteBlock | HRBlock | CalloutBlock;

export interface MessageContentProps {
  blocks: Block[];
}

/* ── Inline parser ─────────────────────────────────────────────────────── */

function parseInline(raw: string): InlineContent[] {
  const segments: InlineContent[] = [];
  // Match bold, italic, inline code, links, then split off the rest
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    // Text before the match
    if (match.index > last) {
      segments.push({ type: 'text', text: raw.slice(last, match.index) });
    }

    const m = match[0];
    if (m.startsWith('**')) {
      segments.push({ type: 'bold', content: parseInline(m.slice(2, -2)) });
    } else if (m.startsWith('*')) {
      segments.push({ type: 'italic', content: parseInline(m.slice(1, -1)) });
    } else if (m.startsWith('`')) {
      segments.push({ type: 'code', text: m.slice(1, -1) });
    } else if (m.startsWith('[')) {
      segments.push({ type: 'link', href: match[3], content: parseInline(match[2]) });
    }

    last = match.index + m.length;
  }

  if (last < raw.length) {
    segments.push({ type: 'text', text: raw.slice(last) });
  }

  return segments;
}

/* ── Block parser ─────────────────────────────────────────────────────── */

function trimLines(text: string): string {
  return text.replace(/^\n+|\n+$/g, '');
}

function parseBody(raw: string): Block[] {
  const blocks: Block[] = [];
  const lines = raw.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings: # ## ###
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        content: parseInline(headingMatch[2]),
      });
      i++; continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i++; continue;
    }

    // Key takeaway callout (special block)
    const calloutMatch = line.match(/^(KEY TAKEAWAY|Key Takeaway|SUMMARY|Summary|NOTE|Note):?\s*$/i);
    if (calloutMatch) {
      // Collect body until blank line or new block
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^#{1,3}\s/)) {
        calloutLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'callout',
        label: calloutMatch[1].toUpperCase(),
        body: parseInline(calloutLines.join(' ')),
      } as CalloutBlock);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'blockquote', content: parseInline(quoteLines.join(' ')) });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: InlineContent[][] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\d+\.\s/, '')));
        i++;
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: InlineContent[][] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^[-*+]\s/, '')));
        i++;
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    // Code block ```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code_block', lang: lang || undefined, code: trimLines(codeLines.join('\n')) });
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].match(/^\|[\s|>-]+\|$/)) {
      const headerCells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
      const rows: string[][] = [];
      i += 2; // skip header + separator
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').filter(c => c.trim() !== '').map(c => c.trim());
        if (cells.length > 0) rows.push(cells);
        i++;
      }
      blocks.push({ type: 'table', headers: headerCells, rows });
      continue;
    }

    // Paragraph — collect consecutive non-empty lines
    if (line.trim() !== '') {
      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^#{1,3}\s/) && !lines[i].match(/^[-*+]\s/) && !lines[i].match(/^\d+\.\s/) && !lines[i].startsWith('```')) {
        paraLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'paragraph', content: parseInline(paraLines.join(' ')) });
      continue;
    }

    i++;
  }

  return blocks;
}

/* ── Inline renderers ──────────────────────────────────────────────────── */

function renderInline(content: InlineContent[]): React.ReactNode[] {
  return content.map((seg, i) => {
    switch (seg.type) {
      case 'text': return <React.Fragment key={i}>{seg.text}</React.Fragment>;
      case 'bold': return <strong key={i}>{renderInline(seg.content)}</strong>;
      case 'italic': return <em key={i}>{renderInline(seg.content)}</em>;
      case 'code': return <code key={i}>{seg.text}</code>;
      case 'link':
        return (
          <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer">
            {renderInline(seg.content)}
          </a>
        );
      case 'callout':
        return (
          <div key={i} className="chat-msg__callout">
            {seg.label && <div className="chat-msg__callout-label">{seg.label}</div>}
            <p>{renderInline(seg.body)}</p>
          </div>
        );
      default: return null;
    }
  });
}

/* ── Block renderer ────────────────────────────────────────────────────── */

function renderBlock(block: Block, index: number): React.ReactNode {
  switch (block.type) {
    case 'paragraph':
      return <p key={index}>{renderInline(block.content)}</p>;

    case 'heading':
      return React.createElement(
        `h${block.level}`,
        { key: index },
        renderInline(block.content)
      );

    case 'list':
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag key={index}>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      );

    case 'code_block':
      return (
        <pre key={index} data-lang={block.lang}>
          <code>{block.code}</code>
        </pre>
      );

    case 'table':
      return (
        <table key={index}>
          <thead>
            <tr>
              {block.headers.map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => <td key={j}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case 'blockquote':
      return <blockquote key={index}>{renderInline(block.content)}</blockquote>;

    case 'hr':
      return <hr key={index} />;

    case 'callout':
      return (
        <div key={index} className="chat-msg__callout">
          {block.label && <div className="chat-msg__callout-label">{block.label}</div>}
          <p>{renderInline(block.body)}</p>
        </div>
      );

    default:
      return null;
  }
}

/* ── Main component ────────────────────────────────────────────────────── */

/**
 * MessageContent — renders AI response content from a raw string.
 * Parses the string into structured blocks and renders them with EMOS styling.
 */
export function MessageContent({ content }: { content: string }): React.ReactNode {
  if (!content) return null;
  const blocks = parseBody(content);
  return <>{blocks.map((block, i) => renderBlock(block, i))}</>;
}
