// @ffm/editor/src/render/block.ts
import type { Block, Format } from '#/state/document';

/** Create the DOM element for a single block, with inline formats applied. */
export function renderBlock(block: Block): HTMLElement {
  if (block.type === 'code-block') {
    const pre = document.createElement('pre');
    pre.dataset.blockId = block.id;
    pre.className = 'ffm-block';
    const code = document.createElement('code');
    if (block.attr.language !== undefined)
      code.dataset.language = block.attr.language;
    code.textContent = block.text;
    pre.append(code);
    return pre;
  }

  if (block.type === 'divider') {
    const hr = document.createElement('hr');
    hr.dataset.blockId = block.id;
    hr.className = 'ffm-block';
    return hr;
  }

  const element = document.createElement(tagFor(block));
  element.dataset.blockId = block.id;
  element.className = 'ffm-block';

  if (block.text.length === 0) {
    element.append(document.createElement('br'));
    return element;
  }

  applyFormat(element, block.text, block.formatArray);
  return element;
}

function tagFor(block: Block): string {
  switch (block.type) {
    case 'heading':
      return `h${block.attr.level ?? 1}`;
    case 'paragraph':
      return 'p';
    case 'list-item':
      return 'li';
    case 'quote':
      return 'blockquote';
    case 'table':
      return 'table';
    default:
      return 'p';
  }
}

function applyFormat(root: HTMLElement, text: string, formatArray: Format[]) {
  if (formatArray.length === 0) {
    root.textContent = text;
    return;
  }

  const boundarySet = new Set<number>([0, text.length]);
  for (const format of formatArray) {
    boundarySet.add(Math.max(0, format.from));
    boundarySet.add(Math.min(text.length, format.to));
  }
  const boundaryArray = [...boundarySet].sort((a, b) => a - b);

  for (let index = 0; index < boundaryArray.length - 1; index += 1) {
    const start = boundaryArray[index]!;
    const end = boundaryArray[index + 1]!;
    if (start === end) continue;
    const slice = text.slice(start, end);
    const activeFormatArray = formatArray.filter(
      (format) => format.from <= start && format.to >= end,
    );
    root.append(wrapWithFormat(slice, activeFormatArray));
  }
}

function wrapWithFormat(text: string, formatArray: Format[]): Node {
  let node: Node = document.createTextNode(text);
  for (const format of formatArray) {
    const element = elementForFormat(format);
    element.append(node);
    node = element;
  }
  return node;
}

function elementForFormat(format: Format): HTMLElement {
  switch (format.type) {
    case 'bold':
      return document.createElement('strong');
    case 'italic':
      return document.createElement('em');
    case 'underline':
      return document.createElement('u');
    case 'strike':
      return document.createElement('s');
    case 'code':
      return document.createElement('code');
    case 'link': {
      const anchor = document.createElement('a');
      anchor.href = format.value ?? '#';
      return anchor;
    }
    case 'color':
    case 'smiles':
    default: {
      const span = document.createElement('span');
      span.dataset.format = format.type;
      if (format.value !== undefined) span.dataset.value = format.value;
      return span;
    }
  }
}
