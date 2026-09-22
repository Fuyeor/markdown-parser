// @ffm/formatter/src/transform/index.ts
import { applyAutoCase } from './case';
import { applyContinuousScript } from './continuous';
import { applyGlossary } from './glossary';
import type { FormatOption } from '#/type';

export * from './case';
export * from './continuous';
export * from './glossary';
export * from './punctuation';

/** Execute the complete text typography pipeline in strict precedence order. */
export function transformTextNode(
  content: string,
  option: FormatOption | undefined,
  context: 'heading' | 'sentence' = 'sentence',
): string {
  if (!content) return '';

  // 1. Glossary replacement (high priority)
  let result = applyGlossary(content, option?.autoCase?.glossary);

  // 2. Custom transformer callback
  if (option?.transformer) {
    result = option.transformer(result);
  }

  // 3. Western auto casing
  result = applyAutoCase(result, option?.autoCase, context);

  // 4. Continuous script formatting (autoSpacing + autoUpperWord)
  result = applyContinuousScript(result, option?.continuousScript);

  return result;
}
