// packages/linkify/src/cross-language-fixtures.spec.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { linkify } from './index';

type LinkFixtureMatch = {
  text: string;
  url: string;
};

type LinkFixture = {
  id: string;
  source: string;
  expected: LinkFixtureMatch[];
};

type LinkFixtureFile = {
  schema_version: number;
  description: string;
  cases: LinkFixture[];
};

const fixtures = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, '../../../fixtures/linkify.json'),
    'utf8',
  ),
) as LinkFixtureFile;

// Execute every language-neutral linkify fixture against the TypeScript reference implementation.
describe('language-neutral linkify fixtures', () => {
  expect(fixtures.schema_version).toBe(1);

  for (const fixture of fixtures.cases) {
    it(fixture.id, () => {
      const actual = linkify(fixture.source).map(({ text, url }) => ({
        text,
        url,
      }));
      expect(actual).toEqual(fixture.expected);
    });
  }
});
