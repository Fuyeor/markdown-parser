// @ffm/editor/src/caret/default-renderer.ts
import type { CaretRenderer } from './type';

/** Default caret: GPU-composited, WAAPI-driven blink, zero document.head injection. */
export function createDefaultCaretRenderer(): CaretRenderer {
  let element: HTMLElement | undefined;
  let container: HTMLElement | undefined;
  let animation: Animation | undefined;

  return {
    mount(target) {
      container = target;
      element = document.createElement('div');
      element.className = 'ffm-caret';
      element.style.position = 'absolute';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '1.5px';
      element.style.background = 'currentColor';
      element.style.pointerEvents = 'none';
      element.style.display = 'none';
      element.style.willChange = 'transform';
      target.append(element);

      animation = element.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 1000,
        iterations: Infinity,
        easing: 'steps(2, start)',
      });
      animation.pause();
    },

    update(rect) {
      if (
        element === undefined ||
        container === undefined ||
        animation === undefined
      )
        return;
      const containerRect = container.getBoundingClientRect();
      const x = rect.left - containerRect.left + container.scrollLeft;
      const y = rect.top - containerRect.top + container.scrollTop;
      element.style.display = 'block';
      element.style.height = `${rect.height > 0 ? rect.height : 20}px`;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      // Reset blink phase so the caret stays solid right after typing or moving.
      animation.currentTime = 0;
      animation.play();
    },

    hide() {
      if (element === undefined || animation === undefined) return;
      element.style.display = 'none';
      animation.pause();
    },

    destroy() {
      animation?.cancel();
      animation = undefined;
      element?.remove();
      element = undefined;
      container = undefined;
    },
  };
}
