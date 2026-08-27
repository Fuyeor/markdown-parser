// packages/markdown-parser/src/cross-language-fixtures.spec.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isSafeColorValue } from './core/color';
import { MarkdownParser } from './core/parser';
import { isSafeLinkUrl } from './core/url';
import { render } from './core/render';
import { createFuyeorMarkdownParser, createMarkdownParser } from './default';

type FixtureSuite = 'unit' | 'ffm' | 'safety';

type FixtureAssertion = {
  path: string;
  equals?: unknown;
  length?: number;
};

type MarkdownFixture = {
  id: string;
  parser: 'standard' | 'ffm';
  source_suite: FixtureSuite;
  operation?: 'parse' | 'construct' | 'safe_link' | 'safe_color';
  source?: string;
  value?: string;
  expected?: boolean;
  expected_html?: string;
  output_normalization?: 'trim';
  expected_error?: 'invalid_nesting_depth';
  expect_no_throw?: boolean;
  options?: { max_nesting_depth?: number };
  assertions?: FixtureAssertion[];
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

// Read a portable JSON Pointer path from a TypeScript AST value.
function readJsonPointer(root: unknown, pointer: string): unknown {
  let value = root;
  for (const rawSegment of pointer.split('/').slice(1)) {
    const segment = rawSegment.replaceAll('~1', '/').replaceAll('~0', '~');
    if (Array.isArray(value)) {
      value = value[Number(segment)];
      continue;
    }
    if (value !== null && typeof value === 'object') {
      value = (value as Record<string, unknown>)[segment];
      continue;
    }
    return undefined;
  }
  return value;
}

// Map the wire-level snake_case options to the TypeScript API.
function parserOptions(fixture: MarkdownFixture) {
  return fixture.options === undefined
    ? undefined
    : { maxNestingDepth: fixture.options.max_nesting_depth };
}

// Execute one canonical fixture against the TypeScript reference implementation.
function executeFixture(fixture: MarkdownFixture): void {
  const options = parserOptions(fixture);
  if (fixture.operation === 'safe_link') {
    expect(isSafeLinkUrl(fixture.value ?? '')).toBe(fixture.expected);
    return;
  }
  if (fixture.operation === 'safe_color') {
    expect(isSafeColorValue(fixture.value ?? '')).toBe(fixture.expected);
    return;
  }
  if (fixture.operation === 'construct') {
    expect(() => new MarkdownParser(options)).toThrow(RangeError);
    return;
  }

  const parser =
    fixture.parser === 'ffm'
      ? createFuyeorMarkdownParser(options)
      : createMarkdownParser(options);
  const ast = parser(fixture.source ?? '');

  if (fixture.expected_html !== undefined) {
    const actualHtml = render(ast);
    const expectedHtml =
      fixture.output_normalization === 'trim'
        ? fixture.expected_html.trim()
        : fixture.expected_html;
    expect(
      fixture.output_normalization === 'trim' ? actualHtml.trim() : actualHtml,
    ).toBe(expectedHtml);
  }

  for (const assertion of fixture.assertions ?? []) {
    const value = readJsonPointer(ast, assertion.path);
    if (assertion.length !== undefined) {
      expect(Array.isArray(value) ? value.length : undefined).toBe(
        assertion.length,
      );
      continue;
    }
    expect(value).toEqual(assertion.equals);
  }

  if (fixture.expect_no_throw) expect(ast).toEqual(expect.any(Array));
}

// Execute one named fixture suite while keeping all cases in the JSON file.
function executeSuite(suite: FixtureSuite): void {
  describe(`${suite} fixtures`, () => {
    for (const fixture of fixtures.cases.filter(
      (candidate) => candidate.source_suite === suite,
    )) {
      it(fixture.id, () => executeFixture(fixture));
    }
  });
}

describe('language-neutral Markdown fixtures', () => {
  expect(fixtures.schema_version).toBe(1);
});

executeSuite('unit');
executeSuite('ffm');
executeSuite('safety');
