// @fuyeor/markdown-parser/src/core/parser.ts
import { BlockState, InlineState } from './state';
import type {
  ASTNode,
  BlockRule,
  InlineRule,
  MarkdownPlugin,
  MarkdownParserOptions,
  ParserContext,
} from '#/types';
import { isSafeLinkUrl } from '#/core/url';

const LINKIFY_REGEX =
  /(https?:\/\/[^\s]+|(?<![@\w])(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gv;

export class MarkdownParser {
  #blockRuleMap = new Map<string, BlockRule[]>();
  #inlineRuleMap = new Map<string, InlineRule[]>();
  #fallbackInlineRules: InlineRule[] = [];
  #idSequence = 0;
  #isPreflight = false;
  readonly #maxNestingDepth: number;

  constructor(options: MarkdownParserOptions = {}) {
    const maxNestingDepth = options.maxNestingDepth ?? 64;
    if (!Number.isInteger(maxNestingDepth) || maxNestingDepth < 1)
      throw new RangeError('maxNestingDepth must be a positive integer');

    this.#maxNestingDepth = maxNestingDepth;
  }

  // construct a context for recursive rule calls
  readonly #context: ParserContext = this.#createContext(0);

  #createContext(depth: number): ParserContext {
    return {
      parseInline: (content: string) =>
        this.#parseInline(new InlineState(content), depth + 1),
      parseBlocks: (content: string) =>
        this.#parseBlocks(new BlockState(content), depth + 1),
      createId: (prefix: string) =>
        this.#isPreflight
          ? `${prefix}-probe`
          : `${prefix}-${this.#idSequence++}`,
    };
  }

  // register block rule
  // By default, it inserts at the end, or before/after a specified rule.
  addBlockRule(rule: BlockRule): this {
    for (const marker of rule.markers) {
      const list = this.#blockRuleMap.get(marker) || [];
      list.push(rule);
      this.#blockRuleMap.set(marker, list);
    }
    return this;
  }

  // register inline rule
  addInlineRule(rule: InlineRule): this {
    if (rule.fallback) this.#fallbackInlineRules.push(rule);

    // register the rule under its markers for quick lookup during parsing
    for (const marker of rule.markers) {
      const rulesForMarker = this.#inlineRuleMap.get(marker) || [];
      // ensure the rule is in the list for this marker
      rulesForMarker.unshift(rule);
      this.#inlineRuleMap.set(marker, rulesForMarker);
    }

    return this;
  }

  use(plugin: MarkdownPlugin): this {
    plugin(this);
    return this;
  }

  build(): (content: string) => ASTNode[] {
    return (content: string) => {
      this.#idSequence = 0;
      const state = new BlockState(content);
      return this.#parseBlocks(state);
    };
  }

  #parseBlocks(state: BlockState, depth = 0): ASTNode[] {
    if (depth > this.#maxNestingDepth) {
      return [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              content: state.remainingLines.join('\n'),
            },
          ],
        },
      ];
    }

    const context = depth === 0 ? this.#context : this.#createContext(depth);
    const nodes: ASTNode[] = [];
    while (state.lineIndex < state.lineCount) {
      const line = state.currentLine;

      // skip purely empty line
      if (!line || line.trim() === '') {
        state.advance(1);
        continue;
      }

      // find the first non-whitespace character
      const trimmed = line.trimStart();
      const firstChar = trimmed[0];

      // get candidate rules based on the first character
      const rules = this.#blockRuleMap.get(firstChar);

      let matched = false;

      if (rules) {
        for (const rule of rules) {
          const result = rule.parse(state, context);
          if (result) {
            nodes.push(result.node);
            state.advance(result.consumedLines);
            matched = true;
            break;
          }
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
          const mayInterrupt =
            // # for title
            firstChar === 35 ||
            // * for bold and italic
            firstChar === 42 ||
            // _ for underline
            firstChar === 95 ||
            // +
            firstChar === 43 ||
            // - for bulletin list and strike
            firstChar === 45 ||
            // 0-9 for ordered list
            (firstChar >= 48 && firstChar <= 57) ||
            // > for inline quote
            firstChar === 62 ||
            // ` for code block and inline code
            firstChar === 96 ||
            // ~ equals `
            firstChar === 126;

          if (mayInterrupt) {
            const rules = this.#blockRuleMap.get(
              String.fromCharCode(firstChar),
            );
            let isInterrupted = false;

            if (rules) {
              for (const rule of rules) {
                if (
                  [
                    'heading',
                    'hr',
                    'blockquote',
                    'list',
                    'code_block',
                    'ffm_blocks',
                  ].includes(rule.name)
                ) {
                  this.#isPreflight = true;
                  try {
                    if (rule.parse(state, context) !== null) {
                      isInterrupted = true;
                      break;
                    }
                  } finally {
                    this.#isPreflight = false;
                  }
                }
              }
            }

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
              depth,
            ),
          });
        }
      }
    }
    return nodes;
  }

  #parseInline(state: InlineState, depth = 0): ASTNode[] {
    if (depth > this.#maxNestingDepth) {
      return [{ type: 'text', content: state.content.slice(state.pos) }];
    }

    const context = depth === 0 ? this.#context : this.#createContext(depth);
    const nodes: ASTNode[] = [];

    // record the start position of plain text
    let textStart = state.pos;

    // linkify
    const flushText = (endPos: number) => {
      if (endPos > textStart) {
        const textBuffer = state.content.slice(textStart, endPos);
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
            if (closeCount > openCount) urlStr = urlStr.slice(0, -1);
          }

          const fullUrl = urlStr.startsWith('http')
            ? urlStr
            : `https://${urlStr}`;

          if (isSafeLinkUrl(fullUrl)) {
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
      }
    };

    while (state.pos < state.length) {
      const char = state.currentChar;

      // find candidate rules based on the current character
      const rules = char ? this.#inlineRuleMap.get(char) : undefined;
      const fallbackRules = this.#fallbackInlineRules;

      if (rules || fallbackRules.length > 0) {
        let matched = false;

        // only check rules that are registered for this marker character
        for (const rule of rules ?? []) {
          const result = rule.parse(state, context);
          if (result) {
            flushText(state.pos);
            nodes.push(result.node);
            state.advance(result.consumedChars);
            textStart = state.pos;
            matched = true;
            break;
          }
        }

        if (!matched) {
          // Fallback rules are opt-in and run only after marker-specific rules fail.
          for (const rule of fallbackRules ?? []) {
            const result = rule.parse(state, context);
            if (result) {
              flushText(state.pos);
              nodes.push(result.node);
              state.advance(result.consumedChars);
              textStart = state.pos;
              matched = true;
              break;
            }
          }
        }

        // skip the normal character advancement if any rule matched
        if (matched) continue;
      }

      // normal characters without matching rules, just advance
      if (char === '\n') {
        flushText(state.pos);
        nodes.push({ type: 'hardbreak' });
        state.advance(1);
        textStart = state.pos;
        continue;
      }

      // just advance the pointer for normal characters
      state.advance(1);
    }

    flushText(state.pos);
    return nodes;
  }
}
