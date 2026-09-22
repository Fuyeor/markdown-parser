// @ffm/parser/src/index.spec.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isSafeColorValue } from './core/color';
import { MarkdownParser } from './core/parser';
import { isSafeLinkUrl } from './core/url';
import { render } from './core/render';
import { toPlainText } from './core/plain-text';
import { createFuyeorMarkdownParser, createMarkdownParser } from './default';

type MarkdownAssertion = {
  path: string;
  value?: unknown;
  length?: number;
};

type MarkdownCase = {
  input?: string;
  html?: string;
  plain_text?: string;
  assert?: MarkdownAssertion[];
  error?: 'invalid_nesting_depth';
  no_throw?: boolean;
  option?: { max_nesting_depth?: number };
};

type MarkdownFixtureFile = {
  schema_version: number;
  description: string;
  cases: MarkdownCase[];
};

type SafetyCase = { input: string; valid: boolean };
type SafetyFixtureFile = {
  schema_version: number;
  description: string;
  links: SafetyCase[];
  colors: SafetyCase[];
};

const loadJson = <T>(name: string): T =>
  JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, `../../../fixture/${name}`),
      'utf8',
    ),
  ) as T;

const cfmFixture = loadJson<MarkdownFixtureFile>('markdown.json');
const ffmFixture = loadJson<MarkdownFixtureFile>('ffm.json');
const safetyFixtures = loadJson<SafetyFixtureFile>('safety.json');

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

// Map the wire-level snake_case option to the TypeScript API.
function parserOption(fixture: MarkdownCase) {
  return fixture.option === undefined
    ? undefined
    : { maxNestingDepth: fixture.option.max_nesting_depth };
}

// Execute one canonical Markdown case against a selected parser dialect.
function executeMarkdownCase(fixture: MarkdownCase, ffm: boolean): void {
  const option = parserOption(fixture);
  if (fixture.error === 'invalid_nesting_depth') {
    expect(() => new MarkdownParser(option)).toThrow(RangeError);
    return;
  }

  const parser = ffm
    ? createFuyeorMarkdownParser(option)
    : createMarkdownParser(option);
  const ast = parser(fixture.input ?? '');
  if (fixture.html !== undefined) expect(render(ast).trim()).toBe(fixture.html);
  if (fixture.plain_text !== undefined)
    expect(toPlainText(ast)).toBe(fixture.plain_text);

  for (const assertion of fixture.assert ?? []) {
    const value = readJsonPointer(ast, assertion.path);
    if (assertion.length !== undefined) {
      expect(Array.isArray(value) ? value.length : undefined).toBe(
        assertion.length,
      );
      continue;
    }
    expect(value).toEqual(assertion.value);
  }

  if (fixture.no_throw) expect(ast).toEqual(expect.any(Array));
}

// Execute every case in one language-neutral fixture file.
function executeMarkdownSuite(
  name: string,
  fixtureFile: MarkdownFixtureFile,
  ffm: boolean,
): void {
  describe(name, () => {
    expect(fixtureFile.schema_version).toBe(2);
    for (const [index, fixture] of fixtureFile.cases.entries()) {
      it(String(index), () => executeMarkdownCase(fixture, ffm));
    }
  });
}

executeMarkdownSuite('cfm fixture', cfmFixture, false);
executeMarkdownSuite('ffm fixture', ffmFixture, true);

// Verify the public AST shape uses the modern scalar and structural field names.
describe('AST field names', () => {
  it('uses value, content, and header fields', () => {
    const ast = createMarkdownParser()('# Title\n\nhello');
    expect(ast).toEqual([
      {
        type: 'heading',
        level: 1,
        content: [{ type: 'text', value: 'Title' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', value: 'hello' }],
      },
    ]);

    const table = createMarkdownParser()('\n| A | B |\n|---|---|\n| C | D |');
    expect(table[0]).toMatchObject({
      type: 'table',
      header: [
        { type: 'table_cell', content: [{ type: 'text', value: 'A' }] },
        { type: 'table_cell', content: [{ type: 'text', value: 'B' }] },
      ],
      content: [
        {
          type: 'table_row',
          content: [
            { type: 'table_cell', content: [{ type: 'text', value: 'C' }] },
            { type: 'table_cell', content: [{ type: 'text', value: 'D' }] },
          ],
        },
      ],
    });
  });
});

describe('safety fixture', () => {
  expect(safetyFixtures.schema_version).toBe(1);
  for (const fixture of safetyFixtures.links)
    it(`link: ${fixture.input}`, () =>
      expect(isSafeLinkUrl(fixture.input)).toBe(fixture.valid));
  for (const fixture of safetyFixtures.colors)
    it(`color: ${fixture.input}`, () =>
      expect(isSafeColorValue(fixture.input)).toBe(fixture.valid));
});
