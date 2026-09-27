// @ffm/editor/src/render/caret.spec.ts
import { describe, expect, it } from 'vitest';
import '#/test/setup';
import { domToOffset, findTextNodeAt, locateOffset } from '#/render/caret';

describe('locateOffset', () => {
  it('finds the rect of the character at the given offset', () => {
    const root = document.createElement('p');
    root.append(document.createTextNode('hello'));
    document.body.append(root);

    const rect = locateOffset(root, 2);
    expect(rect).toBeDefined();
  });

  it('uses the placeholder <br> rect for an empty block', () => {
    const root = document.createElement('p');
    const br = document.createElement('br');
    root.append(br);
    document.body.append(root);

    // Give <br> a non-zero rect so we can tell the two branches apart.
    br.getBoundingClientRect = () =>
      ({
        left: 42,
        top: 7,
        width: 0,
        height: 20,
        right: 42,
        bottom: 27,
        x: 42,
        y: 7,
        toJSON: () => ({}),
      }) as DOMRect;

    const rect = locateOffset(root, 0);
    expect(rect?.left).toBe(42);
    expect(rect?.top).toBe(7);
  });

  it('falls back to the block rect when there is no <br> and no text', () => {
    const root = document.createElement('p');
    root.getBoundingClientRect = () =>
      ({
        left: 11,
        top: 13,
        width: 100,
        height: 20,
        right: 111,
        bottom: 33,
        x: 11,
        y: 13,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.append(root);

    const rect = locateOffset(root, 0);
    expect(rect?.left).toBe(11);
  });
});

describe('domToOffset', () => {
  it('converts a text node position to a block-local offset', () => {
    const root = document.createElement('p');
    const a = document.createTextNode('hello');
    const b = document.createTextNode(' world');
    root.append(a, b);

    expect(domToOffset(root, b, 3)).toBe(8);
  });
});

describe('findTextNodeAt', () => {
  it('returns the text node containing the offset', () => {
    const root = document.createElement('p');
    const a = document.createTextNode('hello');
    const b = document.createTextNode(' world');
    root.append(a, b);

    expect(findTextNodeAt(root, 2)).toEqual({ node: a, offset: 2 });
    expect(findTextNodeAt(root, 8)).toEqual({ node: b, offset: 3 });
  });

  it('returns undefined for an empty block', () => {
    const root = document.createElement('p');
    expect(findTextNodeAt(root, 0)).toBeUndefined();
  });
});
