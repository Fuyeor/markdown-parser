// @ffm/parser/src/plugin/ast.ts
import type { ASTNode, ASTTransform } from '#/type';

type ASTNodeReplacement = ASTNode | readonly ASTNode[];

// Recursively transform only changed branches and preserve unchanged node arrays.
export const mapAstNode = (
  nodeArray: ASTNode[],
  transformNode: (node: ASTNode) => ASTNodeReplacement,
): ASTNode[] => {
  let transformedNodes: ASTNode[] | undefined;

  for (let index = 0; index < nodeArray.length; index++) {
    const node = nodeArray[index];
    const transformedChildren = node.content
      ? mapAstNode(node.content, transformNode)
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
      transformedNodes = nodeArray.slice(0, index);
    }
    transformedNodes?.push(...replacementNodes);
  }

  return transformedNodes ?? nodeArray;
};

// 将指定语言的代码块，声明式映射为目标 AST 节点
export const createCodeBlockTransform =
  (language: string, targetType = language): ASTTransform =>
  (nodeArray) =>
    mapAstNode(nodeArray, (node) =>
      node.type === 'code' && node.lang === language
        ? { type: targetType, value: String(node.value ?? '') }
        : node,
    );
