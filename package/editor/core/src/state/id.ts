// @ffm/editor/src/state/id.ts

let counter = 0;

/** Generate a unique block id for local editing. */
export function nextBlockId(): string {
  return `block-${counter++}`;
}

/** Reset the counter. Used by tests. */
export function resetBlockId() {
  counter = 0;
}
