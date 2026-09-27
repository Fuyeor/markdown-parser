// @/playground/composable/useScrollSync.ts
import { onScopeDispose } from 'vue';

export type ScrollSource = 'textarea' | 'preview';

let source: ScrollSource | null = null;
let timer: number | undefined;

/** 标记本次滚动由谁发起，100ms 内对面来的反向滚动会被忽略 */
export function markScrollSource(from: ScrollSource) {
  source = from;
  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    source = null;
    timer = undefined;
  }, 100);
}

/** 当前滚动是否由「对面」发起的（用于忽略自身被程序驱动的 scroll 事件） */
export function isScrollFromOther(self: ScrollSource) {
  return source !== null && source !== self;
}

export function useScrollSync() {
  onScopeDispose(() => {
    if (timer) window.clearTimeout(timer);
    source = null;
  });
  return { markScrollSource, isScrollFromOther };
}
