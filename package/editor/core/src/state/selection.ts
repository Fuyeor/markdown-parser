// @ffm/editor/src/state/selection.ts

export type Position = {
  blockId: string;
  offset: number;
};

export type Selection = {
  anchor: Position;
  head: Position;
};

/** True when anchor and head point at the same block and offset. */
export function isCollapsed(value: Selection): boolean {
  return (
    value.anchor.blockId === value.head.blockId &&
    value.anchor.offset === value.head.offset
  );
}

/** Order two positions by document order. `from` comes before `to`. */
export function order(
  value: Selection,
  blockArray: { id: string }[],
): [Position, Position] {
  const anchorIndex = blockArray.findIndex(
    (block) => block.id === value.anchor.blockId,
  );
  const headIndex = blockArray.findIndex(
    (block) => block.id === value.head.blockId,
  );

  if (anchorIndex < headIndex) return [value.anchor, value.head];
  if (anchorIndex > headIndex) return [value.head, value.anchor];
  if (value.anchor.offset <= value.head.offset)
    return [value.anchor, value.head];
  return [value.head, value.anchor];
}
