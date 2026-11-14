// frontend/lib/mentor/richLessonContent.ts
/**
 * RISSE AI — Rich Lesson Content Sanitizer & Legacy Markdown Bridge
 *
 * Provides:
 * 1. Strict HTML sanitization (DOMPurify in browser + deterministic allowlist
 *    sanitizer in Node/SSR) for rich-text lesson content edited in Module Studio
 *    and rendered in CheckpointContentView for students.
 * 2. Seamless one-way promotion of legacy Markdown lesson text into clean
 *    semantic HTML when opened in the Word-style inline editor so teachers
 *    never see or type Markdown syntax (##, **, etc.).
 * 3. Unified rendering for CheckpointContentView supporting both rich HTML
 *    and existing Markdown lessons while preserving exact student styling.
 */

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'br', 'hr',
  'span', 'mark', 'code', 'pre', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'img', 'a',
]);

const DROP_CONTENT_TAGS = [
  'script', 'style', 'iframe', 'object', 'embed',
  'applet', 'meta', 'link', 'base', 'form', 'svg', 'math',
];

const RICH_HTML_TAG_PATTERN = /<\/?(?:p|h[1-6]|ul|ol|li|strong|b|em|i|u|s|span|mark|blockquote|table|thead|tbody|tr|th|td|img|br|hr|pre|code)(?:\s[^<>]*|\s*\/?)>/i;

const SAFE_COLOR_VALUE = /^(?:#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|inherit|currentColor|transparent|[a-zA-Z]{3,20})$/;
const SAFE_FONT_SIZE_VALUE = /^(?:(?:[89]|[1-4]\d|5[0-6])(?:\.\d+)?(?:px|pt)|(?:0\.(?:75|8|85|875|9)|[12](?:\.\d+)?|3(?:\.0+)?)r?em)$/;
const SAFE_TEXT_ALIGN_VALUE = /^(?:left|center|right|justify|start|end)$/i;
const SAFE_CLASS_TOKEN = /^[a-zA-Z0-9_-]{1,48}$/;

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Strictly filters inline CSS style declarations to the 4 formatting properties
 * used by the Module Studio rich-text toolbar:
 *   - color
 *   - background-color
 *   - font-size
 *   - text-align
 */
export function sanitizeInlineStyle(styleValue: string): string {
  if (!styleValue || typeof styleValue !== 'string') return '';

  const DANGEROUS_DECLARATION = /url\s*\(|expression\s*\(|javascript:|vbscript:|@import|-moz-binding|behavior\s*:/i;

  const cleanDecls: string[] = [];
  const parts = styleValue.split(';');

  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx <= 0) continue;
    const prop = part.slice(0, colonIdx).trim().toLowerCase();
    const val = part.slice(colonIdx + 1).trim();
    if (!val) continue;
    // Drop only the offending declaration, keeping other valid formatting
    if (DANGEROUS_DECLARATION.test(prop) || DANGEROUS_DECLARATION.test(val)) continue;

    if ((prop === 'color' || prop === 'background-color') && SAFE_COLOR_VALUE.test(val)) {
      cleanDecls.push(`${prop}: ${val}`);
    } else if (prop === 'font-size' && SAFE_FONT_SIZE_VALUE.test(val)) {
      cleanDecls.push(`${prop}: ${val}`);
    } else if (prop === 'text-align' && SAFE_TEXT_ALIGN_VALUE.test(val)) {
      cleanDecls.push(`${prop}: ${val.toLowerCase()}`);
    }
  }

  return cleanDecls.join('; ');
}

function isSafeImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (/^(?:https?:\/\/|\/)/i.test(trimmed)) return true;
  if (/^data:image\/(?:png|jpeg|jpg|gif|webp);base64,[a-zA-Z0-9+/=\s]+$/i.test(trimmed)) return true;
  return false;
}

function isSafeLinkHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  return /^(?:https?:\/\/|mailto:|\/|#)/i.test(trimmed);
}

