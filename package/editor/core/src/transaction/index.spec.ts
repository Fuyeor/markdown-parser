// @ffm/editor/src/transaction/index.spec.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { dispatch, undo } from '#/transaction';
import { clearHistory } from '#/transaction/history';
import { documentModel, selection } from '#/state/editor-state';
import { resetBlockId } from '#/state/id';
import type { Block } from '#/state/document';

const blockId = 'block-0';

function makeBlock(id: string, text: string): Block {
  return { id, type: 'paragraph', text, formatArray: [], attr: {} };
}

function setBlocks(...blockArray: Block[]) {
  documentModel({ blockArray });
}

describe('dispatch', () => {
  beforeEach(() => {
    resetBlockId();
    setBlocks(makeBlock(blockId, ''));
    selection({
      anchor: { blockId, offset: 0 },
      head: { blockId, offset: 0 },
    });
    clearHistory();
  });

  it('inserts text at the given offset and places the caret after it', () => {
    setBlocks(makeBlock(blockId, 'hello'));
    dispatch({ type: 'insert', blockId, offset: 5, text: ' world' });
    expect(documentModel().blockArray[0]!.text).toBe('hello world');
    expect(selection().head).toEqual({ blockId, offset: 11 });
  });

  it('deletes a range and collapses the caret to its start', () => {
    setBlocks(makeBlock(blockId, 'hello world'));
    dispatch({ type: 'delete', blockId, from: 5, to: 11 });
    expect(documentModel().blockArray[0]!.text).toBe('hello');
    expect(selection().head).toEqual({ blockId, offset: 5 });
  });

  it('replaces a range and places the caret after the replacement', () => {
    setBlocks(makeBlock(blockId, 'hello world'));
    dispatch({ type: 'replace', blockId, from: 6, to: 11, text: 'ffm' });
    expect(documentModel().blockArray[0]!.text).toBe('hello ffm');
    expect(selection().head).toEqual({ blockId, offset: 9 });
  });

  it('moves the selection without touching the text', () => {
    setBlocks(makeBlock(blockId, 'hello'));
    dispatch({
      type: 'select',
      anchor: { blockId, offset: 0 },
      head: { blockId, offset: 5 },
    });
    expect(documentModel().blockArray[0]!.text).toBe('hello');
  });
});

describe('splitBlock / mergeBlock', () => {
  beforeEach(() => {
    resetBlockId();
    setBlocks(makeBlock(blockId, ''));
    selection({
      anchor: { blockId, offset: 0 },
      head: { blockId, offset: 0 },
    });
    clearHistory();
  });

  it('splits a block into two at the given offset', () => {
    setBlocks(makeBlock(blockId, 'hello'));
    dispatch({ type: 'splitBlock', blockId, offset: 2, newBlockId: 'block-1' });

    const blockArray = documentModel().blockArray;
    expect(blockArray).toHaveLength(2);
    expect(blockArray[0]!.text).toBe('he');
    expect(blockArray[1]!.text).toBe('llo');
    expect(blockArray[1]!.id).toBe('block-1');
    expect(selection().head).toEqual({ blockId: 'block-1', offset: 0 });
  });

  it('merges a block into its predecessor', () => {
    setBlocks(makeBlock('block-0', 'hello'), makeBlock('block-1', ' world'));
    selection({
      anchor: { blockId: 'block-1', offset: 0 },
      head: { blockId: 'block-1', offset: 0 },
    });
    dispatch({ type: 'mergeBlock', blockId: 'block-1' });

    const blockArray = documentModel().blockArray;
    expect(blockArray).toHaveLength(1);
    expect(blockArray[0]!.text).toBe('hello world');
    expect(selection().head).toEqual({ blockId: 'block-0', offset: 5 });
  });

  it('undoes a split', () => {
    setBlocks(makeBlock(blockId, 'hello'));
    dispatch({ type: 'splitBlock', blockId, offset: 2, newBlockId: 'block-1' });
    expect(documentModel().blockArray).toHaveLength(2);

    expect(undo()).toBe(true);
    const blockArray = documentModel().blockArray;
    expect(blockArray).toHaveLength(1);
    expect(blockArray[0]!.text).toBe('hello');
  });

  it('undoes a merge', () => {
    setBlocks(makeBlock('block-0', 'hello'), makeBlock('block-1', ' world'));
    selection({
      anchor: { blockId: 'block-1', offset: 0 },
      head: { blockId: 'block-1', offset: 0 },
    });
    dispatch({ type: 'mergeBlock', blockId: 'block-1' });
    expect(documentModel().blockArray).toHaveLength(1);

    expect(undo()).toBe(true);
    const blockArray = documentModel().blockArray;
    expect(blockArray).toHaveLength(2);
    expect(blockArray[0]!.text).toBe('hello');
    expect(blockArray[1]!.text).toBe(' world');
  });

  it('keeps inline formats across a split', () => {
    documentModel({
      blockArray: [
        {
          id: blockId,
          type: 'paragraph',
          text: 'hello',
          formatArray: [{ from: 0, to: 5, type: 'bold' }],
          attr: {},
        },
      ],
    });
    dispatch({ type: 'splitBlock', blockId, offset: 2, newBlockId: 'block-1' });
    const blockArray = documentModel().blockArray;
    expect(blockArray[0]!.formatArray).toEqual([
      { from: 0, to: 2, type: 'bold' },
    ]);
    expect(blockArray[1]!.formatArray).toEqual([
      { from: 0, to: 3, type: 'bold' },
    ]);
  });
});

