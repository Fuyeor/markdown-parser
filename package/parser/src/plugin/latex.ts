// @ffm/parser/src/plugin/latex.ts
import { BlockState, InlineState } from '#/core/state';
import type { BlockRule, InlineRule, MarkdownPlugin } from '#/type';

const inlineMathMarker = '$';
const blockMathMarker = '$$';

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
  marker: [inlineMathMarker],
  parse(state: InlineState) {
    if (state.currentChar !== inlineMathMarker) return null;
    if (state.content.startsWith(blockMathMarker, state.pos)) return null;

    const endIndex = findMathDelimiter(
      state.content,
      state.pos + inlineMathMarker.length,
      inlineMathMarker,
    );
    if (endIndex === -1) return null;

    return {
      node: {
        type: 'math_inline',
        value: state.content
          .slice(state.pos + inlineMathMarker.length, endIndex)
          .trim(),
      },
      consumedChars: endIndex - state.pos + inlineMathMarker.length,
    };
  },
};

// Parse a $$...$$ formula as one block, including formulas spanning lines.
export const latexBlockRule: BlockRule = {
  name: 'math_block',
  marker: [inlineMathMarker],
  parse(state: BlockState) {
    const firstLine = state.currentLine;
    if (!firstLine) return null;

    const trimmedLine = firstLine.trimStart();
    if (!trimmedLine.startsWith(blockMathMarker)) return null;

    const contentLines: string[] = [];
    let consumedLines = 1;
    let currentContent = trimmedLine.slice(blockMathMarker.length);
    let endIndex = findMathDelimiter(currentContent, 0, blockMathMarker);

    while (endIndex === -1) {
      contentLines.push(currentContent);
      if (state.lineIndex + consumedLines >= state.lineCount) return null;
      currentContent = state.lines[state.lineIndex + consumedLines];
      consumedLines++;
      endIndex = findMathDelimiter(currentContent, 0, blockMathMarker);
    }

    contentLines.push(currentContent.slice(0, endIndex));
    const trailingContent = currentContent.slice(
      endIndex + blockMathMarker.length,
    );
    if (trailingContent.trim() !== '') return null;

    return {
      node: {
        type: 'math_block',
        value: contentLines.join('\n').trim(),
      },
      consumedLines,
    };
  },
};

// Register LaTeX block and inline rules on a markdown-parser instance.
export const latexPlugin: MarkdownPlugin = (parser) => {
  parser.addBlockRule(latexBlockRule).addInlineRule(latexInlineRule);
};
