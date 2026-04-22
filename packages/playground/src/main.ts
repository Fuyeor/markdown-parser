// @fuyeor/markdown-parser-playground/src/main.ts
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  createFuyeorMarkdownParser,
  render as renderMarkdown,
} from '@fuyeor/markdown-parser-lit';
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
        <div id="preview" class="markdown-rendered">${renderMarkdown(ast)}</div>
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
}
