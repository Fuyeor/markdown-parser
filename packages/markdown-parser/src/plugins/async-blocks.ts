// @fuyeor/markdown-parser/src/plugins/async-blocks.ts
import { InlineState } from '#/core/state';
import type {
  ASTNode,
  ASTTransform,
  InlineRule,
  MarkdownPlugin,
} from '#/types';
import { mapAstNodes } from './ast';
import { normalizeHighlightLanguage } from './highlight';

const SMILES_INLINE_PATTERN = /^#\[smiles\s*=\s*`([^`]+)`\]/u;
export const SPECIAL_BLOCK_LANGUAGES = new Set(['mermaid', 'abc', 'smiles']);

// Parse the FFM #[smiles = `...`] inline placeholder syntax.
export const smilesInlineRule: InlineRule = {
  name: 'smiles_inline',
  markers: ['#'],
  parse(state: InlineState) {
    if (state.currentChar !== '#') return null;

    const match = state.content.slice(state.pos).match(SMILES_INLINE_PATTERN);
    if (!match) return null;

    return {
      node: { type: 'smiles_inline', content: match[1].trim() },
      consumedChars: match[0].length,
    };
  },
};

// Convert one fenced code block into its asynchronous renderer placeholder.
export const transformSpecialBlockNode = (
  node: ASTNode,
  languages: ReadonlySet<string>,
): ASTNode => {
  if (node.type !== 'code_block') return node;

  const language = normalizeHighlightLanguage(String(node.lang ?? ''));
  if (!languages.has(language)) return node;

  return {
    type: language === 'smiles' ? 'smiles_block' : language,
    content: String(node.content ?? ''),
  } satisfies ASTNode;
};

// Build a lazy transform for a selected set of special fenced languages.
const createSpecialBlockTransform =
  (languages: ReadonlySet<string>): ASTTransform =>
  (nodes) =>
    mapAstNodes(nodes, (node) => transformSpecialBlockNode(node, languages));

export const mermaidTransform = createSpecialBlockTransform(
  new Set(['mermaid']),
);
export const abcTransform = createSpecialBlockTransform(new Set(['abc']));
export const smilesBlockTransform = createSpecialBlockTransform(
  new Set(['smiles']),
);
export const specialBlockTransform = createSpecialBlockTransform(
  SPECIAL_BLOCK_LANGUAGES,
);

// Register Mermaid, ABC, and fenced Smiles block placeholders together.
export const specialBlockPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(specialBlockTransform);
};

// Register only Mermaid fenced blocks for consumers that opt in selectively.
export const mermaidPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(mermaidTransform);
};

// Register only ABC fenced blocks for consumers that opt in selectively.
export const abcPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(abcTransform);
};

// Register only fenced Smiles blocks for consumers that opt in selectively.
export const smilesBlockPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(smilesBlockTransform);
};

// Register the FFM inline Smiles syntax.
export const smilesInlinePlugin: MarkdownPlugin = (parser) => {
  parser.addInlineRule(smilesInlineRule);
};

// Register both inline and fenced Smiles syntax.
export const smilesPlugin: MarkdownPlugin = (parser) => {
  smilesInlinePlugin(parser);
  smilesBlockPlugin(parser);
};
