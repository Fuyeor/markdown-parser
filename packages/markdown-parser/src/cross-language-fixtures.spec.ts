// packages/markdown-parser/src/cross-language-fixtures.spec.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createFuyeorMarkdownParser, createMarkdownParser } from './default';
import { render } from './core/render';

type MarkdownFixture = {
  id: string;
  parser: 'standard' | 'ffm';
  source: string;
  expected_html: string;
  tags: string[];
};

type MarkdownFixtureFile = {
  schema_version: number;
  description: string;
  cases: MarkdownFixture[];
};

const fixtures = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, '../../../fixtures/markdown.json'),
    'utf8',
  ),
) as MarkdownFixtureFile;

const standardParser = createMarkdownParser();
const ffmParser = createFuyeorMarkdownParser();

// Execute every language-neutral render fixture against the TypeScript reference parser.
describe('language-neutral Markdown fixtures', () => {
  expect(fixtures.schema_version).toBe(1);

  for (const fixture of fixtures.cases) {
    it(fixture.id, () => {
      const parser = fixture.parser === 'ffm' ? ffmParser : standardParser;
      expect(render(parser(fixture.source))).toBe(fixture.expected_html);
    });
  }
});
