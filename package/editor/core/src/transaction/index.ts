// @ffm/editor/src/transaction/index.ts
import { endBatch, startBatch } from 'alien-signals';
import { documentModel, selection } from '#/state/editor-state';
import { clearRedo, popRedo, popUndo, record } from './history';
import type { Transaction } from './type';
import type { Block, DocumentModel, Format } from '#/state/document';
import type { Selection } from '#/state/selection';

/** Shift inline formats after inserting `length` characters at `offset`. */
function shiftFormatAfterInsert(
  formatArray: Format[],
  offset: number,
  length: number,
): Format[] {
  return formatArray.map((format) => {
    if (format.to <= offset) return format;
    if (format.from >= offset)
      return { ...format, from: format.from + length, to: format.to + length };
    return { ...format, to: format.to + length };
  });
}

/** Shift or trim inline formats after deleting the range `[from, to)`. */
function shiftFormatAfterDelete(
  formatArray: Format[],
  from: number,
  to: number,
): Format[] {
  const length = to - from;
  const result: Format[] = [];

  for (const format of formatArray) {
    if (format.to <= from) {
      result.push(format);
      continue;
    }
    if (format.from >= to) {
      result.push({
        ...format,
        from: format.from - length,
        to: format.to - length,
      });
      continue;
    }

    const nextFrom = format.from < from ? format.from : from;
    const nextTo = format.to > to ? format.to - length : from;
    if (nextTo > nextFrom)
      result.push({ ...format, from: nextFrom, to: nextTo });
  }

  return result;
}

/** Clip formats to `[from, to)` and rebase them so that `from` becomes 0. */
function sliceFormat(
  formatArray: Format[],
  from: number,
  to: number,
): Format[] {
  const result: Format[] = [];
  for (const format of formatArray) {
    const start = Math.max(format.from, from);
    const end = Math.min(format.to, to);
    if (end > start)
      result.push({ ...format, from: start - from, to: end - from });
  }
  return result;
}

/** Replace a block in the document. Returns a new document with a new block array. */
function replaceBlock(
  document: DocumentModel,
  blockId: string,
  update: (block: Block) => Block,
): DocumentModel {
  return {
    blockArray: document.blockArray.map((block) =>
      block.id === blockId ? update(block) : block,
    ),
  };
}

/** Clone a block so that history entries never share references with live state. */
function cloneBlock(block: Block): Block {
  return {
    ...block,
    attr: { ...block.attr },
    formatArray: block.formatArray.map((format) => ({ ...format })),
  };
}

