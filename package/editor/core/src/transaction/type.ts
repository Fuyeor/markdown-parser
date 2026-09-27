// @ffm/editor/src/transaction/type.ts
import type { Block, BlockAttr, Format } from '#/state/document';
import type { Position } from '#/state/selection';

/**
 * Every state change goes through a Transaction. This is the only write path.
 * Text-level transactions carry a blockId because each block owns its own text buffer.
 */
export type Transaction =
  | { type: 'insert'; blockId: string; offset: number; text: string }
  | { type: 'delete'; blockId: string; from: number; to: number }
  | { type: 'replace'; blockId: string; from: number; to: number; text: string }
  | { type: 'select'; anchor: Position; head: Position }
  | { type: 'splitBlock'; blockId: string; offset: number; newBlockId: string }
  | { type: 'mergeBlock'; blockId: string }
  | { type: 'insertBlock'; afterBlockId: string | undefined; block: Block }
  | { type: 'removeBlock'; blockId: string }
  | { type: 'setBlockType'; blockId: string; blockType: Block['type'] }
  | { type: 'setBlockAttr'; blockId: string; attr: BlockAttr }
  | { type: 'addFormat'; blockId: string; format: Format }
  | {
      type: 'removeFormat';
      blockId: string;
      from: number;
      to: number;
      formatType: Format['type'];
    }
  /** Replace `removeCount` blocks starting at `fromIndex` with `blockArray`. Used for inverses. */
  | {
      type: 'restoreBlocks';
      fromIndex: number;
      removeCount: number;
      blockArray: Block[];
    }
  | {
      type: 'replaceBlockArray';
      from: Position;
      to: Position;
      blockArray: Block[];
    };
