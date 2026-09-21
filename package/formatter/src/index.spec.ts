// @ffm/formatter/src/index.spec.ts
// pnpm --filter @ffm/formatter test
import { describe, expect, it } from 'vitest';
import { format } from './index';
import fixture from './fixture/spec.json' with { type: 'json' };

describe('format fixture', () => {
  for (const item of fixture) {
    it(item.section, () => {
      expect(format(item.origin)).toBe(item.formatted);
    });
  }

  it('fails fast for non-string input', () => {
    expect(() => format(null as unknown as string)).toThrow(TypeError);
  });
});

it('respects maxConsecutiveBlankLines configuration', () => {
  const source = 'First\n\n\n\nSecond';
  // Default (1)
  expect(format(source)).toBe('First\n\nSecond');
  // Allows 2 blank lines
  expect(format(source, { maxConsecutiveBlankLines: 2 })).toBe(
    'First\n\n\nSecond',
  );
  // Compact (0)
  expect(format(source, { maxConsecutiveBlankLines: 0 })).toBe('First\nSecond');
});
