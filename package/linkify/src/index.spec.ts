// @ffm/linkify/src/index.spec.ts
import { describe, expect, it } from 'vitest';
import { linkify } from './index';
import fixture from '../../../fixture/linkify.json' with { type: 'json' };

// Execute every language-neutral linkify fixture against the TypeScript implementation.
describe('language-neutral linkify fixture', () => {
  expect(fixture.schema_version).toBe(1);

  for (const [index, item] of fixture.case.entries()) {
    it(String(index), () => {
      const actual = linkify(item.input).map(({ text, url }) => ({
        text,
        url,
      }));
      expect(actual).toEqual(item.link);
    });
  }
});
