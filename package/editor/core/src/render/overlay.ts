// @ffm/editor/src/render/overlay.ts
import type { DocumentModel } from '#/state/document';
import type { Selection } from '#/state/selection';
import { order } from '#/state/selection';
import { findTextNodeAt } from './caret';

const highlightName = 'ffm-selection';

/** Paint the current selection using the CSS Custom Highlight API. */
export function paintSelection(
  content: HTMLElement,
  value: Selection,
  documentModel: DocumentModel,
): void {
  CSS.highlights.delete(highlightName);

  if (
    value.anchor.blockId === value.head.blockId &&
    value.anchor.offset === value.head.offset
  )
    return;

  const [from, to] = order(value, documentModel.blockArray);
  const fromBlock = content.querySelector<HTMLElement>(
    `[data-block-id="${from.blockId}"]`,
  );
  const toBlock = content.querySelector<HTMLElement>(
    `[data-block-id="${to.blockId}"]`,
  );
  if (fromBlock === null || toBlock === null) return;

  const fromTarget = findTextNodeAt(fromBlock, from.offset);
  const toTarget = findTextNodeAt(toBlock, to.offset);
  if (fromTarget === undefined || toTarget === undefined) return;

  const range = document.createRange();
  range.setStart(fromTarget.node, fromTarget.offset);
  range.setEnd(toTarget.node, toTarget.offset);

  CSS.highlights.set(highlightName, new Highlight(range));
}
