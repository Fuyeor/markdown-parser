// @ffm/editor/src/clipboard/type.ts

/** Incoming clipboard content. `html` wins when present, `text` is the fallback. */
export type ClipboardPayload = {
  text?: string;
  html?: string;
};

/** Outgoing clipboard content. `html` is omitted until the renderer can project a selection range. */
export type ClipboardOutput = {
  text: string;
  html?: string;
};
