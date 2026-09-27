// @ffm/vue-editor/src/use-editor.spec.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { clearHistory, documentModel, selection } from '@ffm/editor';
import { useEditor } from './useEditor';

class MockEditContext extends EventTarget {
  #text = '';
  #selectionStart = 0;
  #selectionEnd = 0;
  get text() {
    return this.#text;
  }
  get selectionStart() {
    return this.#selectionStart;
  }
  get selectionEnd() {
    return this.#selectionEnd;
  }
  updateText() {}
  updateSelection() {}
}

function installMock() {
  Object.defineProperty(globalThis, 'EditContext', {
    value: MockEditContext,
    configurable: true,
    writable: true,
  });
}

async function mount(text?: string) {
  let result: ReturnType<typeof useEditor> | undefined;

  const App = defineComponent({
    setup() {
      const container = ref<HTMLElement | null>(null);
      result = useEditor(container, text === undefined ? {} : { text });
      return () => h('div', { ref: container });
    },
  });

  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(App);
  app.mount(host);
  await nextTick();

  return {
    result: result!,
    dispose() {
      app.unmount();
      host.remove();
    },
  };
}

describe('useEditor', () => {
  beforeEach(() => {
    installMock();
    clearHistory();
    documentModel({
      blockArray: [
        {
          id: 'block-0',
          type: 'paragraph',
          text: '',
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

  it('exposes the initial text as a block array ref', async () => {
    const { result, dispose } = await mount('hello');
    expect(result.blockArray.value[0]?.text).toBe('hello');
    dispose();
  });

  it('updates the block array ref when a transaction is dispatched', async () => {
    const { result, dispose } = await mount('hello');
    documentModel({
      blockArray: [
        {
          id: 'block-0',
          type: 'paragraph',
          text: 'world',
          formatArray: [],
          attr: {},
        },
      ],
    });
    await nextTick();
    expect(result.blockArray.value[0]?.text).toBe('world');
    dispose();
  });

  it('updates the selection ref when selection changes', async () => {
    const { result, dispose } = await mount('hello');
    result.setSelection({
      anchor: { blockId: 'block-0', offset: 1 },
      head: { blockId: 'block-0', offset: 3 },
    });
    await nextTick();
    expect(result.selection.value).toEqual({
      anchor: { blockId: 'block-0', offset: 1 },
      head: { blockId: 'block-0', offset: 3 },
    });
    dispose();
  });
});
