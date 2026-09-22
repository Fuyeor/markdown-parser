// @ffm/formatter/src/index.spec.ts
// pnpm --filter @ffm/formatter test
import spec from './fixture/spec.json' with { type: 'json' };
import option from './fixture/option.json' with { type: 'json' };

import { describe, expect, it } from 'vitest';
import { format } from './index';

describe('format fixture', () => {
  for (const item of spec) {
    it(item.section, () => {
      expect(format(item.origin)).toBe(item.formatted);
    });
  }

  it('fails fast for non-string input', () => {
    expect(() => format(null as unknown as string)).toThrow(TypeError);
  });
});

for (const [section, optionCase] of Object.entries(option)) {
  describe(`format option - ${section}`, () => {
    for (const item of optionCase as Array<{
      desc: string;
      text: string;
      option?: Parameters<typeof format>[1];
      expect: string;
    }>) {
      it(item.desc, () => {
        expect(format(item.text, item.option)).toBe(item.expect);
      });
    }
  });
}

describe('format option - custom transformer', () => {
  it('executes custom user text transformer callback', () => {
    const input = 'foo and bar';
    const output = format(input, {
      transformer: (text) => text.replaceAll('foo', 'FOO'),
    });
    expect(output).toBe('FOO and bar');
  });
});
