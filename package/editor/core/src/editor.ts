// @ffm/editor/src/editor.ts
import { effect } from 'alien-signals';
import { copy, paste } from '#/clipboard';
import { createImeSession } from '#/edit-context/ime';
import { dispatch } from '#/transaction';
import { order } from '#/state/selection';
import { documentModel, selection } from '#/state/editor-state';
import { nextBlockId } from '#/state/id';
import type { ImeSession } from '#/edit-context/ime';
import './edit-context/type';

export type Editor = {
  editContext: EditContext;
  destroy(): void;
};

export function createEditor(element: HTMLElement): Editor {
  const firstBlock = documentModel().blockArray[0];
  const editContext = new EditContext({ text: firstBlock?.text ?? '' });
  element.editContext = editContext;
  element.tabIndex = 0;
  element.style.outline = 'none';
  element.focus();

  const stopText = effect(() => {
    const value = selection();
    const document = documentModel();
    const block = document.blockArray.find(
      (item) => item.id === value.head.blockId,
    );
    if (block === undefined) return;
    if (block.text !== editContext.text) {
      editContext.updateText(0, editContext.text.length, block.text);
    }
  });

  const stopSelection = effect(() => {
    const value = selection();
    editContext.updateSelection(value.head.offset, value.head.offset);
  });

  let imeSession: ImeSession | undefined;

  editContext.addEventListener('textupdate', (event) => {
    const value = selection();
    const document = documentModel();
    const block = document.blockArray.find(
      (item) => item.id === value.head.blockId,
    );
    if (block === undefined) return;

    if (event.text === '\n' && event.updateRangeStart === event.updateRangeEnd)
      return;

    const blockId = block.id;
    const composing = event.compositionStart !== event.compositionEnd;

    if (composing) {
      const from = event.updateRangeStart;
      const to = event.updateRangeEnd;
      if (imeSession === undefined) {
        imeSession = createImeSession(blockId);
        imeSession.start(from);
      }
      imeSession.update(from, to, event.text);
      return;
    }

    if (imeSession !== undefined) {
      imeSession.update(
        event.updateRangeStart,
        event.updateRangeEnd,
        event.text,
      );
      imeSession.end();
      imeSession = undefined;
      return;
    }

    const from = event.updateRangeStart;
    const to = event.updateRangeEnd;
    dispatch({ type: 'replace', blockId, from, to, text: event.text });
  });

  const onKeydown = (event: KeyboardEvent) => {
    if (event.isComposing) return;

    // Select all: from start of first block to end of last block.
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      const document = documentModel();
      const first = document.blockArray[0];
      const last = document.blockArray[document.blockArray.length - 1];
      if (first === undefined || last === undefined) return;
      dispatch({
        type: 'select',
        anchor: { blockId: first.id, offset: 0 },
        head: { blockId: last.id, offset: last.text.length },
      });
      return;
    }

    // Delete or Backspace on a non-collapsed selection: delete the range.
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const value = selection();
      const isCollapsed =
        value.anchor.blockId === value.head.blockId &&
        value.anchor.offset === value.head.offset;
      if (!isCollapsed) {
        event.preventDefault();
        const [from, to] = order(value, documentModel().blockArray);
        dispatch({ type: 'replaceBlockArray', from, to, blockArray: [] });
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const value = selection();
      if (value.anchor.blockId !== value.head.blockId) return;

      const blockId = value.anchor.blockId;
      const from = Math.min(value.anchor.offset, value.head.offset);
      const to = Math.max(value.anchor.offset, value.head.offset);

      if (from !== to) dispatch({ type: 'delete', blockId, from, to });
      dispatch({
        type: 'splitBlock',
        blockId,
        offset: from,
        newBlockId: nextBlockId(),
      });
      return;
    }

    if (event.key === 'Backspace') {
      const value = selection();
      if (value.anchor.blockId !== value.head.blockId) return;
      if (value.anchor.offset !== 0 || value.head.offset !== 0) return;

      const document = documentModel();
      const index = document.blockArray.findIndex(
        (block) => block.id === value.anchor.blockId,
      );
      if (index <= 0) return;

      event.preventDefault();
      dispatch({ type: 'mergeBlock', blockId: value.anchor.blockId });
      return;
    }
  };
  element.addEventListener('keydown', onKeydown);

  const onPaste = (event: ClipboardEvent) => {
    const data = event.clipboardData;
    if (data === null) return;
    event.preventDefault();
    const html = data.getData('text/html');
    const text = data.getData('text/plain');
    for (const transaction of paste({
      html: html.length > 0 ? html : undefined,
      text,
    })) {
      dispatch(transaction);
    }
  };

  const onCopy = (event: ClipboardEvent) => {
    const data = event.clipboardData;
    if (data === null) return;
    event.preventDefault();
    const output = copy();
    data.setData('text/plain', output.text);
    if (output.html !== undefined) data.setData('text/html', output.html);
  };

  const onCut = (event: ClipboardEvent) => {
    onCopy(event);
    const value = selection();
    if (value.anchor.blockId !== value.head.blockId) return;
    if (value.anchor.offset === value.head.offset) return;
    const from = Math.min(value.anchor.offset, value.head.offset);
    const to = Math.max(value.anchor.offset, value.head.offset);
    dispatch({ type: 'delete', blockId: value.anchor.blockId, from, to });
  };

  element.addEventListener('paste', onPaste);
  element.addEventListener('copy', onCopy);
  element.addEventListener('cut', onCut);

  return {
    editContext,
    destroy() {
      stopText();
      stopSelection();
      element.removeEventListener('keydown', onKeydown);
      element.removeEventListener('paste', onPaste);
      element.removeEventListener('copy', onCopy);
      element.removeEventListener('cut', onCut);
    },
  };
}
