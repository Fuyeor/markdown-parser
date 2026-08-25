// @fuyeor/markdown-parser/src/core/render.ts
import type { ASTNode } from '#/types';
import { isSafeColorValue } from '#/core/color';
import { isSafeLinkUrl } from '#/core/url';

const escapeHtml = (str: string) =>
  str.replace(
    /[&<>"']/g,
    (m) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[m]!,
  );

// Keep dynamic HTML tag names and CSS values within their supported grammar.
const getHeadingLevel = (level: unknown) =>
  typeof level === 'number' &&
  Number.isInteger(level) &&
  level >= 1 &&
  level <= 6
    ? level
    : null;

// Keep table alignment attributes within the supported HTML grammar.
const getTableAlignment = (align: unknown) =>
  align === 'left' || align === 'center' || align === 'right'
    ? ` align="${align}"`
    : '';

const displayLanguageNames: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  cpp: 'C++',
  csharp: 'C#',
  xml: 'XML',
  json: 'JSON',
  yaml: 'YAML',
  ffm: 'Fuyeor Flavored Markdown',
  fon: 'FON',
  fer: 'Fer',
};

// Render a stable fenced-code contract for asynchronous highlight.js processing.
const getCodeLanguage = (lang: unknown): string => {
  if (typeof lang !== 'string') return '';
  return lang.trim().split(/\s+/u)[0] ?? '';
};

