// @fuyeor/markdown-parser/src/plugins/extensions.ts
import type { ASTNode, ASTTransform, MarkdownPlugin } from '#/types';
import { mapAstNodes } from './ast';
import { transformTwemojiNode } from './twemoji';
import {
  SPECIAL_BLOCK_LANGUAGES,
  transformSpecialBlockNode,
  smilesInlinePlugin,
} from './async-blocks';
import { normalizeHighlightLanguage } from './highlight';

// Normalize code languages and special blocks in the same pass as Twemoji.
const transformExtensionNode = (
  node: ASTNode,
): ASTNode | readonly ASTNode[] => {
  if (node.type === 'text') return transformTwemojiNode(node);
  if (node.type !== 'code_block') return node;

  const language = normalizeHighlightLanguage(String(node.lang ?? ''));
  const normalizedNode =
    language && language !== node.lang ? { ...node, lang: language } : node;
  return transformSpecialBlockNode(normalizedNode, SPECIAL_BLOCK_LANGUAGES);
};

export const extensionsTransform: ASTTransform = (nodes) =>
  mapAstNodes(nodes, transformExtensionNode);

// Register all five asynchronous/frontend-compatible extensions together.
export const extensionsPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(extensionsTransform);
  smilesInlinePlugin(parser);
};
