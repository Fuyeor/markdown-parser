// @ffm/editor/src/index.ts
export { createEditor } from '#/editor';
export type { Editor } from '#/editor';
export { dispatch, dispatchSilent, redo, undo } from '#/transaction';
export { clearHistory } from '#/transaction/history';
export { activeBlock, documentModel, selection } from '#/state/editor-state';
export { isCollapsed, order } from '#/state/selection';
export { nextBlockId, resetBlockId } from '#/state/id';
export { fromFFM } from '#/parse/bridge';
export { attachView, paintSelection, renderBlock } from '#/render';
export type { EditorView } from '#/render';
export type {
  Block,
  BlockAttr,
  BlockType,
  DocumentModel,
  Format,
  FormatType,
} from '#/state/document';
export type { Position, Selection } from '#/state/selection';
export type { Transaction } from '#/transaction/type';
export { createDefaultCaretRenderer } from '#/caret/default-renderer';
export type { CaretRenderer } from '#/caret/type';
