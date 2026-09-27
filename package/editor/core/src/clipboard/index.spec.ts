// @ffm/editor/src/clipboard/index.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copy, fromClipboard, paste } from '#/clipboard';
import { dispatch } from '#/transaction';
import { clearHistory } from '#/transaction/history';
import { documentModel, selection } from '#/state/editor-state';
import type { Block } from '#/state/document';

vi.mock('@ffm/converter', () => ({
  fromHTML: (html: string) => html.replace(/<[^>]+>/g, ''),
}));

function makeBlock(id: string, text: string): Block {
  return { id, type: 'paragraph', text, formatArray: [], attr: {} };
}

function setBlocks(...blockArray: Block[]) {
  documentModel({ blockArray });
}

describe('fromClipboard', () => {
  it('prefers HTML when present', () => {
    expect(fromClipboard({ text: 'plain', html: '<p>rich</p>' })).toBe('rich');
  });

  it('falls back to plain text', () => {
    expect(fromClipboard({ text: 'plain' })).toBe('plain');
  });

  it('treats an empty HTML string as absent', () => {
    expect(fromClipboard({ text: 'plain', html: '' })).toBe('plain');
  });

  it('returns an empty string for an empty payload', () => {
    expect(fromClipboard({})).toBe('');
  });
});

describe('paste', () => {
  beforeEach(() => {
    setBlocks(makeBlock('block-0', ''));
    selection({
      anchor: { blockId: 'block-0', offset: 0 },
      head: { blockId: 'block-0', offset: 0 },
    });
    clearHistory();
  });

  it('replaces the current selection', () => {
    setBlocks(makeBlock('block-0', 'hello world'));
    selection({
      anchor: { blockId: 'block-0', offset: 6 },
      head: { blockId: 'block-0', offset: 11 },
    });
    for (const transaction of paste({ text: 'ffm' })) dispatch(transaction);
    expect(documentModel().blockArray[0]!.text).toBe('hello ffm');
  });

  it('inserts multiple blocks when pasting FFM source', () => {
    setBlocks(makeBlock('block-0', ''));
    selection({
      anchor: { blockId: 'block-0', offset: 0 },
      head: { blockId: 'block-0', offset: 0 },
    });
    for (const transaction of paste({ text: '# Heading\n\nParagraph' }))
      dispatch(transaction);
    const blockArray = documentModel().blockArray;
    expect(blockArray).toHaveLength(2);
    expect(blockArray[0]!.type).toBe('heading');
    expect(blockArray[0]!.text).toBe('Heading');
    expect(blockArray[1]!.type).toBe('paragraph');
    expect(blockArray[1]!.text).toBe('Paragraph');
  });

  it('inserts at the caret when the selection is collapsed', () => {
    setBlocks(makeBlock('block-0', 'hello'));
    selection({
      anchor: { blockId: 'block-0', offset: 5 },
      head: { blockId: 'block-0', offset: 5 },
    });
    for (const transaction of paste({ text: ' world' })) dispatch(transaction);
    expect(documentModel().blockArray[0]!.text).toBe('hello world');
  });

  it('normalizes a reversed selection', () => {
    setBlocks(makeBlock('block-0', 'hello world'));
    selection({
      anchor: { blockId: 'block-0', offset: 11 },
      head: { blockId: 'block-0', offset: 6 },
    });
    for (const transaction of paste({ text: 'ffm' })) dispatch(transaction);
    expect(documentModel().blockArray[0]!.text).toBe('hello ffm');
  });
});

describe('copy', () => {
  beforeEach(() => {
    setBlocks(makeBlock('block-0', ''));
    selection({
      anchor: { blockId: 'block-0', offset: 0 },
      head: { blockId: 'block-0', offset: 0 },
    });
    clearHistory();
  });

  it('returns the selected slice', () => {
    setBlocks(makeBlock('block-0', 'hello world'));
    selection({
      anchor: { blockId: 'block-0', offset: 6 },
      head: { blockId: 'block-0', offset: 11 },
    });
    expect(copy()).toEqual({ text: 'world' });
  });

  it('returns an empty string when the selection is collapsed', () => {
    setBlocks(makeBlock('block-0', 'hello'));
    selection({
      anchor: { blockId: 'block-0', offset: 2 },
      head: { blockId: 'block-0', offset: 2 },
    });
    expect(copy()).toEqual({ text: '' });
  });

  it('joins blocks with newlines on a cross-block selection', () => {
    setBlocks(
      makeBlock('block-0', 'first'),
      makeBlock('block-1', 'second'),
      makeBlock('block-2', 'third'),
    );
    selection({
      anchor: { blockId: 'block-0', offset: 2 },
      head: { blockId: 'block-2', offset: 3 },
    });
    expect(copy()).toEqual({ text: 'rst\nsecond\nthi' });
  });
});
