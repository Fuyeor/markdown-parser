// @ffm/vue-editor/src/useEditor.ts
import { effect } from 'alien-signals';
import { onMounted, onUnmounted, ref, shallowRef, type Ref } from 'vue';
import {
  attachView,
  createEditor,
  dispatch,
  documentModel,
  fromFFM,
  selection as selectionSignal,
} from '@ffm/editor';
import type { Block, Editor, EditorView, Selection } from '@ffm/editor';

export type EditorOption = {
  text?: string;
};

/** Bind the FFM editor core to a Vue component. UI is intentionally out of scope. */
export function useEditor(
  container: Ref<HTMLElement | null>,
  option: EditorOption = {},
) {
  const blockArray = ref<Block[]>([]);
  const selection = ref<Selection>({
    anchor: { blockId: 'block-0', offset: 0 },
    head: { blockId: 'block-0', offset: 0 },
  });
  const view = shallowRef<EditorView>();

  let editor: Editor | undefined;
  let stopSync: (() => void) | undefined;

  onMounted(() => {
    const element = container.value;
    if (element === null)
      throw new Error('@ffm/vue-editor: container element is not mounted');

    if (option.text !== undefined) {
      const document = fromFFM(option.text);
      documentModel(document);

      const first = document.blockArray[0];
      if (first !== undefined) {
        const position = { blockId: first.id, offset: 0 };
        selectionSignal({ anchor: position, head: position });
      }
    }

    editor = createEditor(element);
    view.value = attachView(element, editor);

    stopSync = effect(() => {
      blockArray.value = documentModel().blockArray;
      selection.value = selectionSignal();
    });
  });

  onUnmounted(() => {
    stopSync?.();
    view.value?.destroy();
    editor?.destroy();
    view.value = undefined;
    editor = undefined;
  });

  return {
    blockArray,
    selection,
    view,
    setSelection(value: Selection) {
      dispatch({ type: 'select', anchor: value.anchor, head: value.head });
    },
  };
}
