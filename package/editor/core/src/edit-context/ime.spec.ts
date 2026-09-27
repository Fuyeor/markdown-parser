// @ffm/editor/src/edit-context/ime.spec.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createImeSession } from '#/edit-context/ime';
import { dispatch, redo, undo } from '#/transaction';
import { clearHistory } from '#/transaction/history';
import { documentModel, selection } from '#/state/editor-state';

const blockId = 'block-0';

function setText(text: string) {
  documentModel({
    blockArray: [
      { id: blockId, type: 'paragraph', text, formatArray: [], attr: {} },
    ],
  });
}

function reset() {
  setText('');
  selection({
    anchor: { blockId, offset: 0 },
    head: { blockId, offset: 0 },
  });
  clearHistory();
}

describe('createImeSession', () => {
  beforeEach(reset);

  it('commits one history entry per composition', () => {
    dispatch({ type: 'insert', blockId, offset: 0, text: 'hello ' });

    const ime = createImeSession(blockId);
    ime.start(6);
    ime.update(6, 6, 'に');
    ime.update(6, 7, 'にほ');
    ime.update(6, 8, '日本');
    ime.end();

    expect(documentModel().blockArray[0]!.text).toBe('hello 日本');

    expect(undo()).toBe(true);
    expect(documentModel().blockArray[0]!.text).toBe('hello ');
  });

  it('redoes a composition as one step', () => {
    dispatch({ type: 'insert', blockId, offset: 0, text: 'hello ' });

    const ime = createImeSession(blockId);
    ime.start(6);
    ime.update(6, 6, 'に');
    ime.update(6, 7, '日本');
    ime.end();

    undo();
    expect(documentModel().blockArray[0]!.text).toBe('hello ');

    expect(redo()).toBe(true);
    expect(documentModel().blockArray[0]!.text).toBe('hello 日本');
  });

  it('ignores updates outside a session', () => {
    const ime = createImeSession(blockId);
    ime.update(0, 0, 'abc');
    expect(documentModel().blockArray[0]!.text).toBe('');
  });

  it('records nothing when the composition ends empty', () => {
    dispatch({ type: 'insert', blockId, offset: 0, text: 'hello' });

    const ime = createImeSession(blockId);
    ime.start(5);
    ime.end();

    expect(undo()).toBe(true);
    expect(documentModel().blockArray[0]!.text).toBe('');
  });
});