/** Apply a transaction to the state. Does not record it. */
function apply(transaction: Transaction) {
  const document = documentModel();

  switch (transaction.type) {
    case 'insert': {
      documentModel(
        replaceBlock(document, transaction.blockId, (block) => ({
          ...block,
          text:
            block.text.slice(0, transaction.offset) +
            transaction.text +
            block.text.slice(transaction.offset),
          formatArray: shiftFormatAfterInsert(
            block.formatArray,
            transaction.offset,
            transaction.text.length,
          ),
        })),
      );
      const caret = transaction.offset + transaction.text.length;
      selection({
        anchor: { blockId: transaction.blockId, offset: caret },
        head: { blockId: transaction.blockId, offset: caret },
      });
      return;
    }

    case 'delete': {
      documentModel(
        replaceBlock(document, transaction.blockId, (block) => ({
          ...block,
          text:
            block.text.slice(0, transaction.from) +
            block.text.slice(transaction.to),
          formatArray: shiftFormatAfterDelete(
            block.formatArray,
            transaction.from,
            transaction.to,
          ),
        })),
      );
      selection({
        anchor: { blockId: transaction.blockId, offset: transaction.from },
        head: { blockId: transaction.blockId, offset: transaction.from },
      });
      return;
    }

    case 'replace': {
      documentModel(
        replaceBlock(document, transaction.blockId, (block) => {
          const afterDelete = shiftFormatAfterDelete(
            block.formatArray,
            transaction.from,
            transaction.to,
          );
          return {
            ...block,
            text:
              block.text.slice(0, transaction.from) +
              transaction.text +
              block.text.slice(transaction.to),
            formatArray: shiftFormatAfterInsert(
              afterDelete,
              transaction.from,
              transaction.text.length,
            ),
          };
        }),
      );
      const caret = transaction.from + transaction.text.length;
      selection({
        anchor: { blockId: transaction.blockId, offset: caret },
        head: { blockId: transaction.blockId, offset: caret },
      });
      return;
    }

    case 'select': {
      selection({ anchor: transaction.anchor, head: transaction.head });
      return;
    }

    case 'splitBlock': {
      const index = document.blockArray.findIndex(
        (block) => block.id === transaction.blockId,
      );
      if (index < 0) return;
      const block = document.blockArray[index]!;
      const left: Block = {
        ...block,
        text: block.text.slice(0, transaction.offset),
        formatArray: sliceFormat(block.formatArray, 0, transaction.offset),
      };
      const right: Block = {
        id: transaction.newBlockId,
        type: 'paragraph',
        text: block.text.slice(transaction.offset),
        formatArray: sliceFormat(
          block.formatArray,
          transaction.offset,
          block.text.length,
        ),
        attr: {},
      };
      documentModel({
        blockArray: [
          ...document.blockArray.slice(0, index),
          left,
          right,
          ...document.blockArray.slice(index + 1),
        ],
      });
      selection({
        anchor: { blockId: transaction.newBlockId, offset: 0 },
        head: { blockId: transaction.newBlockId, offset: 0 },
      });
      return;
    }

    case 'mergeBlock': {
      const index = document.blockArray.findIndex(
        (block) => block.id === transaction.blockId,
      );
      if (index <= 0) return;
      const prev = document.blockArray[index - 1]!;
      const current = document.blockArray[index]!;
      const joinOffset = prev.text.length;
      const merged: Block = {
        ...prev,
        text: prev.text + current.text,
        formatArray: [
          ...prev.formatArray,
          ...current.formatArray.map((format) => ({
            ...format,
            from: format.from + joinOffset,
            to: format.to + joinOffset,
          })),
        ],
      };
      documentModel({
        blockArray: [
          ...document.blockArray.slice(0, index - 1),
          merged,
          ...document.blockArray.slice(index + 1),
        ],
      });
      selection({
        anchor: { blockId: prev.id, offset: joinOffset },
        head: { blockId: prev.id, offset: joinOffset },
      });
      return;
    }

    case 'restoreBlocks': {
      documentModel({
        blockArray: [
          ...document.blockArray.slice(0, transaction.fromIndex),
          ...transaction.blockArray.map(cloneBlock),
          ...document.blockArray.slice(
            transaction.fromIndex + transaction.removeCount,
          ),
        ],
      });
      return;
    }

    case 'replaceBlockArray': {
      const fromIndex = document.blockArray.findIndex(
        (block) => block.id === transaction.from.blockId,
      );
      const toIndex = document.blockArray.findIndex(
        (block) => block.id === transaction.to.blockId,
      );
      if (fromIndex < 0 || toIndex < 0) return;

      const fromBlock = document.blockArray[fromIndex]!;
      const toBlock = document.blockArray[toIndex]!;
      const prefix = fromBlock.text.slice(0, transaction.from.offset);
      const prefixFormat = sliceFormat(
        fromBlock.formatArray,
        0,
        transaction.from.offset,
      );
      const suffix = toBlock.text.slice(transaction.to.offset);
      const suffixFormat = sliceFormat(
        toBlock.formatArray,
        transaction.to.offset,
        toBlock.text.length,
      );

      if (transaction.blockArray.length === 0) {
        const merged: Block = {
          ...fromBlock,
          text: prefix + suffix,
          formatArray: [
            ...prefixFormat,
            ...suffixFormat.map((format) => ({
              ...format,
              from: format.from - transaction.to.offset + prefix.length,
              to: format.to - transaction.to.offset + prefix.length,
            })),
          ],
        };
        documentModel({
          blockArray: [
            ...document.blockArray.slice(0, fromIndex),
            merged,
            ...document.blockArray.slice(toIndex + 1),
          ],
        });
        selection({
          anchor: { blockId: merged.id, offset: prefix.length },
          head: { blockId: merged.id, offset: prefix.length },
        });
        return;
      }

      const inserted = transaction.blockArray.map(cloneBlock);

      if (inserted.length === 1) {
        const single = inserted[0]!;
        const combined: Block = {
          ...single,
          id: fromBlock.id,
          text: prefix + single.text + suffix,
          formatArray: [
            ...prefixFormat,
            ...single.formatArray.map((format) => ({
              ...format,
              from: format.from + prefix.length,
              to: format.to + prefix.length,
            })),
            ...suffixFormat.map((format) => ({
              ...format,
              from:
                format.from -
                transaction.to.offset +
                prefix.length +
                single.text.length,
              to:
                format.to -
                transaction.to.offset +
                prefix.length +
                single.text.length,
            })),
          ],
        };
        documentModel({
          blockArray: [
            ...document.blockArray.slice(0, fromIndex),
            combined,
            ...document.blockArray.slice(toIndex + 1),
          ],
        });
        const caret = prefix.length + single.text.length;
        selection({
          anchor: { blockId: combined.id, offset: caret },
          head: { blockId: combined.id, offset: caret },
        });
        return;
      }

      const first = inserted[0]!;
      const last = inserted[inserted.length - 1]!;
      const firstWithPrefix: Block = {
        ...first,
        id: fromBlock.id,
        text: prefix + first.text,
        formatArray: [
          ...prefixFormat,
          ...first.formatArray.map((format) => ({
            ...format,
            from: format.from + prefix.length,
            to: format.to + prefix.length,
          })),
        ],
      };
      const lastWithSuffix: Block = {
        ...last,
        id: toBlock.id,
        text: last.text + suffix,
        formatArray: [
          ...last.formatArray,
          ...suffixFormat.map((format) => ({
            ...format,
            from: format.from - transaction.to.offset + last.text.length,
            to: format.to - transaction.to.offset + last.text.length,
          })),
        ],
      };
      const middle = inserted.slice(1, -1);

      documentModel({
        blockArray: [
          ...document.blockArray.slice(0, fromIndex),
          firstWithPrefix,
          ...middle,
          lastWithSuffix,
          ...document.blockArray.slice(toIndex + 1),
        ],
      });

      const caret = prefix.length + first.text.length;
      selection({
        anchor: { blockId: firstWithPrefix.id, offset: caret },
        head: { blockId: firstWithPrefix.id, offset: caret },
      });
      return;
    }

    default:
      throw new Error(
        `@ffm/editor: transaction not implemented: ${transaction.type}`,
      );
  }
}

