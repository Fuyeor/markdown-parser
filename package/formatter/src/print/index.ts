// @ffm/formatter/src/print/index.ts
import type { ASTNode } from '@ffm/parser';
import { printBlockNode } from './block';
import type { FormatOption } from '#/type';

export * from './block';
export * from './inline';

/** Serialize AST nodes back into canonical FFM document string with blank line normalization. */
export function printAst(
  root: ASTNode | readonly ASTNode[],
  option: FormatOption | undefined,
): string {
  const nodes = Array.isArray(root)
    ? root
    : ((root as ASTNode).content ?? [root as ASTNode]);

  const renderedBlocks: string[] = [];
  const maxBlank = option?.maxBlankLine ?? 1;

  for (const node of nodes) {
    const blockOutput = printBlockNode(node, option).trim();
    if (blockOutput) {
      renderedBlocks.push(blockOutput);
    }
  }

  const blankDelimiter = '\n'.repeat(maxBlank + 1);
  return renderedBlocks.join(blankDelimiter);
}
