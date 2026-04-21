// @fuyeor/markdown-parser/test/ast-to-html.ts
import type { ASTNode } from '../src/types';

/**
 * This is a simple escape function used to render an AST into an HTML string
 * that conforms to CommonMark expectations
 * For compliance testing only.
 */
export function astToHtml(nodes: ASTNode[]): string {
  let html = '';

  for (const node of nodes) {
    switch (node.type) {
      case 'heading':
        html += `<h${node.level}>${astToHtml(node.children || [])}</h${node.level}>\n`;
        break;
      case 'paragraph':
        html += `<p>${astToHtml(node.children || [])}</p>\n`;
        break;
      case 'text':
        html += node
          .content!.replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;');
        break;
      case 'bold':
        html += `<strong>${astToHtml(node.children || [])}</strong>`;
        break;
      case 'link':
        html += `<a href="${node.url}">${astToHtml(node.children || [])}</a>`;
        break;
      case 'code_block':
        const langClass = node.lang ? ` class="language-${node.lang}"` : '';
        const content =
          node.content !== null
            ? `${node.content!.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}\n`
            : '';
        html += `<pre><code${langClass}>${content}</code></pre>\n`;
        break;

      case 'list': {
        const tag = node.ordered ? 'ol' : 'ul';
        const start =
          node.start && node.start !== 1 ? ` start="${node.start}"` : '';
        html += `<${tag}${start}>\n${astToHtml(node.children || [])}</${tag}>\n`;
        break;
      }

      case 'list_item': {
        html += `<li>${astToHtml(node.children || [])}</li>\n`;
        break;
      }
      case 'table':
        html += '<table>\n<thead>\n<tr>\n';
        node.headers.forEach((cell: any) => {
          html += `<th>${astToHtml(cell.children)}</th>\n`;
        });
        html += '</tr>\n</thead>\n';
        if (node.children && node.children.length > 0) {
          html += '<tbody>\n';
          node.children.forEach((row: any) => {
            html += '<tr>\n';
            row.children.forEach((cell: any) => {
              html += `<td>${astToHtml(cell.children)}</td>\n`;
            });
            html += '</tr>\n';
          });
          html += '<tbody>\n';
        }
        html += '</table>\n';
        break;
      case 'hr':
        html += '<hr />\n';
        break;
      case 'blockquote':
        html += `<blockquote>\n${astToHtml(node.children || [])}</blockquote>\n`;
        break;
      case 'hardbreak':
        html += '<br />\n';
        break;
    }
  }

  return html;
}