const getDisplayLanguageName = (language: string): string =>
  displayLanguageNames[language] ??
  (language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Text');

export function render(nodes?: ASTNode[]): string {
  let html = '';

  if (!nodes || nodes.length === 0) return '';

  for (const node of nodes) {
    switch (node.type) {
      case 'heading': {
        const level = getHeadingLevel(node.level);
        html +=
          level === null
            ? `<span>${render(node.children)}</span>`
            : `<h${level}>${render(node.children)}</h${level}>\n`;
        break;
      }
      case 'paragraph':
        html += `<p>${render(node.children)}</p>\n`;
        break;
      case 'text':
        html += node.content ? escapeHtml(node.content) : '';
        break;
      case 'emoji': {
        const emoji = String(node.content ?? '');
        const alt = String(node.alt ?? emoji);
        const src = String(node.src ?? '');
        html += `<img class="emoji" draggable="false" alt="${escapeHtml(alt)}" src="${escapeHtml(src)}"/>`;
        break;
      }
      case 'math_inline':
        html += `<span class="math-inline">${escapeHtml(String(node.content ?? ''))}</span>`;
        break;
      case 'math_block':
        html += `<div class="math-block">${escapeHtml(String(node.content ?? ''))}</div>\n`;
        break;
      case 'bold':
        html += `<strong>${render(node.children)}</strong>`;
        break;
      case 'italic':
        html += `<em>${render(node.children)}</em>`;
        break;
      case 'underline':
        html += `<u>${render(node.children)}</u>`;
        break;
      case 'strike':
        html += `<del>${render(node.children)}</del>`;
        break;
      case 'inline_code':
        html += `<code>${node.content ? escapeHtml(node.content) : ''}</code>`;
        break;
      case 'color_code': {
        const color = String(node.content ?? '');
        if (!isSafeColorValue(color)) {
          html += escapeHtml(color);
          break;
        }
        html += `<code class="ffm-color-code"><span class="ffm-color-swatch" style="display:inline-block;width:0.8em;height:0.8em;border-radius:50%;background-color:${escapeHtml(color)};vertical-align:middle;margin-right:0.3em;border:1px solid #00000030;"></span>${escapeHtml(color)}</code>`;
        break;
      }
      case 'link': {
        const url = String(node.url ?? '').trim();
        html += isSafeLinkUrl(url)
          ? `<a href="${escapeHtml(url)}">${render(node.children)}</a>`
          : render(node.children);
        break;
      }
      case 'code_block': {
        const language = getCodeLanguage(node.lang);
        const displayLanguage = getDisplayLanguageName(language);
        const preAttributes = language
          ? `class="hljs language-${escapeHtml(language)}" data-language="${escapeHtml(language)}"`
          : 'class="hljs language-plaintext"';
        html += `<div class="code-block-wrapper">`;
        if (language) {
          html += `<div class="code-lang">${escapeHtml(displayLanguage)}</div>`;
        }
        html += `<pre ${preAttributes}><code>${escapeHtml(String(node.content ?? ''))}\n</code></pre></div>\n`;
        break;
      }
      case 'list': {
        const tag = node.ordered ? 'ol' : 'ul';
        const start =
          node.ordered && node.start && node.start !== 1
            ? ` start="${node.start}"`
            : '';
        html += `<${tag}${start}>\n${render(node.children)}</${tag}>\n`;
        break;
      }
      case 'list_item':
        html += `<li>${render(node.children)}</li>\n`;
        break;
      case 'mermaid':
        html += `<div class="language-mermaid">${escapeHtml(String(node.content ?? ''))}</div>\n`;
        break;
      case 'abc':
        html += `<div class="language-abc">${escapeHtml(String(node.content ?? ''))}</div>\n`;
        break;
      case 'smiles_inline':
        html += `<span class="language-smiles smiles-inline" data-smiles="${escapeHtml(String(node.content ?? ''))}"></span>`;
        break;
      case 'smiles_block': {
        const blocks = String(node.content ?? '')
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map(
            (line) =>
              `<div class="language-smiles smiles-block" data-smiles="${escapeHtml(line.trim())}"></div>`,
          );
        html += blocks.length > 0 ? `${blocks.join('\n')}\n` : '';
        break;
      }
      case 'table': {
        html += '<table>\n';
        if (node.headers) {
          html += '<thead>\n<tr>\n';
          node.headers.forEach((cell) => {
            html += `<th${getTableAlignment(cell.align)}>${render(cell.children)}</th>\n`;
          });
          html += '</tr>\n</thead>\n';
        }
        if (node.children && node.children.length > 0) {
          html += '<tbody>\n';
          node.children.forEach((row) => {
            html += '<tr>\n';
            row.children?.forEach((cell) => {
              html += `<td${getTableAlignment(cell.align)}>${render(cell.children)}</td>\n`;
            });
            html += '</tr>\n';
          });
          html += '</tbody>\n';
        }
        html += '</table>\n';
        break;
      }
      case 'hr':
        html += '<hr />\n';
        break;
      case 'blockquote':
        html += `<blockquote>\n${render(node.children)}</blockquote>\n`;
        break;
      case 'accordion':
        html += `<div class="ffm-accordion">${render(node.children)}</div>`;
        break;
      case 'accordion_item':
        html += `<details name="${escapeHtml(String(node.name ?? ''))}"><summary>${render(node.title)}</summary><div class="accordion-content">${render(node.children)}</div></details>`;
        break;
      case 'chain':
        html += `<div class="chain-container">${render(node.children)}</div>`;
        break;
      case 'chain_item': {
        const statusClass = node.hasCheckbox
          ? node.isCompleted
            ? 'is-completed'
            : 'is-pending'
          : '';
        const title =
          node.title && node.title.length > 0
            ? `<div class="chain-title">${render(node.title)}</div>`
            : '';
        html += `<div class="chain-item ${statusClass}"><div class="chain-marker"></div><div class="chain-content-wrapper">${title}<div class="chain-body">${render(node.children)}</div></div></div>`;
        break;
      }
      case 'slide':
        html += `<div class="slide-container-wrapper"><div class="slide-container">${render(node.children)}</div></div>`;
        break;
      case 'slide_item':
        html += `<div class="slide-item">${render(node.children)}</div>`;
        break;
      case 'hardbreak':
        html += '<br />\n';
        break;
      default:
        html += `<span>${render(node.children)}</span>`;
        break;
    }
  }

  return html;
}