/** Build the transaction that reverses `transaction` given the state before it was applied. */
function inverse(
  transaction: Transaction,
  prevDocument: DocumentModel,
  prevSelection: Selection,
): Transaction {
  switch (transaction.type) {
    case 'insert':
      return {
        type: 'delete',
        blockId: transaction.blockId,
        from: transaction.offset,
        to: transaction.offset + transaction.text.length,
      };

    case 'delete': {
      const block = prevDocument.blockArray.find(
        (item) => item.id === transaction.blockId,
      );
      const removed =
        block === undefined
          ? ''
          : block.text.slice(transaction.from, transaction.to);
      return {
        type: 'insert',
        blockId: transaction.blockId,
        offset: transaction.from,
        text: removed,
      };
    }

    case 'replace': {
      const block = prevDocument.blockArray.find(
        (item) => item.id === transaction.blockId,
      );
      const replaced =
        block === undefined
          ? ''
          : block.text.slice(transaction.from, transaction.to);
      return {
        type: 'replace',
        blockId: transaction.blockId,
        from: transaction.from,
        to: transaction.from + transaction.text.length,
        text: replaced,
      };
    }

    case 'select':
      return {
        type: 'select',
        anchor: prevSelection.anchor,
        head: prevSelection.head,
      };

    case 'splitBlock': {
      const index = prevDocument.blockArray.findIndex(
        (block) => block.id === transaction.blockId,
      );
      const block = index < 0 ? undefined : prevDocument.blockArray[index];
      if (block === undefined)
        throw new Error(
          '@ffm/editor: cannot invert splitBlock on missing block',
        );
      return {
        type: 'restoreBlocks',
        fromIndex: index,
        removeCount: 2,
        blockArray: [block],
      };
    }

    case 'mergeBlock': {
      const index = prevDocument.blockArray.findIndex(
        (block) => block.id === transaction.blockId,
      );
      if (index <= 0)
        throw new Error(
          '@ffm/editor: cannot invert mergeBlock without a previous block',
        );
      const prev = prevDocument.blockArray[index - 1]!;
      const current = prevDocument.blockArray[index]!;
      return {
        type: 'restoreBlocks',
        fromIndex: index - 1,
        removeCount: 1,
        blockArray: [prev, current],
      };
    }

    case 'restoreBlocks': {
      const removed = prevDocument.blockArray.slice(
        transaction.fromIndex,
        transaction.fromIndex + transaction.removeCount,
      );
      return {
        type: 'restoreBlocks',
        fromIndex: transaction.fromIndex,
        removeCount: transaction.blockArray.length,
        blockArray: removed,
      };
    }

    case 'replaceBlockArray': {
      const fromIndex = prevDocument.blockArray.findIndex(
        (block) => block.id === transaction.from.blockId,
      );
      const toIndex = prevDocument.blockArray.findIndex(
        (block) => block.id === transaction.to.blockId,
      );
      if (fromIndex < 0 || toIndex < 0)
        throw new Error('@ffm/editor: cannot invert replaceBlockArray');
      const removed = prevDocument.blockArray.slice(fromIndex, toIndex + 1);
      const newCount =
        transaction.blockArray.length === 0 ? 1 : transaction.blockArray.length;
      return {
        type: 'restoreBlocks',
        fromIndex,
        removeCount: newCount,
        blockArray: removed,
      };
    }

    default:
      throw new Error(
        `@ffm/editor: inverse not implemented: ${transaction.type}`,
      );
  }
}

/** Apply a transaction and record it for undo. This is the only write path into state. */
export function dispatch(transaction: Transaction) {
  const prevDocument = documentModel();
  const prevSelection = selection();
  const inverseTransaction = inverse(transaction, prevDocument, prevSelection);
  startBatch();
  apply(transaction);
  endBatch();
  record({ forward: transaction, inverse: inverseTransaction });
}

/**
 * Apply a transaction without recording it.
 * Used by IME composition, which records a single combined entry on composition end.
 */
export function dispatchSilent(transaction: Transaction) {
  startBatch();
  apply(transaction);
  endBatch();
  clearRedo();
}

/** Undo the last recorded change. Returns false when there is nothing to undo. */
export function undo(): boolean {
  const transaction = popUndo();
  if (transaction === undefined) return false;
  apply(transaction);
  return true;
}

/** Redo the last undone change. Returns false when there is nothing to redo. */
export function redo(): boolean {
  const transaction = popRedo();
  if (transaction === undefined) return false;
  apply(transaction);
  return true;
}
