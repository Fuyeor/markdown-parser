// @fuyeor/markdown-parser/src/plugins/latex.ts
import { BlockState, InlineState } from '#/core/state';
import type { BlockRule, InlineRule, MarkdownPlugin } from '#/types';

const MATH_INLINE_MARKER = '$';
const MATH_BLOCK_MARKER = '$$';

// Find an unescaped dollar delimiter without interpreting LaTeX escapes.
const findMathDelimiter = (
  content: string,
  from: number,
  delimiter: string,
): number => {
  let position = content.indexOf(delimiter, from);
  while (position !== -1) {
    let backslashCount = 0;
    for (
      let index = position - 1;
      index >= 0 && content[index] === '\\';
      index--
    )
      backslashCount++;
    if (backslashCount % 2 === 0) return position;
    position = content.indexOf(delimiter, position + delimiter.length);
  }
  return -1;
};

// Parse inline $...$ formulas while leaving unmatched dollars as plain text.
export const latexInlineRule: InlineRule = {
  name: 'math_inline',
  markers: [MATH_INLINE_MARKER],
  parse(state: InlineState) {
    if (state.currentChar !== MATH_INLINE_MARKER) return null;
    if (state.content.startsWith(MATH_BLOCK_MARKER, state.pos)) return null;

    const endIndex = findMathDelimiter(
      state.content,
      state.pos + MATH_INLINE_MARKER.length,
      MATH_INLINE_MARKER,
    );
    if (endIndex === -1) return null;

    return {
      node: {
        type: 'math_inline',
        content: state.content
          .slice(state.pos + MATH_INLINE_MARKER.length, endIndex)
          .trim(),
      },
      consumedChars: endIndex - state.pos + MATH_INLINE_MARKER.length,
    };
  },
};

// Parse a $$...$$ formula as one block, including formulas spanning lines.
export const latexBlockRule: BlockRule = {
  name: 'math_block',
  markers: [MATH_INLINE_MARKER],
  parse(state: BlockState) {
    const firstLine = state.currentLine;
    if (!firstLine) return null;

    const trimmedLine = firstLine.trimStart();
    if (!trimmedLine.startsWith(MATH_BLOCK_MARKER)) return null;

    const contentLines: string[] = [];
    let consumedLines = 1;
    let currentContent = trimmedLine.slice(MATH_BLOCK_MARKER.length);
    let endIndex = findMathDelimiter(currentContent, 0, MATH_BLOCK_MARKER);

    while (endIndex === -1) {
      contentLines.push(currentContent);
      if (state.lineIndex + consumedLines >= state.lineCount) return null;
      currentContent = state.lines[state.lineIndex + consumedLines];
      consumedLines++;
      endIndex = findMathDelimiter(currentContent, 0, MATH_BLOCK_MARKER);
    }

    contentLines.push(currentContent.slice(0, endIndex));
    const trailingContent = currentContent.slice(
      endIndex + MATH_BLOCK_MARKER.length,
    );
    if (trailingContent.trim() !== '') return null;

    return {
      node: {
        type: 'math_block',
        content: contentLines.join('\n').trim(),
      },
      consumedLines,
    };
  },
};

// Register LaTeX block and inline rules on a markdown-parser instance.
export const latexPlugin: MarkdownPlugin = (parser) => {
  parser.addBlockRule(latexBlockRule).addInlineRule(latexInlineRule);
};
