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
  input: string;
  links: LinkFixtureMatch[];
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

// Execute every language-neutral linkify fixture against the TypeScript implementation.
describe('language-neutral linkify fixtures', () => {
  expect(fixtures.schema_version).toBe(1);

  for (const [index, fixture] of fixtures.cases.entries()) {
    it(String(index), () => {
      const actual = linkify(fixture.input).map(({ text, url }) => ({
        text,
        url,
      }));
      expect(actual).toEqual(fixture.links);
    });
  }
});
