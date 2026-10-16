// @ffm/parser/src/plugin/index.ts
export { hydrate } from './hydrate';

export { createAbc } from './abc';
export { highlightPlugin, createHighlight } from './highlight';
export { default as fer } from './highlight/language/fer';
export { default as ffm } from './highlight/language/ffm';
export { default as fon } from './highlight/language/fon';
export { getIdentifier, getDisplayName } from './highlight/util';
export {
  latexInlineRule,
  latexBlockRule,
  latexPlugin,
  createLatex,
} from './latex';
export { createMermaid } from './mermaid';
export { createSmiles } from './smiles';
export { twemojiPlugin, transformTwemojiNode, getTwemojiUrl } from './twemoji';

export type { AsyncCapability, AsyncRenderer, HydrateOption } from '#/type';
