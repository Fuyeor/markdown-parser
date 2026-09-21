// @fuyeor/html2ffm/src/index.spec.ts
// pnpm --filter @fuyeor/html2ffm test
import { describe, expect, it } from 'vitest';
import { toFFM } from './index';
import fixtures from './fixtures/conversions.json' with { type: 'json' };

describe('toFFM conversions', () => {
  for (const [section, cases] of Object.entries(fixtures)) {
    describe(section, () => {
      for (const [index, { desc, text, expect: expected }] of cases.entries()) {
        it(desc ?? `case ${index + 1}: ${text.slice(0, 30)}`, () => {
          expect(toFFM(text)).toBe(expected);
        });
      }
    });
  }
});

describe('toFFM input validation', () => {
  it('fails fast for non-string input', () => {
    expect(() => toFFM(null as unknown as string)).toThrow(
      new TypeError('Input must be a string'),
    );
  });
});

describe('toFFM options', () => {
  it('respects maxConsecutiveBlankLines option for empty paragraphs and blockquotes', () => {
    const html = '<p>First</p><p></p><p></p><p></p><p></p><p>Second</p>';

    // default (keep 1 blank lines)
    expect(toFFM(html)).toBe('First\n\nSecond');

    // keep 4 blank lines
    expect(toFFM(html, { maxConsecutiveBlankLines: 4 })).toBe(
      'First\n\n\n\n\nSecond',
    );

    // keep 4 blank lines within blockquote
    const quoteHtml =
      '<blockquote><p>Line1</p><p></p><p></p><p>Line2</p><p>Line3</p></blockquote>';
    expect(toFFM(quoteHtml, { maxConsecutiveBlankLines: 2 })).toBe(
      '```quote\nLine1\n\n\nLine2\n\nLine3\n```',
    );
  });
});
