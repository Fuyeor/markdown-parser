// @ffm/parser/src/core/render.ts
import { isSafeColorValue } from '#/core/color';
import { isSafeLinkUrl } from '#/core/url';
import type {
  ASTNode,
  NodeRenderer,
  RenderContext,
  RenderOption,
} from '#/type';

export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char]!,
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
const getTableAlign = (align: unknown) =>
  align === 'left' || align === 'center' || align === 'right'
    ? ` align="${align}"`
    : '';

// Render AST into HTML; custom renderers override built-in branches per node type.
export function render(nodeArray?: ASTNode[], option?: RenderOption): string {
  return renderNodes(nodeArray, option?.nodeRenderer);
}

function renderNodes(
  nodeArray: ASTNode[] | undefined,
  custom: Record<string, NodeRenderer> | undefined,
): string {
  if (!nodeArray || nodeArray.length === 0) return '';

  const ctx: RenderContext = {
    escapeHtml,
    render: (children) => renderNodes(children, custom),
  };

  let html = '';
  for (const node of nodeArray) {
    const renderer = custom?.[node.type];
    if (renderer) {
      html += renderer(node, ctx);
      continue;
    }

    switch (node.type) {
      case 'heading': {
        const level = getHeadingLevel(node.level);
        html +=
          level === null
            ? `<span>${ctx.render(node.content)}</span>`
            : `<h${level}>${ctx.render(node.content)}</h${level}>\n`;
        break;
      }
      case 'paragraph':
        html += `<p>${ctx.render(node.content)}</p>\n`;
        break;
      case 'text':
        html += node.value ? escapeHtml(node.value) : '';
        break;
      case 'emoji': {
        const emoji = String(node.value ?? '');
        const alt = String(node.alt ?? emoji);
        const src = String(node.src ?? '');
        html += `<img class="emoji" draggable="false" alt="${escapeHtml(alt)}" src="${escapeHtml(src)}"/>`;
        break;
      }
      case 'math_inline':
        html += `<span class="math-inline" data-async="latex">${escapeHtml(String(node.value ?? ''))}</span>`;
        break;
      case 'math':
        html += `<div class="math-block" data-async="latex">${escapeHtml(String(node.value ?? ''))}</div>\n`;
        break;
      case 'bold':
        html += `<strong>${ctx.render(node.content)}</strong>`;
        break;
      case 'italic':
        html += `<em>${ctx.render(node.content)}</em>`;
        break;
      case 'underline':
        html += `<u>${ctx.render(node.content)}</u>`;
        break;
      case 'strike':
        html += `<del>${ctx.render(node.content)}</del>`;
        break;
      case 'code_inline':
        html += `<code>${node.value ? escapeHtml(node.value) : ''}</code>`;
        break;
      case 'code_color': {
        const color = String(node.value ?? '');
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
          ? `<a href="${escapeHtml(url)}">${ctx.render(node.content)}</a>`
          : ctx.render(node.content);
        break;
      }
      case 'code': {
        const language = node.lang;
        const escapedValue = escapeHtml(String(node.value ?? ''));
        html += '<div class="code-block-wrapper">';
        if (language) {
          const escapedLanguage = escapeHtml(language);
          html += `<div class="code-lang">${escapeHtml(language)}</div>`;
          html += `<pre data-language="${escapedLanguage}" data-async="hljs"><code class="language-${escapedLanguage}">${escapedValue}\n</code></pre>`;
        } else {
          html += `<pre><code class="hljs">${escapedValue}\n</code></pre>`;
        }
        html += '</div>\n';
        break;
      }
      case 'list': {
        const tag = node.ordered ? 'ol' : 'ul';
        const start =
          node.ordered && node.start && node.start !== 1
            ? ` start="${node.start}"`
            : '';
        html += `<${tag}${start}>\n${ctx.render(node.content)}</${tag}>\n`;
        break;
      }
      case 'list_item':
        html += `<li>${ctx.render(node.content)}</li>\n`;
        break;
      case 'mermaid':
        html += `<div class="language-mermaid" data-async="mermaid">${escapeHtml(String(node.value ?? ''))}</div>\n`;
        break;
      case 'abc':
        html += `<div class="language-abc" data-async="abc">${escapeHtml(String(node.value ?? ''))}</div>\n`;
        break;
      case 'smiles_inline':
        html += `<span class="language-smiles smiles-inline" data-async="smiles" data-smiles="${escapeHtml(String(node.value ?? ''))}"></span>`;
        break;
      case 'smiles': {
        const blocks = String(node.value ?? '')
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map(
            (line) =>
              `<div class="language-smiles smiles-block" data-async="smiles" data-smiles="${escapeHtml(line.trim())}"></div>`,
          );
        html += blocks.length > 0 ? `${blocks.join('\n')}\n` : '';
        break;
      }
      case 'table': {
        html += '<table>\n';
        if (node.header) {
          html += '<thead>\n<tr>\n';
          node.header.forEach((cell) => {
            html += `<th${getTableAlign(cell.align)}>${ctx.render(cell.content)}</th>\n`;
          });
          html += '</tr>\n</thead>\n';
        }
        if (node.content && node.content.length > 0) {
          html += '<tbody>\n';
          node.content.forEach((row) => {
            html += '<tr>\n';
            row.content?.forEach((cell) => {
              html += `<td${getTableAlign(cell.align)}>${ctx.render(cell.content)}</td>\n`;
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
        html += `<blockquote>\n${ctx.render(node.content)}</blockquote>\n`;
        break;
      case 'accordion':
        html += `<div class="ffm-accordion">${ctx.render(node.content)}</div>`;
        break;
      case 'accordion_item':
        html += `<details name="${escapeHtml(String(node.name ?? ''))}"><summary>${ctx.render(node.title)}</summary><div class="accordion-content">${ctx.render(node.content)}</div></details>`;
        break;
      case 'chain':
        html += `<div class="chain-container">${ctx.render(node.content)}</div>`;
        break;
      case 'chain_item': {
        const statusClass = node.hasCheckbox
          ? node.isCompleted
            ? 'is-completed'
            : 'is-pending'
          : '';
        const title =
          node.title && node.title.length > 0
            ? `<div class="chain-title">${ctx.render(node.title)}</div>`
            : '';
        html += `<div class="chain-item ${statusClass}"><div class="chain-marker"></div><div class="chain-content-wrapper">${title}<div class="chain-body">${ctx.render(node.content)}</div></div></div>`;
        break;
      }
      case 'slide':
        html += `<div class="slide-container-wrapper"><div class="slide-container">${ctx.render(node.content)}</div></div>`;
        break;
      case 'slide_item':
        html += `<div class="slide-item">${ctx.render(node.content)}</div>`;
        break;
      case 'hardbreak':
        html += '<br />\n';
        break;
      default:
        html += `<span>${ctx.render(node.content)}</span>`;
        break;
    }
  }
  return html;
}
