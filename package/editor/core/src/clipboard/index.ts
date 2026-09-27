// @ffm/editor/src/clipboard.ts
import { fromHTML } from '@ffm/converter';
import { fromFFM } from '#/parse/bridge';
import { documentModel, selection } from '#/state/editor-state';
import { order } from '#/state/selection';
import type { Block } from '#/state/document';
import type { Transaction } from '#/transaction/type';
import type { ClipboardOutput, ClipboardPayload } from './type';

/** Convert a clipboard payload into FFM source text. HTML wins when present. */
export function fromClipboard(payload: ClipboardPayload): string {
  if (payload.html !== undefined && payload.html.length > 0)
    return fromHTML(payload.html);
  return payload.text ?? '';
}

/** Convert a clipboard payload into editor blocks by parsing the FFM source. */
export function clipboardToBlockArray(payload: ClipboardPayload): Block[] {
  const text = fromClipboard(payload);
  if (text.length === 0) return [];
  return fromFFM(text).blockArray;
}

/** Build the transaction that replaces the current selection with clipboard content. */
export function paste(payload: ClipboardPayload): Transaction[] {
  const blockArray = clipboardToBlockArray(payload);
  if (blockArray.length === 0) return [];

  const value = selection();
  const document = documentModel();
  const [from, to] = order(value, document.blockArray);
  return [{ type: 'replaceBlockArray', from, to, blockArray }];
}

/** Return the selected slice of FFM text. `html` stays undefined until range projection exists. */
export function copy(): ClipboardOutput {
  const value = selection();
  const document = documentModel();
  const [from, to] = order(value, document.blockArray);

  if (from.blockId === to.blockId) {
    const block = document.blockArray.find((item) => item.id === from.blockId);
    if (block === undefined) return { text: '' };
    return { text: block.text.slice(from.offset, to.offset) };
  }

  const fromIndex = document.blockArray.findIndex(
    (block) => block.id === from.blockId,
  );
  const toIndex = document.blockArray.findIndex(
    (block) => block.id === to.blockId,
  );
  const lineArray: string[] = [];

  for (let index = fromIndex; index <= toIndex; index += 1) {
    const block = document.blockArray[index];
    if (block === undefined) continue;
    if (index === fromIndex) lineArray.push(block.text.slice(from.offset));
    else if (index === toIndex) lineArray.push(block.text.slice(0, to.offset));
    else lineArray.push(block.text);
  }

  return { text: lineArray.join('\n') };
}
