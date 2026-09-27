// @ffm/editor/src/render/caret.ts

/** Find the bounding rect of the character at `offset` inside a block element. */
export function locateOffset(root: Node, offset: number): DOMRect | undefined {
  const target = findTextNodeAt(root, offset);
  if (target !== undefined) {
    const range = document.createRange();
    range.setStart(target.node, target.offset);
    range.setEnd(target.node, target.offset);
    return range.getBoundingClientRect();
  }

  // Empty block: use the placeholder <br> so the caret does not collapse to 0,0.
  if (root instanceof Element) {
    const br = root.querySelector('br');
    if (br !== null) return br.getBoundingClientRect();
    return root.getBoundingClientRect();
  }

  return undefined;
}

export function domToOffset(
  root: Node,
  node: Node,
  nodeOffset: number,
): number {
  let total = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current !== null) {
    if (current === node) return total + nodeOffset;
    total += (current as Text).data.length;
    current = walker.nextNode();
  }
  return total;
}

export function findTextNodeAt(
  root: Node,
  offset: number,
): { node: Text; offset: number } | undefined {
  let remaining = offset;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node !== null) {
    const length = node.data.length;
    if (remaining <= length) return { node, offset: remaining };
    remaining -= length;
    node = walker.nextNode() as Text | null;
  }
  const last = lastTextNode(root);
  if (last === undefined || last.data.length === 0) return undefined;
  return { node: last, offset: last.data.length };
}

function lastTextNode(root: Node): Text | undefined {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let last: Text | undefined;
  let current = walker.nextNode() as Text | null;
  while (current !== null) {
    last = current;
    current = walker.nextNode() as Text | null;
  }
  return last;
}
