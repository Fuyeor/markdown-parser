// @ffm/editor/src/parse/bridge.ts
import { createFuyeorMarkdownParser } from '@ffm/parser';
import type { ASTNode } from '@ffm/parser';
import { nextBlockId } from '#/state/id';
import type {
  Block,
  BlockAttr,
  BlockType,
  DocumentModel,
  Format,
  FormatType,
} from '#/state/document';

const parse = createFuyeorMarkdownParser();

type BlockContext = {
  listDepth: number;
  quoteDepth: number;
};

/** Convert FFM source into the editor document model. */
export function fromFFM(source: string): DocumentModel {
  const nodeArray = parse(source);
  const blockArray = collectBlock(nodeArray, { listDepth: 0, quoteDepth: 0 });
  if (blockArray.length === 0) {
    blockArray.push({
      id: nextBlockId(),
      type: 'paragraph',
      text: '',
      formatArray: [],
      attr: {},
    });
  }
  return { blockArray };
}

/** Collect block-level nodes into flat editor blocks. List and blockquote are flattened. */
function collectBlock(nodeArray: ASTNode[], context: BlockContext): Block[] {
  const blockArray: Block[] = [];

  for (const node of nodeArray) {
    switch (node.type) {
      case 'paragraph':
      case 'heading':
      case 'code_block':
      case 'math_block':
      case 'mermaid':
      case 'abc':
      case 'smiles_block':
      case 'hr':
        blockArray.push(createLeafBlock(node, context));
        break;

      case 'list':
        blockArray.push(...createListBlock(node, context));
        break;

      case 'blockquote':
        blockArray.push(
          ...collectBlock(node.content ?? [], {
            ...context,
            quoteDepth: context.quoteDepth + 1,
          }),
        );
        break;

      case 'table':
        blockArray.push(createEmptyBlock());
        break;

      default:
        blockArray.push(
          createLeafBlock({ ...node, type: 'paragraph' }, context),
        );
        break;
    }
  }

  return blockArray;
}

function createLeafBlock(node: ASTNode, context: BlockContext): Block {
  const id = nextBlockId();

  if (node.type === 'hr') {
    return { id, type: 'divider', text: '', formatArray: [], attr: {} };
  }

  let text: string;
  let formatArray: Format[];

  if (typeof node.value === 'string' && node.content === undefined) {
    text = node.value;
    formatArray = [];
  } else {
    const inline = flattenInline(node.content ?? []);
    text = inline.text;
    formatArray = inline.formatArray;
  }

  const attr: BlockAttr = {};
  if (node.type === 'heading')
    attr.level = typeof node.level === 'number' ? node.level : 1;
  if (node.type === 'code_block' && typeof node.lang === 'string')
    attr.language = node.lang;
  if (node.type === 'mermaid') attr.language = 'mermaid';
  if (node.type === 'math_block') attr.language = 'math';
  if (node.type === 'abc') attr.language = 'abc';
  if (node.type === 'smiles_block') attr.language = 'smiles';
  if (context.quoteDepth > 0) attr.quoteDepth = context.quoteDepth;

  return { id, type: blockTypeFor(node.type), text, formatArray, attr };
}

function createEmptyBlock(): Block {
  return {
    id: nextBlockId(),
    type: 'paragraph',
    text: '',
    formatArray: [],
    attr: {},
  };
}

function blockTypeFor(nodeType: string): BlockType {
  switch (nodeType) {
    case 'heading':
      return 'heading';
    case 'code_block':
      return 'code-block';
    case 'blockquote':
      return 'quote';
    case 'list_item':
      return 'list-item';
    case 'hr':
      return 'divider';
    case 'table':
      return 'table';
    case 'paragraph':
    default:
      return 'paragraph';
  }
}

function createListBlock(listNode: ASTNode, context: BlockContext): Block[] {
  const blockArray: Block[] = [];
  const ordered = listNode.ordered ?? false;
  const itemContext: BlockContext = {
    ...context,
    listDepth: context.listDepth + 1,
  };

  for (const child of listNode.content ?? []) {
    if (child.type !== 'list_item') continue;
    blockArray.push(...createListItemBlock(child, itemContext, ordered));
  }

  return blockArray;
}

function createListItemBlock(
  itemNode: ASTNode,
  context: BlockContext,
  ordered: boolean,
): Block[] {
  const blockArray: Block[] = [];
  const childArray = itemNode.content ?? [];
  const first = childArray[0];

  let text = '';
  let formatArray: Format[] = [];

  if (first !== undefined) {
    if (first.type === 'paragraph') {
      const inline = flattenInline(first.content ?? []);
      text = inline.text;
      formatArray = inline.formatArray;
    } else if (first.type === 'text') {
      text = first.value ?? '';
    }
  }

  const attr: BlockAttr = {
    ordered,
    depth: context.listDepth,
  };
  if (itemNode.hasCheckbox === true)
    attr.checked = itemNode.isCompleted === true;
  if (context.quoteDepth > 0) attr.quoteDepth = context.quoteDepth;

  blockArray.push({
    id: nextBlockId(),
    type: 'list-item',
    text,
    formatArray,
    attr,
  });

  for (let index = 1; index < childArray.length; index += 1) {
    const child = childArray[index]!;
    if (child.type === 'list') {
      blockArray.push(...createListBlock(child, context));
    } else {
      blockArray.push(...collectBlock([child], context));
    }
  }

  return blockArray;
}

/** Flatten a tree of inline nodes into plain text plus a list of ranges. */
function flattenInline(nodeArray: ASTNode[]): {
  text: string;
  formatArray: Format[];
} {
  let text = '';
  const formatArray: Format[] = [];

  for (const node of nodeArray) {
    if (node.type === 'text' || node.type === 'emoji') {
      text += node.value ?? '';
      continue;
    }
    if (node.type === 'hardbreak') {
      text += '\n';
      continue;
    }

    // Leaf nodes carry their text in `value` and have no children (e.g. inline_code).
    if (node.content === undefined && typeof node.value === 'string') {
      const start = text.length;
      text += node.value;
      const formatType = formatTypeFor(node.type);
      if (formatType !== undefined)
        formatArray.push({ from: start, to: text.length, type: formatType });
      continue;
    }

    const start = text.length;
    const inner = flattenInline(node.content ?? []);
    text += inner.text;
    const end = text.length;

    for (const format of inner.formatArray) {
      formatArray.push({
        ...format,
        from: format.from + start,
        to: format.to + start,
      });
    }

    const formatType = formatTypeFor(node.type);
    if (formatType !== undefined && end > start) {
      const format: Format = { from: start, to: end, type: formatType };
      if (node.type === 'link' && typeof node.url === 'string')
        format.value = node.url;
      formatArray.push(format);
    }
  }

  return { text, formatArray };
}

function formatTypeFor(nodeType: string): FormatType | undefined {
  switch (nodeType) {
    case 'bold':
      return 'bold';
    case 'italic':
      return 'italic';
    case 'underline':
      return 'underline';
    case 'strike':
      return 'strike';
    case 'link':
      return 'link';
    case 'inline_code':
      return 'code';
    case 'math_inline':
      return 'code';
    case 'smiles_inline':
      return 'smiles';
    default:
      return undefined;
  }
}
