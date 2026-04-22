// @fuyeor/markdown-parser-lit/src/render.ts
import { html, type TemplateResult } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import type { ASTNode } from '@fuyeor/markdown-parser';

/**
 * recursively render AST nodes into Lit TemplateResult
 */
export function render(nodes?: ASTNode[]): (TemplateResult | string | null)[] {
  if (!nodes || nodes.length === 0) return [];

  return nodes.map((node) => {
    switch (node.type) {
      case 'heading': {
        const tagName = `h${node.level}`;
        return staticHtml`
          <${unsafeStatic(tagName)}>
            ${render(node.children)}
          </${unsafeStatic(tagName)}>
        `;
      }

      case 'paragraph':
        return html`<p>${render(node.children)}</p>`;

      case 'text':
        return node.content || '';

      case 'bold':
        return html`<strong>${render(node.children)}</strong>`;

      case 'italic':
        return html`<em>${render(node.children)}</em>`;

      case 'underline':
        return html`<u>${render(node.children)}</u>`;

      case 'strike':
        return html`<del>${render(node.children)}</del>`;

      case 'link':
        return html`<a href="${node.url}">${render(node.children)}</a>`;

      case 'inline_code':
        return html`<code>${node.content}</code>`;

      case 'color_code':
        return html`
          <code class="ffm-color-code">
            <span
              class="ffm-color-swatch"
              style="
                display: inline-block; 
                width: 0.8em; 
                height: 0.8em; 
                border-radius: 50%; 
                background-color: ${node.content}; 
                vertical-align: middle; 
                margin-right: 0.3em; 
                border: 1px solid #00000030;
              "
            ></span
            >${node.content}
          </code>
        `;

      case 'code_block':
        return html`
          <div class="code-block-wrapper">
            ${node.lang ? html`<div class="code-lang">${node.lang}</div>` : ''}
            <pre><code class="${node.lang
              ? `language-${node.lang}`
              : ''}">${node.content}</code></pre>
          </div>
        `;

      case 'list': {
        const tag = node.ordered ? 'ol' : 'ul';
        const startValue =
          node.ordered && node.start && node.start !== 1
            ? node.start
            : undefined;
        return staticHtml`
          <${unsafeStatic(tag)} start="${startValue || ''}">
            ${render(node.children)}
          </${unsafeStatic(tag)}>
        `;
      }

      case 'list_item':
        return html`<li>${render(node.children)}</li>`;

      case 'blockquote':
        return html`<blockquote>${render(node.children)}</blockquote>`;

      case 'hr':
        return html`<hr />`;

      case 'hardbreak':
        return html`<br />`;

      case 'table':
        return html`
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  ${node.headers.map(
                    (cell: any) => html`<th>${render(cell.children)}</th>`,
                  )}
                </tr>
              </thead>
              <tbody>
                ${node.children?.map(
                  (row: any) => html`
                    <tr>
                      ${row.children.map(
                        (cell: any) => html`<td>${render(cell.children)}</td>`,
                      )}
                    </tr>
                  `,
                )}
              </tbody>
            </table>
          </div>
        `;

      case 'accordion':
        return html`<div class="ffm-accordion">${render(node.children)}</div>`;

      case 'accordion_item':
        return html`
          <details name="${node.name}">
            <summary>${render(node.title)}</summary>
            <div class="accordion-content">${render(node.children)}</div>
          </details>
        `;

      // FFM Slide
      case 'slide':
        return html`
          <div class="slide-container-wrapper">
            <div class="slide-container">${render(node.children)}</div>
          </div>
        `;

      case 'slide_item':
        return html`<div class="slide-item">${render(node.children)}</div>`;

      // FFM Chain
      case 'chain':
        return html`<div class="chain-container">
          ${render(node.children)}
        </div>`;

      case 'chain_item': {
        const statusClass = node.hasCheckbox
          ? node.isCompleted
            ? 'is-completed'
            : 'is-pending'
          : '';

        return html`
          <div class="chain-item ${statusClass}">
            <div class="chain-marker"></div>
            <div class="chain-content-wrapper">
              ${node.title && node.title.length > 0
                ? html`<div class="chain-title">${render(node.title)}</div>`
                : ''}
              <div class="chain-body">${render(node.children)}</div>
            </div>
          </div>
        `;
      }

      default:
        // fallback render
        return node.children
          ? html`<span>${render(node.children)}</span>`
          : null;
    }
  });
}
