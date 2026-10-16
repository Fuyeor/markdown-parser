// @ffm/parser/src/plugin/ast.ts
import type { ASTNode, ASTTransform } from '#/type';

type ASTNodeReplacement = ASTNode | readonly ASTNode[];

const isNodeArray = (r: ASTNodeReplacement): r is readonly ASTNode[] =>
  Array.isArray(r);

// Recursively transform only changed branches and preserve unchanged node arrays.
export const mapAstNode = (
  nodeArray: ASTNode[],
  transformNode: (node: ASTNode) => ASTNodeReplacement,
): ASTNode[] => {
  let newNodeArray: ASTNode[] | undefined;

  for (let index = 0; index < nodeArray.length; index++) {
    const node = nodeArray[index];
    const content = node.content;

    const transformedChild = content?.length
      ? mapAstNode(content, transformNode)
      : content;

    const transformedNode =
      transformedChild !== content
        ? { ...node, content: transformedChild }
        : node;

    const replacement = transformNode(transformedNode);

    if (isNodeArray(replacement)) {
      if (
        !newNodeArray &&
        (replacement.length !== 1 || replacement[0] !== node)
      ) {
        newNodeArray = nodeArray.slice(0, index);
      }

      if (newNodeArray) {
        for (let i = 0; i < replacement.length; i++) {
          newNodeArray.push(replacement[i]);
        }
      }
    } else {
      if (!newNodeArray && replacement !== node) {
        newNodeArray = nodeArray.slice(0, index);
      }

      if (newNodeArray) {
        newNodeArray.push(replacement);
      }
    }
  }

  return newNodeArray ?? nodeArray;
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