function sanitizeTagAttributes(tagName: string, rawAttrs: string): string {
  if (!rawAttrs || !rawAttrs.trim()) return '';
  const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const kept: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(rawAttrs)) !== null) {
    const name = match[1].toLowerCase();
    if (name.startsWith('on')) continue; // Never allow inline event handlers

    const value = (match[2] ?? match[3] ?? match[4] ?? '').trim();

    if (name === 'style') {
      const safeStyle = sanitizeInlineStyle(value);
      if (safeStyle) kept.push(`style="${escapeAttr(safeStyle)}"`);
    } else if (name === 'class') {
      const safeClasses = value
        .split(/\s+/)
        .filter(tok => SAFE_CLASS_TOKEN.test(tok));
      if (safeClasses.length > 0) {
        kept.push(`class="${escapeAttr(safeClasses.join(' '))}"`);
      }
    } else if (name === 'data-color' && tagName === 'mark') {
      if (SAFE_COLOR_VALUE.test(value)) {
        kept.push(`data-color="${escapeAttr(value)}"`);
      }
    } else if (tagName === 'img') {
      if (name === 'src' && isSafeImageSrc(value)) {
        kept.push(`src="${escapeAttr(value)}"`);
      } else if (name === 'alt' || name === 'title') {
        kept.push(`${name}="${escapeAttr(value)}"`);
      }
    } else if (tagName === 'a') {
      if (name === 'href' && isSafeLinkHref(value)) {
        kept.push(`href="${escapeAttr(value)}"`);
        kept.push('rel="noopener noreferrer"');
      } else if (name === 'title') {
        kept.push(`title="${escapeAttr(value)}"`);
      } else if (name === 'target' && (value === '_blank' || value === '_self')) {
        kept.push(`target="${value}"`);
      }
    } else if ((tagName === 'td' || tagName === 'th') && (name === 'colspan' || name === 'rowspan')) {
      const num = parseInt(value, 10);
      if (Number.isFinite(num) && num >= 1 && num <= 20) {
        kept.push(`${name}="${num}"`);
      }
    }
  }

  return kept.length > 0 ? ` ${kept.join(' ')}` : '';
}

function deterministicAllowlistSanitize(input: string): string {
  if (!input) return '';

  let cleaned = input;
  // 1. Remove dangerous container tags and their inner payloads completely
  for (const badTag of DROP_CONTENT_TAGS) {
    const blockRe = new RegExp(`<${badTag}\\b[^>]*>[\\s\\S]*?<\\/${badTag}\\s*>`, 'gi');
    const selfRe = new RegExp(`<${badTag}\\b[^>]*\\/?>`, 'gi');
    cleaned = cleaned.replace(blockRe, '').replace(selfRe, '');
  }

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Sanitize every remaining HTML tag against ALLOWED_TAGS + attribute allowlist
  cleaned = cleaned.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*?)>/g, (full, rawTag, attrs) => {
    const tag = String(rawTag).toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }
    if (full.startsWith('</')) {
      if (tag === 'br' || tag === 'hr' || tag === 'img') return '';
      return `</${tag}>`;
    }
    const safeAttrs = sanitizeTagAttributes(tag, attrs || '');
    if (tag === 'img' && !safeAttrs.includes('src="')) {
      return '';
    }
    // Void elements are always emitted self-closed; every other tag keeps its pair.
    if (tag === 'br' || tag === 'hr') {
      return `<${tag}>`;
    }
    if (tag === 'img') {
      return `<img${safeAttrs} />`;
    }
    return `<${tag}${safeAttrs}>`;
  });

  return cleaned;
}

/**
 * Sanitizes rich HTML lesson content for both storage and student rendering.
 * Uses DOMPurify when a browser DOM is available, followed by strict inline CSS
 * property allowlisting so works identically in browser and Node test environments.
 */
/**
 * Counts structural block tags. Used only to detect a sanitizer that has
 * silently unwrapped allowed markup (see `sanitizeLessonHtml`).
 */
function structureScore(html: string): number {
  const matches = html.match(/<(h[1-6]|ul|ol|table|thead|tbody|tr|td|th|blockquote|pre|figure|figcaption)\b/gi);
  return matches ? matches.length : 0;
}

