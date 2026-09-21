// @ffm/parser/src/plugin/ast.ts
import type { ASTNode } from '#/type';

type ASTNodeReplacement = ASTNode | readonly ASTNode[];

// Recursively transform only changed branches and preserve unchanged node arrays.
export const mapAstNodes = (
  nodes: ASTNode[],
  transformNode: (node: ASTNode) => ASTNodeReplacement,
): ASTNode[] => {
  let transformedNodes: ASTNode[] | undefined;

  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const transformedChildren = node.content
      ? mapAstNodes(node.content, transformNode)
      : node.content;
    const transformedNode =
      transformedChildren && transformedChildren !== node.content
        ? { ...node, content: transformedChildren }
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
