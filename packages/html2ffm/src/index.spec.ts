// @fuyeor/html2ffm/src/index.spec.ts
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
