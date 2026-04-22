// @fuyeor/markdown-parser/src/core/parser.ts
import { BlockState, InlineState } from './state';
import type {
  ASTNode,
  BlockRule,
  InlineRule,
  MarkdownPlugin,
  ParserContext,
} from '#/types';

// prettier-ignore
const INLINE_MARKERS = new Set([
  // **bold** and *italic**
  '*',
  // [link](https://fuyeor.com)
  '[', ']', '(', ')',
  // > inline quote
  '>',
  // `inlineCode` and ```code block
  '`',
  // __underline__
  '_',
  // --strike-- (<del>)
  '-',
]);
const LINKIFY_REGEX = /(https?:\/\/[^\s]+|(?<![@\w])(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gv;

export class MarkdownParser {
  #blockRules: BlockRule[] = [];
  #inlineRules: InlineRule[] = [];

  // construct a context for recursive rule calls
  readonly #context: ParserContext = {
    parseInline: (content: string) =>
      this.#parseInline(new InlineState(content)),
    parseBlocks: (content: string) =>
      this.#parseBlocks(new BlockState(content)),
  };

  // register block rule
  // By default, it inserts at the end, or before/after a specified rule.
  addBlockRule(
    rule: BlockRule,
    anchor?: { before?: string; after?: string },
  ): this {
    if (anchor?.before) {
      const idx = this.#blockRules.findIndex((r) => r.name === anchor.before);
      this.#blockRules.splice(idx === -1 ? 0 : idx, 0, rule);
    } else if (anchor?.after) {
      const idx = this.#blockRules.findIndex((r) => r.name === anchor.after);
      this.#blockRules.splice(
        idx === -1 ? this.#blockRules.length : idx + 1,
        0,
        rule,
      );
    } else {
      this.#blockRules.push(rule);
    }
    return this;
  }

  // register inline rule
  addInlineRule(rule: InlineRule): this {
    this.#inlineRules.unshift(rule);
    return this;
  }

  use(plugin: MarkdownPlugin): this {
    plugin(this);
    return this;
  }

  build(): (content: string) => ASTNode[] {
    return (content: string) => {
      const state = new BlockState(content);
      return this.#parseBlocks(state);
    };
  }

  #parseBlocks(state: BlockState): ASTNode[] {
    const nodes: ASTNode[] = [];
    while (state.lineIndex < state.lineCount) {
      const currentLine = state.currentLine;

      // skip purely empty line
      if (!currentLine || currentLine.trim() === '') {
        state.advance(1);
        continue;
      }

      // attempt to match block-level rules (Heading, CodeBlock, Table, etc.)
      let matched = false;
      for (const rule of this.#blockRules) {
        const result = rule.parse(state, this.#context);
        if (result) {
          nodes.push(result.node);
          state.advance(result.consumedLines);
          matched = true;
          break;
        }
      }

      // continuous text merged into a single paragraph
      if (!matched) {
        const paragraphLines: string[] = [];

        while (state.lineIndex < state.lineCount) {
          const line = state.currentLine;
          if (!line || line.trim() === '') break;

          // fast-path character preflight
          const firstChar = line.trimStart().charCodeAt(0);
          // 35:#, 42:*, 43:+, 45:-, 48-57:0-9, 62:>, 95:_
          const mayInterrupt =
            firstChar === 35 ||
            firstChar === 62 ||
            firstChar === 45 ||
            firstChar === 42 ||
            firstChar === 95 ||
            firstChar === 43 ||
            (firstChar >= 48 && firstChar <= 57);

          if (mayInterrupt) {
            const isInterrupted = this.#blockRules.some((rule) => {
              if (['heading', 'hr', 'blockquote', 'list'].includes(rule.name)) {
                return rule.parse(state, this.#context) !== null;
              }
              return false;
            });
            if (isInterrupted && paragraphLines.length > 0) break;
          }

          paragraphLines.push(line);
          state.advance(1);
        }

        if (paragraphLines.length > 0) {
          nodes.push({
            type: 'paragraph',
            children: this.#parseInline(
              new InlineState(paragraphLines.join('\n')),
            ),
          });
        }
      }
    }
    return nodes;
  }

  #parseInline(state: InlineState): ASTNode[] {
    const nodes: ASTNode[] = [];
    let textBuffer = '';

    // linkify
    const flushText = () => {
      if (textBuffer.length > 0) {
        let lastIdx = 0;
        for (const match of textBuffer.matchAll(LINKIFY_REGEX)) {
          let urlStr = match[0];
          let matchIdx = match.index!;

          // remove the punctuation marks at the end.
          const punctuation = '.,:;?!';
          while (
            urlStr.length > 0 &&
            punctuation.includes(urlStr[urlStr.length - 1])
          ) {
            urlStr = urlStr.slice(0, -1);
          }

          // handle bracket matching
          // If a link ends with `)` and the inner brackets are unbalanced, then strip `)`
          if (urlStr.endsWith(')')) {
            const openCount = (urlStr.match(/\(/g) || []).length;
            const closeCount = (urlStr.match(/\)/g) || []).length;
            if (closeCount > openCount) {
              urlStr = urlStr.slice(0, -1);
            }
          }

      const fullUrl = urlStr.startsWith('http')
            ? urlStr
            : `https://${urlStr}`;

          const isValid =
            fullUrl.startsWith('http://') ||
            fullUrl.startsWith('https://') ||
            globalThis.URL.canParse(fullUrl);

          if (isValid) {
            if (matchIdx > lastIdx) {
              nodes.push({
                type: 'text',
                content: textBuffer.slice(lastIdx, matchIdx),
              });
            }
            nodes.push({
              type: 'link',
              url: fullUrl,
              children: [{ type: 'text', content: urlStr }],
            });
            lastIdx = matchIdx + urlStr.length;
          }
        }

        if (lastIdx < textBuffer.length) {
          nodes.push({ type: 'text', content: textBuffer.slice(lastIdx) });
        }
        textBuffer = '';
      }
    };

    while (state.pos < state.length) {
      const char = state.currentChar;

      
      // ``\n` -> hardbreak
      if (char === '\n') {
        flushText();
        nodes.push({ type: 'hardbreak' });
        state.advance(1);
        continue;
      }


      // escape symbols
      if (char === '\\') {
        const nextChar = state.content[state.pos + 1];
        if (nextChar === '\n') {
          flushText();
          nodes.push({ type: 'hardbreak' });
          state.advance(2);
          continue;
        }

        const escapable = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
        if (nextChar && escapable.includes(nextChar)) {
          textBuffer += nextChar;
          state.advance(2);
          continue;
        }
      }

      // line break (a line ending with two or more spaces followed by a newline character)
      if (char === ' ' && state.content.startsWith(' \n', state.pos)) {
        flushText();
        nodes.push({ type: 'hardbreak' });
        state.advance(2);
        continue;
      }

      // plugin distribution
      if (char && INLINE_MARKERS.has(char)) {
        let matched = false;
        for (const rule of this.#inlineRules) {
          const result = rule.parse(state, this.#context);
          if (result) {
            flushText();
            nodes.push(result.node);
            state.advance(result.consumedChars);
            matched = true;
            break;
          }
        }
        if (matched) continue;
      }

      textBuffer += char;
      state.advance(1);
    }

    flushText();
    return nodes;
  }
}
