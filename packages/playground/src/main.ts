// @fuyeor/markdown-parser-playground/src/main.ts
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { createFuyeorMarkdownParser } from '@fuyeor/markdown-parser';
import { styles as mainStyles } from './main.styles';
import { styles as markdownStyles } from './markdown.styles';

@customElement('markdown-playground')
export class MarkdownPlayground extends LitElement {
  static styles = [mainStyles, markdownStyles];

  #parser = createFuyeorMarkdownParser();

  @state()
  private _source =
    '# Welcome to Markdown Playground\n\nTry writing some **markdown** here!';

  render() {
    const ast = this.#parser(this._source);

    return html`
      <div class="pane">
        <div class="header">Editor (Markdown)</div>
        <textarea @input=${this.#onInput}>${this._source}</textarea>
      </div>

      <div class="pane">
        <div class="header">Preview (DOM)</div>
        <div id="preview">${this.#renderNodes(ast)}</div>
      </div>

      <div class="pane" id="ast">
        <div class="header">Abstract Syntax Tree (JSON)</div>
        <pre>${JSON.stringify(ast, null, 2)}</pre>
      </div>
    `;
  }

  #onInput(e: Event) {
    this._source = (e.target as HTMLTextAreaElement).value;
  }

  #renderNodes(nodes: any[]): any {
    return nodes.map((node) => {
      switch (node.type) {
        case 'heading': {
          const tagName = `h${node.level}`;
          return staticHtml`
          <${unsafeStatic(tagName)}>
            ${this.#renderNodes(node.children)}
          </${unsafeStatic(tagName)}>
        `;
        }

        case 'paragraph':
          return html`<p>${this.#renderNodes(node.children)}</p>`;

        case 'text':
          return node.content;

        case 'list': {
          const tag = node.ordered ? 'ol' : 'ul';
          const startValue =
            node.ordered && node.start && node.start !== 1
              ? node.start
              : undefined;

          return staticHtml`
          <${unsafeStatic(tag)} .start=${startValue}>
            ${this.#renderNodes(node.children)}
          </${unsafeStatic(tag)}>
        `;
        }

        case 'list_item':
          return html`<li>${this.#renderNodes(node.children)}</li>`;

        case 'bold':
          return html`<strong>${this.#renderNodes(node.children)}</strong>`;

        case 'underline':
          return html`<u>${this.#renderNodes(node.children)}</u>`;

        case 'strike':
          return html`<del>${this.#renderNodes(node.children)}</del>`;

        case 'link':
          return html`<a
            href="${node.url}"
            target="_blank"
            rel="noopener noreferrer"
            >${this.#renderNodes(node.children)}</a
          >`;

        case 'inline_code':
          return html`<code>${node.content}</code>`;

        case 'code_block':
          return html`
            <div class="code-block-wrapper">
              ${node.lang
                ? html`<div class="code-lang">${node.lang}</div>`
                : ''}
              <pre><code>${node.content}</code></pre>
            </div>
          `;

        case 'hr':
          return html`<hr />`;

        case 'blockquote':
          return html`<blockquote>
            ${this.#renderNodes(node.children)}
          </blockquote>`;

        default:
          return html`<span>${this.#renderNodes(node.children || [])}</span>`;
      }
    });
  }
}
