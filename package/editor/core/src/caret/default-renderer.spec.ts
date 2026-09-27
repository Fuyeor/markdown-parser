// @ffm/editor/src/caret/default-renderer.spec.ts
import { beforeEach, describe, expect, it } from 'vitest';
import '#/test/setup';
import { createDefaultCaretRenderer } from './default-renderer';

describe('createDefaultCaretRenderer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  it('does not inject any <style> into document.head', () => {
    const before = document.head.querySelectorAll('style').length;
    const renderer = createDefaultCaretRenderer();
    renderer.mount(container);
    expect(document.head.querySelectorAll('style').length).toBe(before);
  });

  it('mounts a single .ffm-caret element', () => {
    const renderer = createDefaultCaretRenderer();
    renderer.mount(container);
    expect(container.querySelectorAll('.ffm-caret').length).toBe(1);
  });

  it('uses transform for positioning instead of left/top', () => {
    const renderer = createDefaultCaretRenderer();
    renderer.mount(container);
    const element = container.querySelector<HTMLElement>('.ffm-caret')!;

    const rect = {
      left: 30,
      top: 40,
      width: 0,
      height: 18,
      right: 30,
      bottom: 58,
      x: 30,
      y: 40,
      toJSON: () => ({}),
    } as DOMRect;

    container.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    renderer.update(rect);

    expect(element.style.transform).toContain('translate3d');
    expect(element.style.left).toBe('0px');
    expect(element.style.top).toBe('0px');
  });

  it('removes its element on destroy', () => {
    const renderer = createDefaultCaretRenderer();
    renderer.mount(container);
    renderer.destroy();
    expect(container.querySelector('.ffm-caret')).toBeNull();
  });
});
