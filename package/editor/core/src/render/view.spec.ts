// @ffm/editor/src/render/view.spec.ts
import { beforeEach, describe, expect, it } from 'vitest';
import '#/test/setup';
import { attachView } from '#/render/view';
import { clearHistory } from '#/transaction/history';
import { documentModel, selection } from '#/state/editor-state';
import type { Editor } from '#/editor';
import type { CaretRenderer } from '#/caret/type';

type BoundsCall = { kind: 'control' | 'selection'; rect: DOMRect };

class MockEditContext extends EventTarget {
  #text = '';
  calls: BoundsCall[] = [];

  get text() {
    return this.#text;
  }
  get selectionStart() {
    return 0;
  }
  get selectionEnd() {
    return 0;
  }
  updateText() {}
  updateSelection() {}
  updateControlBounds(rect: DOMRect) {
    this.calls.push({ kind: 'control', rect });
  }
  updateSelectionBounds(rect: DOMRect) {
    this.calls.push({ kind: 'selection', rect });
  }
  attachedElements() {
    return [];
  }
}

function installMock() {
  Object.defineProperty(globalThis, 'EditContext', {
    value: MockEditContext,
    configurable: true,
    writable: true,
  });
}

function createMockRenderer(): {
  renderer: CaretRenderer;
  mounted: () => number;
  destroyed: () => boolean;
} {
  let mountCount = 0;
  let destroyed = false;
  return {
    renderer: {
      mount: () => {
        mountCount++;
      },
      update: () => {},
      hide: () => {},
      destroy: () => {
        destroyed = true;
      },
    },
    mounted: () => mountCount,
    destroyed: () => destroyed,
  };
}

function createStubEditor(): Editor {
  const editContext = new MockEditContext();
  return {
    editContext: editContext as unknown as EditContext,
    destroy: () => {},
  };
}

describe('attachView', () => {
  beforeEach(() => {
    installMock();
    clearHistory();
    documentModel({
      blockArray: [
        {
          id: 'block-0',
          type: 'paragraph',
          text: 'hello',
          formatArray: [],
          attr: {},
        },
      ],
    });
    selection({
      anchor: { blockId: 'block-0', offset: 0 },
      head: { blockId: 'block-0', offset: 0 },
    });
  });

  it('hides the native caret via caret-color on the container', () => {
    const container = document.createElement('div');
    const editor = createStubEditor();
    const view = attachView(container, editor);
    expect(container.style.caretColor).toBe('transparent');
    view.destroy();
  });

  it('reports control bounds on mount', () => {
    const container = document.createElement('div');
    const editor = createStubEditor();
    const view = attachView(container, editor);
    const controlCalls = (
      editor.editContext as unknown as MockEditContext
    ).calls.filter((c) => c.kind === 'control');
    expect(controlCalls.length).toBeGreaterThanOrEqual(1);
    view.destroy();
  });

  it('reports control bounds again on window resize', () => {
    const container = document.createElement('div');
    const editor = createStubEditor();
    const view = attachView(container, editor);
    const mock = editor.editContext as unknown as MockEditContext;
    const before = mock.calls.filter((c) => c.kind === 'control').length;
    window.dispatchEvent(new Event('resize'));
    const after = mock.calls.filter((c) => c.kind === 'control').length;
    expect(after).toBe(before + 1);
    view.destroy();
  });

  it('reports selection bounds after the caret effect runs', () => {
    const container = document.createElement('div');
    const editor = createStubEditor();
    const view = attachView(container, editor);
    const mock = editor.editContext as unknown as MockEditContext;
    expect(mock.calls.some((c) => c.kind === 'selection')).toBe(true);
    view.destroy();
  });

  it('does not listen for resize after destroy', () => {
    const container = document.createElement('div');
    const editor = createStubEditor();
    const view = attachView(container, editor);
    view.destroy();
    const mock = editor.editContext as unknown as MockEditContext;
    const before = mock.calls.length;
    window.dispatchEvent(new Event('resize'));
    expect(mock.calls.length).toBe(before);
  });

  it('mounts and destroys the caret renderer', () => {
    const container = document.createElement('div');
    const editor = createStubEditor();
    const { renderer, mounted, destroyed } = createMockRenderer();
    const view = attachView(container, editor, { caretRenderer: renderer });
    expect(mounted()).toBe(1);
    view.destroy();
    expect(destroyed()).toBe(true);
  });

  it('swaps the caret renderer via setCaretRenderer', () => {
    const container = document.createElement('div');
    const editor = createStubEditor();
    const first = createMockRenderer();
    const second = createMockRenderer();
    const view = attachView(container, editor, {
      caretRenderer: first.renderer,
    });
    view.setCaretRenderer(second.renderer);
    expect(first.destroyed()).toBe(true);
    expect(second.mounted()).toBe(1);
    view.destroy();
  });
});
