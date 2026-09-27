// @ffm/editor/src/render/view.ts
import { effect } from 'alien-signals';
import { createDefaultCaretRenderer } from '#/caret/default-renderer';
import { dispatch } from '#/transaction';
import { documentModel, selection } from '#/state/editor-state';
import { domToOffset, findTextNodeAt, locateOffset } from './caret';
import { renderBlock } from './block';
import { paintSelection } from './overlay';
import type { CaretRenderer } from '#/caret/type';
import type { Block } from '#/state/document';
import type { Editor } from '#/editor';

export type EditorView = {
  content: HTMLElement;
  destroy(): void;
  setCaretRenderer(renderer: CaretRenderer): void;
};

/**
 * Reconcile the current children of `parent` with the desired `children` list.
 * Reuses existing nodes when their position is already correct, so unchanged blocks
 * are never detached or re-created. This is the core of block-level diffing.
 */
function applyChildren(parent: Element, children: Node[]) {
  const childSet = new Set(children);

  for (const node of Array.from(parent.childNodes)) {
    if (!childSet.has(node)) parent.removeChild(node);
  }

  let prev: Node | null = null;
  for (const node of children) {
    if (node.parentNode !== parent || node.previousSibling !== prev) {
      parent.insertBefore(
        node,
        prev === null ? parent.firstChild : prev.nextSibling,
      );
    }
    prev = node;
  }
}

export function attachView(
  container: HTMLElement,
  editor: Editor,
  option: { caretRenderer?: CaretRenderer } = {},
): EditorView {
  container.classList.add('ffm-editor');
  container.style.position = 'relative';
  container.style.whiteSpace = 'pre-wrap';
  container.style.caretColor = 'transparent';

  const content = document.createElement('div');
  content.className = 'ffm-content';
  container.append(content);

  let caretRenderer = option.caretRenderer ?? createDefaultCaretRenderer();
  caretRenderer.mount(container);

  // Per-view block node cache. A block node is reused when its Block object is unchanged.
  // Transactions replace only the target block, so references stay stable for other blocks.
  const blockCache = new Map<string, { node: HTMLElement; block: Block }>();

  const renderCached = (block: Block): HTMLElement => {
    const cached = blockCache.get(block.id);
    if (cached !== undefined && cached.block === block) return cached.node;
    const node = renderBlock(block);
    blockCache.set(block.id, { node, block });
    return node;
  };

  const renderBlocks = (blockArray: Block[]): Node[] => {
    const nodeArray: Node[] = [];
    let listBuffer: Block[] = [];
    let listTag: 'ul' | 'ol' | undefined;

    const flushList = () => {
      if (listBuffer.length === 0) return;
      const wrapper = document.createElement(listTag ?? 'ul');
      for (const block of listBuffer) wrapper.append(renderCached(block));
      nodeArray.push(wrapper);
      listBuffer = [];
      listTag = undefined;
    };

    for (const block of blockArray) {
      if (block.type === 'list-item') {
        const tag = block.attr.ordered === true ? 'ol' : 'ul';
        if (listTag !== undefined && listTag !== tag) flushList();
        listTag = tag;
        listBuffer.push(block);
        continue;
      }
      flushList();
      if (block.attr.quoteDepth !== undefined && block.attr.quoteDepth > 0) {
        const wrapper = document.createElement('blockquote');
        wrapper.append(renderCached(block));
        nodeArray.push(wrapper);
      } else {
        nodeArray.push(renderCached(block));
      }
    }
    flushList();
    return nodeArray;
  };

  const stopRender = effect(() => {
    const blockArray = documentModel().blockArray;

    // Drop cache entries for blocks that no longer exist.
    const alive = new Set<string>();
    for (const block of blockArray) alive.add(block.id);
    for (const id of Array.from(blockCache.keys())) {
      if (!alive.has(id)) blockCache.delete(id);
    }

    applyChildren(content, renderBlocks(blockArray));
  });

  // The DOM is updated synchronously by stopRender, so locateOffset reads fresh layout here.
  const stopCaret = effect(() => {
    const value = selection();
    const block = content.querySelector<HTMLElement>(
      `[data-block-id="${value.head.blockId}"]`,
    );
    if (block === null) {
      caretRenderer.hide();
      return;
    }
    const rect = locateOffset(block, value.head.offset);
    if (rect === undefined) {
      caretRenderer.hide();
      return;
    }
    caretRenderer.update(rect);

    // Tell Chrome where the caret is. Used for the IME window. The native caret stays
    // invisible because `caret-color: transparent` is set on the container.
    editor.editContext.updateSelectionBounds(rect);
  });

  // Tell Chrome where the editor is. Without this, the IME window defaults to the top-left corner.
  const updateControlBounds = () => {
    editor.editContext.updateControlBounds(container.getBoundingClientRect());
  };
  updateControlBounds();
  window.addEventListener('resize', updateControlBounds);

  const stopOverlay = effect(() => {
    paintSelection(content, selection(), documentModel());
  });

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as HTMLElement;
    const blockElement = target.closest<HTMLElement>('[data-block-id]');
    if (blockElement === null) return;
    const blockId = blockElement.dataset.blockId;
    if (blockId === undefined) return;

    const position = document.caretPositionFromPoint(
      event.clientX,
      event.clientY,
    );
    if (position === null) return;
    const offset = domToOffset(
      blockElement,
      position.offsetNode,
      position.offset,
    );

    container.focus();
    dispatch({
      type: 'select',
      anchor: { blockId, offset },
      head: { blockId, offset },
    });
  };
  content.addEventListener('pointerdown', onPointerDown);

  return {
    content,
    destroy() {
      content.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', updateControlBounds);
      stopRender();
      stopCaret();
      stopOverlay();
      caretRenderer.destroy();
      blockCache.clear();
      container.replaceChildren();
    },
    setCaretRenderer(renderer) {
      caretRenderer.destroy();
      caretRenderer = renderer;
      renderer.mount(container);
    },
  };
}

export { findTextNodeAt };
