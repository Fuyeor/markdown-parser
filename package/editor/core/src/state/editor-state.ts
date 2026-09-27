// @ffm/editor/src/state/editor-state.ts
import { computed, signal } from 'alien-signals';
import type { Block, DocumentModel } from './document';
import type { Selection } from './selection';

const initialBlockId = 'block-0';

/** The document model is the single source of truth. */
export const documentModel = signal<DocumentModel>({
  blockArray: [
    {
      id: initialBlockId,
      type: 'paragraph',
      text: '',
      formatArray: [],
      attr: {},
    },
  ],
});

/** Selection is kept separate so that cursor movement does not invalidate the document. */
export const selection = signal<Selection>({
  anchor: { blockId: initialBlockId, offset: 0 },
  head: { blockId: initialBlockId, offset: 0 },
});

/**
 * The block that currently owns the EditContext.
 * Derived from the selection head so that the context always follows the caret.
 */
export const activeBlock = computed<Block | undefined>(() => {
  const id = selection().head.blockId;
  return documentModel().blockArray.find((block) => block.id === id);
});
