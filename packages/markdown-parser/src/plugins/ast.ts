// @fuyeor/markdown-parser/src/plugins/ast.ts
import type { ASTNode } from '#/types';

type ASTNodeReplacement = ASTNode | readonly ASTNode[];

// Recursively transform only changed branches and preserve unchanged node arrays.
export const mapAstNodes = (
  nodes: ASTNode[],
  transformNode: (node: ASTNode) => ASTNodeReplacement,
): ASTNode[] => {
  let transformedNodes: ASTNode[] | undefined;

  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const transformedChildren = node.children
      ? mapAstNodes(node.children, transformNode)
      : node.children;
    const transformedNode =
      transformedChildren && transformedChildren !== node.children
        ? { ...node, children: transformedChildren }
        : node;
    const replacement = transformNode(transformedNode);
    const replacementNodes = Array.isArray(replacement)
      ? replacement
      : [replacement];

    if (
      !transformedNodes &&
      (replacementNodes.length !== 1 || replacementNodes[0] !== node)
    ) {
      transformedNodes = nodes.slice(0, index);
    }
    transformedNodes?.push(...replacementNodes);
  }

  return transformedNodes ?? nodes;
};
