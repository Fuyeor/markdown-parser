// @ffm/parser/src/plugin/smiles/index.ts
import { createCodeBlockTransform } from '#/plugin/ast';
import type {
  InlineRule,
  InlineState,
  AsyncRenderer,
  MarkdownPlugin,
} from '#/type';

export interface SmilesSource {
  endpoint: string;
  limit?: number;
}

const defaultLimit = 100;
const inlineRegex = /^#\[smiles\s*=\s*`([^`]+)`\]/u;

// Parse the FFM #[smiles = `...`] inline placeholder syntax.
export const smilesInlineRule: InlineRule = {
  name: 'smiles_inline',
  marker: ['#'],
  parse(state: InlineState) {
    if (state.currentChar !== '#') return null;

    const match = state.content.slice(state.pos).match(inlineRegex);
    if (!match) return null;

    return {
      node: { type: 'smiles_inline', value: match[1].trim() },
      consumedChars: match[0].length,
    };
  },
};

// 块级规则
export const smilesBlockTransform = createCodeBlockTransform('smiles');

// Build a SMILES renderer with per-code deduplication and bounded cache.
export const createSmiles = (source: SmilesSource): AsyncRenderer => {
  const limit = source.limit ?? defaultLimit;
  const cache = new Map<string, Promise<string>>();

  const fetchSmiles = (smiles: string): Promise<string> => {
    const existing = cache.get(smiles);
    if (existing) return existing;

    const promise = window
      .fetch(`${source.endpoint}?smiles=${encodeURIComponent(smiles)}`)
      .then((response) => {
        if (!response.ok)
          throw new Error(`SMILES request failed: ${response.status}`);
        return response.text();
      });

    promise.catch(() => cache.delete(smiles));
    if (cache.size >= limit) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(smiles, promise);
    return promise;
  };

  return {
    name: 'smiles',
    selector: '[data-async="smiles"]',
    load: () => Promise.resolve(),
    async render(element) {
      const smiles = element.dataset.smiles;
      if (!smiles) return;
      element.innerHTML = await fetchSmiles(smiles);
    },
  };
};

// Register both FFM inline and fenced Smiles syntax.
export const smilesPlugin: MarkdownPlugin = (parser) => {
  parser.addAstTransform(smilesBlockTransform);
  parser.addInlineRule(smilesInlineRule);
  parser.requireCapability('smiles');
};
