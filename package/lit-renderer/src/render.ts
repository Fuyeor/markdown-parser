// @ffm/lit-renderer/src/render.ts
import { html, type TemplateResult } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { isSafeColorValue, isSafeLinkUrl, type ASTNode } from '@ffm/parser';

/**
 * recursively render AST node into Lit TemplateResult
 */
export function render(node?: ASTNode[]): (TemplateResult | string | null)[] {
  if (!node || node.length === 0) return [];

  return node.map((node) => {
    switch (node.type) {
      case 'heading': {
        const level =
          typeof node.level === 'number' &&
          Number.isInteger(node.level) &&
          node.level >= 1 &&
          node.level <= 6
            ? node.level
            : null;
        if (level === null) return html`<span>${render(node.content)}</span>`;

        const tagName = `h${level}`;
        return staticHtml`
          <${unsafeStatic(tagName)}>
            ${render(node.content)}
          </${unsafeStatic(tagName)}>
        `;
      }

      case 'paragraph':
        return html`<p>${render(node.content)}</p>`;

      case 'text':
        return node.value || '';

      case 'bold':
        return html`<strong>${render(node.content)}</strong>`;

      case 'italic':
        return html`<em>${render(node.content)}</em>`;

      case 'underline':
        return html`<u>${render(node.content)}</u>`;

      case 'strike':
        return html`<del>${render(node.content)}</del>`;

      case 'link': {
        const url = String(node.url ?? '').trim();
        return isSafeLinkUrl(url)
          ? html`<a href="${url}">${render(node.content)}</a>`
          : html`${render(node.content)}`;
      }

      case 'inline_code':
        return html`<code>${node.value}</code>`;

      case 'color_code': {
        const color = String(node.value ?? '');
        if (!isSafeColorValue(color)) return html`${color}`;
        return html`
          <code class="ffm-color-code">
            <span
              class="ffm-color-swatch"
              style="
                display: inline-block;
                width: 0.8em;
                height: 0.8em;
                border-radius: 50%;
                background-color: ${color};
                vertical-align: middle;
                margin-right: 0.3em;
                border: 1px solid #00000030;
              "
            ></span
            >${color}
          </code>
        `;
      }

      case 'code_block':
        return html`
          <div class="code-block-wrapper">
            ${node.lang ? html`<div class="code-lang">${node.lang}</div>` : ''}
            <pre><code class="${node.lang
              ? `language-${node.lang}`
              : ''}">${node.value}</code></pre>
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
            ${render(node.content)}
          </${unsafeStatic(tag)}>
        `;
      }

      case 'list_item':
        return html`<li>${render(node.content)}</li>`;

      case 'blockquote':
        return html`<blockquote>${render(node.content)}</blockquote>`;

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
                  ${(node.header ?? []).map(
                    (cell) => html`<th>${render(cell.content)}</th>`,
                  )}
                </tr>
              </thead>
              <tbody>
                ${node.content?.map(
                  (row) => html`
                    <tr>
                      ${(row.content ?? []).map(
                        (cell) => html`<td>${render(cell.content)}</td>`,
                      )}
                    </tr>
                  `,
                )}
              </tbody>
            </table>
          </div>
        `;

      case 'accordion':
        return html`<div class="ffm-accordion">${render(node.content)}</div>`;

      case 'accordion_item':
        return html`
          <details name="${node.name}">
            <summary>${render(node.title)}</summary>
            <div class="accordion-content">${render(node.content)}</div>
          </details>
        `;

      // FFM Slide
      case 'slide':
        return html`
          <div class="slide-container-wrapper">
            <div class="slide-container">${render(node.content)}</div>
          </div>
        `;

      case 'slide_item':
        return html`<div class="slide-item">${render(node.content)}</div>`;

      // FFM Chain
      case 'chain':
        return html`<div class="chain-container">${render(node.content)}</div>`;

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
              <div class="chain-body">${render(node.content)}</div>
            </div>
          </div>
        `;
      }

      default:
        // fallback render
        return node.content ? html`<span>${render(node.content)}</span>` : null;
    }
  });
}