export function sanitizeLessonHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let intermediate = html;

  const hasBrowserDom =
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof DOMPurify?.sanitize === 'function';

  // ALWAYS run the deterministic allowlist first. It is a complete allowlist on
  // its own, so the DOMPurify pass below is defence in depth rather than the
  // thing that decides what survives.
  const deterministic = deterministicAllowlistSanitize(html);
  if (!hasBrowserDom) return deterministic.trim();

  {
    try {
      intermediate = DOMPurify.sanitize(deterministic, {
        ALLOWED_TAGS: Array.from(ALLOWED_TAGS),
        ALLOWED_ATTR: [
          'style', 'class', 'data-color',
          'src', 'alt', 'title',
          'href', 'target', 'rel',
          'colspan', 'rowspan',
        ],
        FORBID_TAGS: DROP_CONTENT_TAGS,
        ALLOW_DATA_ATTR: false,
      });
    } catch (_) {
      intermediate = deterministic;
    }
  }

  const purified = deterministicAllowlistSanitize(intermediate);

  /*
   * A DOM present at import time is not proof that DOMPurify is functional.
   * Under a partial DOM (SSR shim, lightweight test DOM) it can return text with
   * the markup unwrapped, which silently deleted lesson headings — `<h2>` became
   * a bare line of text. Both passes are allowlist-based, so keeping whichever
   * one retains the structure is always safe and never lets anything through
   * that the allowlist would have removed.
   */
  return (structureScore(purified) >= structureScore(deterministic) ? purified : deterministic).trim();
}

/**
 * Detects whether a lesson text string already contains rich HTML markup
 * (as opposed to plain text or legacy Markdown).
 */
export function isRichHtmlContent(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== 'string') return false;
  return RICH_HTML_TAG_PATTERN.test(raw);
}

function formatInlineMarkdown(escapedLine: string, useStudentMdClasses: boolean): string {
  let out = escapedLine;

  // Markdown inline images ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt, url) => {
    const decodedUrl = url.replace(/&amp;/g, '&');
    if (!isSafeImageSrc(decodedUrl)) return alt || '';
    return `<img src="${escapeAttr(decodedUrl)}" alt="${escapeAttr(alt || '')}" />`;
  });

  // Inline code `code` (protect from bold/italic inside backticks)
  const codePlaceholders: string[] = [];
  out = out.replace(/`([^`]+)`/g, (_m, codeInner) => {
    const idx = codePlaceholders.length;
    const cls = useStudentMdClasses ? ' class="md-inline-code"' : '';
    codePlaceholders.push(`<code${cls}>${codeInner}</code>`);
    return `\u0000CODE_${idx}\u0000`;
  });

  // Bold + Italic, Bold, Italic
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^\*])\*([^\*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');

  // Restore inline code
  out = out.replace(/\u0000CODE_(\d+)\u0000/g, (_m, idx) => codePlaceholders[Number(idx)] || '');

  return out;
}

/**
 * Converts legacy Markdown / plain text into semantic HTML.
 * - When `useStudentMdClasses = true`, preserves `.md-h1`, `.md-h2`, `.md-h3`, `.md-p`,
 *   `.md-ul`, `.md-ol`, `.md-li`, `.md-code-block`, `.md-inline-code` classes.
 * - When `useStudentMdClasses = false` (for loading into the WYSIWYG editor), emits
 *   clean semantic HTML so Tiptap recognizes headings, lists, bold, italic, and code
 *   without showing raw Markdown characters (`##`, `**`, `- `) to the teacher.
 */