describe('replaceBlockArray', () => {
  beforeEach(() => {
    resetBlockId();
    clearHistory();
  });

  it('deletes a cross-block range and merges the boundaries', () => {
    setBlocks(makeBlock('block-0', 'hello'), makeBlock('block-1', 'world'));
    selection({
      anchor: { blockId: 'block-0', offset: 2 },
      head: { blockId: 'block-1', offset: 3 },
    });
    dispatch({
      type: 'replaceBlockArray',
      from: { blockId: 'block-0', offset: 2 },
      to: { blockId: 'block-1', offset: 3 },
      blockArray: [],
    });
    const blockArray = documentModel().blockArray;
    expect(blockArray).toHaveLength(1);
    expect(blockArray[0]!.text).toBe('held');
  });

  it('inserts multiple blocks and merges boundaries', () => {
    setBlocks(makeBlock('block-0', 'AA'), makeBlock('block-1', 'BB'));
    dispatch({
      type: 'replaceBlockArray',
      from: { blockId: 'block-0', offset: 1 },
      to: { blockId: 'block-1', offset: 1 },
      blockArray: [
        { id: 'x', type: 'paragraph', text: 'one', formatArray: [], attr: {} },
        { id: 'y', type: 'paragraph', text: 'two', formatArray: [], attr: {} },
      ],
    });
    const blockArray = documentModel().blockArray;
    expect(blockArray).toHaveLength(2);
    expect(blockArray[0]!.text).toBe('Aone');
    expect(blockArray[1]!.text).toBe('twoB');
  });

  it('undoes a cross-block delete', () => {
    setBlocks(makeBlock('block-0', 'hello'), makeBlock('block-1', 'world'));
    dispatch({
      type: 'replaceBlockArray',
      from: { blockId: 'block-0', offset: 2 },
      to: { blockId: 'block-1', offset: 3 },
      blockArray: [],
    });
    expect(documentModel().blockArray).toHaveLength(1);
    expect(undo()).toBe(true);
    const blockArray = documentModel().blockArray;
    expect(blockArray).toHaveLength(2);
    expect(blockArray[0]!.text).toBe('hello');
    expect(blockArray[1]!.text).toBe('world');
  });

  it('undoes a cross-block insert', () => {
    setBlocks(makeBlock('block-0', 'AA'), makeBlock('block-1', 'BB'));
    dispatch({
      type: 'replaceBlockArray',
      from: { blockId: 'block-0', offset: 1 },
      to: { blockId: 'block-1', offset: 1 },
      blockArray: [
        { id: 'x', type: 'paragraph', text: 'one', formatArray: [], attr: {} },
        { id: 'y', type: 'paragraph', text: 'two', formatArray: [], attr: {} },
      ],
    });
    expect(undo()).toBe(true);
    const blockArray = documentModel().blockArray;
    expect(blockArray).toHaveLength(2);
    expect(blockArray[0]!.text).toBe('AA');
    expect(blockArray[1]!.text).toBe('BB');
  });
});

describe('fromFFM', () => {
  beforeEach(() => {
    resetBlockId();
    clearHistory();
  });

  it('maps a heading to a heading block', async () => {
    const { fromFFM } = await import('#/parse/bridge');
    const document = fromFFM('# Hello');
    expect(document.blockArray[0]!.type).toBe('heading');
    expect(document.blockArray[0]!.text).toBe('Hello');
    expect(document.blockArray[0]!.attr.level).toBe(1);
  });

  it('maps a paragraph to a paragraph block', async () => {
    const { fromFFM } = await import('#/parse/bridge');
    const document = fromFFM('Hello world');
    expect(document.blockArray[0]!.type).toBe('paragraph');
    expect(document.blockArray[0]!.text).toBe('Hello world');
  });

  it('produces a format range for bold text', async () => {
    const { fromFFM } = await import('#/parse/bridge');
    const document = fromFFM('hello **world**');
    expect(document.blockArray[0]!.text).toBe('hello world');
    expect(document.blockArray[0]!.formatArray).toEqual([
      { from: 6, to: 11, type: 'bold' },
    ]);
  });
});
