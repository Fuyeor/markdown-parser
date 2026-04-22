// @fuyeor/markdown-parser-playground/src/main.styles.ts
import { css } from 'lit';

export const styles = css`
  :host {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 300px;
    height: 100vh;
    gap: 1px;
    background: #333;
    font-family: 'Fuyeor Sans', system-ui, sans-serif;
  }
  .pane {
    background: #1a1a1a;
    color: #ccc;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .header {
    padding: 8px 16px;
    background: #252525;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid #333;
  }
  textarea {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    padding: 20px;
    font-family: 'Fuyeor Mono', monospace;
    font-size: 14px;
    resize: none;
    outline: none;
    line-height: 1.6;
  }
  #preview {
    flex: 1;
    background: #fff;
    color: #333;
    padding: 20px;
    overflow-y: auto;
  }
  #ast {
    grid-column: span 2;
    background: #000;
    color: #0f0;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    overflow-y: auto;
  }
`;
