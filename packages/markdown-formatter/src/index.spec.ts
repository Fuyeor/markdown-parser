// @fuyeor/markdown-formatter/src/index.spec.ts
// pnpm --filter @fuyeor/markdown-formatter test
import { describe, expect, it } from 'vitest';
import { format } from './index';
import fixtures from './fixtures/format.json' with { type: 'json' };

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
