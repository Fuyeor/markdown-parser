// @ffm/formatter/src/transform/glossary.ts

/** Apply custom glossary terms using negative lookaround boundaries and length-descending precedence. */
export function applyGlossary(
  content: string,
  glossary?: Record<string, string>,
): string {
  if (!content || !glossary) return content;

  const entries = Object.entries(glossary);
  if (entries.length === 0) return content;

  const lookupMap = new Map<string, string>();
  for (const [key, value] of entries) {
    lookupMap.set(key.toLowerCase(), value);
  }

  // Sort terms by length descending to match longer compound phrases before shorter sub-terms
  const terms = Array.from(lookupMap.keys()).sort(
    (a, b) => b.length - a.length,
  );

  const boundaryChars = 'a-zA-Z0-9_./';
  const patternSource = terms
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
    .join('|');
  const pattern = new RegExp(
    `(?<![${boundaryChars}])(${patternSource})(?![${boundaryChars}])`,
    'giu',
  );

  return content.replace(
    pattern,
    (match) => lookupMap.get(match.toLowerCase()) ?? match,
  );
}
