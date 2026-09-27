// @ffm/editor/src/editor.spec.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createEditor } from '#/editor';
import { undo } from '#/transaction';
import { clearHistory } from '#/transaction/history';
import { documentModel, selection } from '#/state/editor-state';

type Update = {
  updateRangeStart: number;
  updateRangeEnd: number;
  text: string;
  compositionStart?: number;
  compositionEnd?: number;
};

class MockTextUpdateEvent extends Event {
  readonly updateRangeStart: number;
  readonly updateRangeEnd: number;
  readonly text: string;
  readonly compositionStart: number;
  readonly compositionEnd: number;
  readonly selectionStart: number;
  readonly selectionEnd: number;

  constructor(update: Update) {
    super('textupdate');
    this.updateRangeStart = update.updateRangeStart;
    this.updateRangeEnd = update.updateRangeEnd;
    this.text = update.text;
    this.compositionStart = update.compositionStart ?? 0;
    this.compositionEnd = update.compositionEnd ?? 0;
    this.selectionStart = update.updateRangeStart + update.text.length;
    this.selectionEnd = update.updateRangeStart + update.text.length;
  }
}

class MockEditContext extends EventTarget {
  #text: string;
  #selectionStart: number;
  #selectionEnd: number;

  constructor(init?: {
    text?: string;
    selectionStart?: number;
    selectionEnd?: number;
  }) {
    super();
    this.#text = init?.text ?? '';
    this.#selectionStart = init?.selectionStart ?? 0;
    this.#selectionEnd = init?.selectionEnd ?? 0;
  }

  get text() {
    return this.#text;
  }
  get selectionStart() {
    return this.#selectionStart;
  }
  get selectionEnd() {
    return this.#selectionEnd;
  }

  updateText(rangeStart: number, rangeEnd: number, text: string) {
    this.#text =
      this.#text.slice(0, rangeStart) + text + this.#text.slice(rangeEnd);
  }

  updateSelection(start: number, end: number) {
    this.#selectionStart = start;
    this.#selectionEnd = end;
  }

  emitUpdate(update: Update) {
    this.updateText(
      update.updateRangeStart,
      update.updateRangeEnd,
      update.text,
    );
    this.dispatchEvent(new MockTextUpdateEvent(update));
  }
}

function installMock() {
  Object.defineProperty(globalThis, 'EditContext', {
    value: MockEditContext,
    configurable: true,
    writable: true,
  });
}

function setText(text: string) {
  documentModel({
    blockArray: [
      { id: 'block-0', type: 'paragraph', text, formatArray: [], attr: {} },
    ],
  });
}

function mountEditor(): MockEditContext {
  const element = document.createElement('div');
  return createEditor(element).editContext as unknown as MockEditContext;
}

describe('createEditor', () => {
  beforeEach(() => {
    installMock();
    setText('');
    selection({
      anchor: { blockId: 'block-0', offset: 0 },
      head: { blockId: 'block-0', offset: 0 },
    });
    clearHistory();
  });

  it('applies a plain insert', () => {
    const editor = mountEditor();
    editor.emitUpdate({ updateRangeStart: 0, updateRangeEnd: 0, text: 'a' });
    editor.emitUpdate({ updateRangeStart: 1, updateRangeEnd: 1, text: 'b' });
    expect(documentModel().blockArray[0]!.text).toBe('ab');
  });

  it('applies a plain delete via a replace with empty text', () => {
    setText('abc');
    const editor = mountEditor();
    editor.emitUpdate({ updateRangeStart: 1, updateRangeEnd: 2, text: '' });
    expect(documentModel().blockArray[0]!.text).toBe('ac');
  });

  it('groups an IME composition into one history entry', () => {
    setText('hi ');
    const editor = mountEditor();

    editor.emitUpdate({
      updateRangeStart: 3,
      updateRangeEnd: 3,
      text: 'に',
      compositionStart: 3,
      compositionEnd: 4,
    });
    editor.emitUpdate({
      updateRangeStart: 3,
      updateRangeEnd: 4,
      text: 'にほ',
      compositionStart: 3,
      compositionEnd: 5,
    });
    editor.emitUpdate({
      updateRangeStart: 3,
      updateRangeEnd: 5,
      text: '日本',
      compositionStart: 0,
      compositionEnd: 0,
    });

    expect(documentModel().blockArray[0]!.text).toBe('hi 日本');

    expect(undo()).toBe(true);
    expect(documentModel().blockArray[0]!.text).toBe('hi ');
  });
});
