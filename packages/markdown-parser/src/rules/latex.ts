// @fuyeor/markdown-parser/src/rules/latex.ts
import { BlockState } from '#/core/state';
import type { BlockRule, InlineRule, MarkdownPlugin } from '#/types';

function getBlockContent(
  state: BlockState,
): { content: string; consumedLines: number } | null {
  const firstLine = state.currentLine;
  if (!firstLine) return null;

  const firstContent = firstLine.trimStart();
  if (!firstContent.startsWith('$$')) return null;

  const firstRemainder = firstContent.slice(2);
  const sameLineEnd = firstRemainder.indexOf('$$');
  if (sameLineEnd !== -1) {
    return {
      content: firstRemainder.slice(0, sameLineEnd).trim(),
      consumedLines: 1,
    };
  }

  const contentLines = [firstRemainder];
  for (let offset = 1; state.lineIndex + offset < state.lineCount; offset++) {
    const line = state.lines[state.lineIndex + offset];
    const end = line.indexOf('$$');
    if (end !== -1) {
      contentLines.push(line.slice(0, end));
      return {
        content: contentLines.join('\n').trim(),
        consumedLines: offset + 1,
      };
    }
    contentLines.push(line);
  }

  return null;
}

// Parse single-dollar inline formulas without claiming block delimiters.
export const latexInlineRule: InlineRule = {
  name: 'latex_inline',
  markers: ['$'],
  parse(state) {
    if (state.currentChar !== '$' || state.content[state.pos + 1] === '$')
      return null;

    const end = state.content.indexOf('$', state.pos + 1);
    if (end === -1) return null;

    return {
      node: {
        type: 'math_inline',
        content: state.content.slice(state.pos + 1, end).trim(),
      },
      consumedChars: end - state.pos + 1,
    };
  },
};

// Parse double-dollar block formulas, including multiline content.
export const latexBlockRule: BlockRule = {
  name: 'latex_block',
  markers: ['$'],
  parse(state) {
    const block = getBlockContent(state);
    if (!block) return null;

    return {
      node: { type: 'math_block', content: block.content },
      consumedLines: block.consumedLines,
    };
  },
};

// Register LaTeX as an opt-in FFM extension.
export const latexPlugin: MarkdownPlugin = (parser) => {
  parser.addBlockRule(latexBlockRule).addInlineRule(latexInlineRule);
};
