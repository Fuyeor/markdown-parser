// @ffm/editor/src/edit-context/ime.ts
import { documentModel } from '#/state/editor-state';
import { dispatchSilent } from '#/transaction';
import { record } from '#/transaction/history';

/** An IME composition session bound to a single block. */
export type ImeSession = {
  start(offset: number): void;
  update(from: number, to: number, text: string): void;
  end(): void;
};

/**
 * Create an IME session for `blockId`.
 * During composition, text updates are applied silently. On composition end, one history entry
 * is recorded so that undo removes the whole composed word, not each keystroke.
 */
export function createImeSession(blockId: string): ImeSession {
  let active = false;
  let startOffset = 0;
  let lastLength = 0;

  return {
    start(offset) {
      active = true;
      startOffset = offset;
      lastLength = 0;
    },

    update(from, to, text) {
      if (!active) return;
      lastLength = text.length;
      dispatchSilent({ type: 'replace', blockId, from, to, text });
    },

    end() {
      if (!active) return;
      active = false;
      if (lastLength === 0) return;
      const block = documentModel().blockArray.find(
        (item) => item.id === blockId,
      );
      if (block === undefined) return;
      const composed = block.text.slice(startOffset, startOffset + lastLength);
      record({
        forward: {
          type: 'insert',
          blockId,
          offset: startOffset,
          text: composed,
        },
        inverse: {
          type: 'delete',
          blockId,
          from: startOffset,
          to: startOffset + lastLength,
        },
      });
    },
  };
}
