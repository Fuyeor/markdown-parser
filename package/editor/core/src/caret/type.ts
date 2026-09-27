// @ffm/editor/src/caret/type.ts

/** A caret renderer draws the visual caret. The native EditContext caret is suppressed separately. */
export type CaretRenderer = {
  /** Mount the caret into the given container. */
  mount(container: HTMLElement): void;
  /** Move the caret to the given viewport rect. */
  update(rect: DOMRect): void;
  /** Hide the caret, e.g. when the editor loses focus. */
  hide(): void;
  /** Remove the caret and release any resources. */
  destroy(): void;
};