export function markdownToRichHtml(
  markdown: string,
  options: { useStudentMdClasses?: boolean } = {}
): string {
  if (!markdown || typeof markdown !== 'string') return '';
  const useMdCls = Boolean(options.useStudentMdClasses);

  // Normalize line endings
  const normalized = markdown.replace(/\r\n/g, '\n');

  // Extract fenced code blocks first
  const codeBlocks: string[] = [];
  const withCodePlaceholders = normalized.replace(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g, (_m, _lang, codeBody) => {
    const idx = codeBlocks.length;
    const cls = useMdCls ? ' class="md-code-block"' : '';
    codeBlocks.push(`<pre${cls}><code>${escapeHtml(codeBody.replace(/\n$/, ''))}</code></pre>`);
    return `\n\u0000FENCED_${idx}\u0000\n`;
  });

  const lines = withCodePlaceholders.split('\n');
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block placeholder
    const fencedMatch = trimmed.match(/^\u0000FENCED_(\d+)\u0000$/);
    if (fencedMatch) {
      blocks.push(codeBlocks[Number(fencedMatch[1])] || '');
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
      blocks.push('<hr>');
      i++;
      continue;
    }

    // Headings (###, ##, #)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const hashes = headingMatch[1].length;
      const content = formatInlineMarkdown(escapeHtml(headingMatch[2].trim()), useMdCls);
      if (useMdCls) {
        if (hashes === 1) blocks.push(`<h2 class="md-h1">${content}</h2>`);
        else if (hashes === 2) blocks.push(`<h3 class="md-h2">${content}</h3>`);
        else blocks.push(`<h4 class="md-h3">${content}</h4>`);
      } else {
        const level = Math.min(3, hashes);
        blocks.push(`<h${level}>${content}</h${level}>`);
      }
      i++;
      continue;
    }

    // Markdown pipe table
    if (
      trimmed.startsWith('|') &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      const parseCells = (row: string) =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map(c => formatInlineMarkdown(escapeHtml(c.trim()), useMdCls));

      const headerCells = parseCells(rawLine);
      i += 2; // skip header + separator
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        bodyRows.push(parseCells(lines[i]));
        i++;
      }

      const thead = `<thead><tr>${headerCells.map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
      const tbody = bodyRows.length
        ? `<tbody>${bodyRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`
        : '';
      blocks.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    // Unordered list (- or *)
    if (/^\s*[-*]\s+/.test(rawLine)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, '').trim();
        const liCls = useMdCls ? ' class="md-li"' : '';
        items.push(`<li${liCls}>${formatInlineMarkdown(escapeHtml(itemText), useMdCls)}</li>`);
        i++;
      }
      const ulCls = useMdCls ? ' class="md-ul"' : '';
      blocks.push(`<ul${ulCls}>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list (1. 2. ...)
    if (/^\s*\d+[.)]\s+/.test(rawLine)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+[.)]\s+/, '').trim();
        const liCls = useMdCls ? ' class="md-li"' : '';
        items.push(`<li${liCls}>${formatInlineMarkdown(escapeHtml(itemText), useMdCls)}</li>`);
        i++;
      }
      const olCls = useMdCls ? ' class="md-ol"' : '';
      blocks.push(`<ol${olCls}>${items.join('')}</ol>`);
      continue;
    }

    // Blockquote (> ...)
    if (/^\s*>\s?/.test(rawLine)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(formatInlineMarkdown(escapeHtml(lines[i].replace(/^\s*>\s?/, '')), useMdCls));
        i++;
      }
      blocks.push(`<blockquote><p>${quoteLines.join('<br>')}</p></blockquote>`);
      continue;
    }

    // Standard paragraph (collect consecutive non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^\u0000FENCED_\d+\u0000$/.test(lines[i].trim()) &&
      !/^(#{1,4})\s+/.test(lines[i].trim()) &&
      !/^(?:---|\*\*\*|___)\s*$/.test(lines[i].trim()) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i])
    ) {
      paraLines.push(formatInlineMarkdown(escapeHtml(lines[i]), useMdCls));
      i++;
    }
    const pCls = useMdCls ? ' class="md-p"' : '';
    blocks.push(`<p${pCls}>${paraLines.join('<br>')}</p>`);
  }

  return sanitizeLessonHtml(blocks.join('\n'));
}

/**
 * Prepares stored lesson content (whether rich HTML or legacy Markdown/plain text)
 * for loading into the Tiptap WYSIWYG editor so teachers never see raw Markdown syntax.
 */
export function prepareContentForEditor(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return '<p></p>';
  }
  if (isRichHtmlContent(raw)) {
    return sanitizeLessonHtml(raw);
  }
  return markdownToRichHtml(raw, { useStudentMdClasses: false });
}

/**
 * Renders stored lesson content (whether rich HTML from the Word-style editor
 * or legacy Markdown/plain text) safely for both Student View and Preview View.
 */
export function renderLessonRichHtml(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return '';
  }
  if (isRichHtmlContent(raw)) {
    return sanitizeLessonHtml(raw);
  }
  return markdownToRichHtml(raw, { useStudentMdClasses: true });
}

/**
 * Converts rich HTML or Markdown into clean plain text for AI Tutor RAG context.
 */
export function stripRichHtmlToPlainText(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|h[1-6]|li|tr|blockquote|pre)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
