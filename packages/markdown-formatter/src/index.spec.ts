// @fuyeor/markdown-formatter/src/index.spec.ts
import { describe, expect, it } from 'vitest';
import fixtureData from './fixtures/format.json';
import { format } from './index';

type FormatFixture = {
  origin: string;
  formatted: string;
  section: string;
};

const fixtures = fixtureData as FormatFixture[];

describe('format fixtures', () => {
  for (const fixture of fixtures) {
    it(fixture.section, () => {
      expect(format(fixture.origin)).toBe(fixture.formatted);
    });
  }

  it('fails fast for non-string input', () => {
    expect(() => format(null as unknown as string)).toThrow(TypeError);
  });
});
