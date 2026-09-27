// @ffm/editor/src/test/setup.ts

/**
 * jsdom does not implement WAAPI or Range#getBoundingClientRect.
 * Production code assumes both exist (web baseline 2026), so the gap is filled here.
 */
if (typeof Element.prototype.animate !== 'function') {
  Element.prototype.animate = function () {
    const animation = {
      currentTime: 0,
      playState: 'running' as AnimationPlayState,
      playbackRate: 1,
      startTime: 0,
      id: '',
      pending: false,
      replaceState: 'active' as AnimationReplaceState,
      persist: () => {},
      play: () => {},
      pause: () => {},
      cancel: () => {},
      finish: () => {},
      reverse: () => {},
      updatePlaybackRate: () => {},
      commitStyles: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
      effect: null,
      timeline: null,
      finished: Promise.resolve(),
      oncancel: null,
      onfinish: null,
      onremove: null,
    };
    return animation as unknown as Animation;
  };
}

if (typeof Range.prototype.getBoundingClientRect !== 'function') {
  Range.prototype.getBoundingClientRect = function () {
    return {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

if (typeof CSS === 'undefined') {
  (globalThis as { CSS: unknown }).CSS = {};
}

if (typeof (CSS as { highlights?: unknown }).highlights === 'undefined') {
  (CSS as { highlights: Map<string, unknown> }).highlights = new Map();
}

if (typeof (globalThis as { Highlight?: unknown }).Highlight === 'undefined') {
  (globalThis as { Highlight: unknown }).Highlight = class {
    constructor(public range: Range) {}
  };
}
