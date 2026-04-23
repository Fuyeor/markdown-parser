// @fuyeor/markdown-parser/src/core/render.ts
import type { ASTNode } from '#/types';

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

export function render(nodes?: ASTNode[]): string {
  let html = '';

  if (!nodes || nodes.length === 0) return '';

  for (const node of nodes) {
    switch (node.type) {
      case 'heading':
        html += `<h${node.level}>${render(node.children)}</h${node.level}>\n`;
        break;
      case 'paragraph':
        html += `<p>${render(node.children)}</p>\n`;
        break;
      case 'text':
        html += node.content ? escapeHtml(node.content) : '';
        break;
      case 'bold':
        html += `<strong>${render(node.children)}</strong>`;
        break;
      case 'italic':
        html += `<em>${render(node.children)}</em>`;
        break;
      case 'underline':
        html += `<ins>${render(node.children)}</ins>`;
        break;
      case 'strike':
        html += `<del>${render(node.children)}</del>`;
        break;
      case 'inline_code':
        html += `<code>${node.content ? escapeHtml(node.content) : ''}</code>`;
        break;
      case 'link':
        html += `<a href="${escapeHtml(node.url)}">${render(node.children)}</a>`;
        break;
      case 'code_block':
        html += `<div class="code-block-wrapper">`;
        if (node.lang) {
          html += `<div class="code-lang">${escapeHtml(node.lang)}</div>`;
        }
        html += `<pre><code${node.lang ? ` class="language-${escapeHtml(node.lang)}"` : ''}>${node.content ? escapeHtml(node.content) : ''}\n</code></pre></div>\n`;
        break;
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
      case 'table':
        html += '<table>\n<thead>\n<tr>\n';
        node.headers.forEach((cell: any) => {
          html += `<th>${render(cell.children)}</th>\n`;
        });
        html += '</tr>\n</thead>\n';
        if (node.children && node.children.length > 0) {
          html += '<tbody>\n';
          node.children.forEach((row: any) => {
            html += '<tr>\n';
            row.children.forEach((cell: any) => {
              html += `<td>${render(cell.children)}</td>\n`;
            });
            html += '</tr>\n';
          });
          html += '</tbody>\n';
        }
        html += '</table>\n';
        break;
      case 'hr':
        html += '<hr />\n';
        break;
      case 'blockquote':
        html += `<blockquote>\n${render(node.children)}</blockquote>\n`;
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
