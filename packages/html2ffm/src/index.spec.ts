// packages/html2ffm/src/index.spec.ts
import { describe, expect, it } from 'vitest';
import fixtureData from './fixtures/conversions.json';
import { toFFM } from './index';

type ConversionFixture = {
  section: string;
  text: string;
  expect: string;
};

const fixtures = fixtureData as ConversionFixture[];

describe('toFFM fixtures', () => {
  for (const fixture of fixtures) {
    it(fixture.section, () => {
      expect(toFFM(fixture.text)).toBe(fixture.expect);
    });
  }
});

describe('toFFM edge cases', () => {
  it('normalizes RGB and HSL colors, including alpha', () => {
    expect(toFFM('<span style="color:rgb(100% 0% 0% / 50%)">RGB</span>')).toBe(
      '[RGB](color = #ff000080)',
    );
    expect(toFFM('<span style="color:hsl(0 100% 50%)">HSL</span>')).toBe(
      '[HSL](color = #ff0000)',
    );
    expect(toFFM('<span style="color:#abcd">Short</span>')).toBe(
      '[Short](color = #aabbccdd)',
    );
  });

  it('applies the last valid declaration and suppresses transparent color', () => {
    expect(toFFM('<span style="color:red;color:not-a-color">Keep</span>')).toBe(
      '[Keep](color = #ff0000)',
    );
    expect(
      toFFM('<span style="color:red;color:transparent">Clear</span>'),
    ).toBe('Clear');
    expect(
      toFFM(
        '<span style="color:red"><span style="color:rgba(0,0,0,0)">Child</span></span>',
      ),
    ).toBe('Child');
  });

  it('inherits and overrides inline styles through nested elements', () => {
    expect(
      toFFM(
        '<span style="color:red;font-size:20px">A <b>B</b> <span style="color:blue">C</span></span>',
      ),
    ).toBe(
      '[A **B** ](color = #ff0000, font = {size = 20px})[C](color = #0000ff, font = {size = 20px})',
    );
  });

  it('drops indentation-only whitespace while retaining inline spaces', () => {
    expect(toFFM(`\n  <p>First <b>item</b></p>\n  <p>Second</p>\n`)).toBe(
      'First **item**\n\nSecond',
    );
  });

  it('keeps inline labels from adding line breaks and parses case-insensitively', () => {
    expect(toFFM('<P><SPAN STYLE="COLOR:RED">Text</SPAN></P>')).toBe(
      '[Text](color = #ff0000)',
    );
  });

  it('preserves list and quote block structure', () => {
    expect(
      toFFM('<ul><li>One<ol><li>Nested</li></ol></li><li>Two</li></ul>'),
    ).toBe('- One\n  1. Nested\n- Two');
    expect(toFFM('<blockquote><p>One</p><p>Two</p></blockquote>')).toBe(
      '> One\n> Two',
    );
  });

  it('uses th rows as headers without requiring thead', () => {
    expect(
      toFFM(
        '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>',
      ),
    ).toBe('| A | B |\n| --- | --- |\n| 1 | 2 |');
  });

  it('does not render dangerous URLs or content elements', () => {
    expect(
      toFFM(
        '<a href="data:text/plain,unsafe">Text</a><svg><b>Hidden</b></svg>',
      ),
    ).toBe('Text');
  });

  it('preserves code text and ignores inline markup inside pre', () => {
    expect(toFFM('<pre><b>&lt;literal&gt;</b>\nvalue</pre>')).toBe(
      '```\n<literal>\nvalue\n```',
    );
  });

  it('accepts incomplete HTML fragments', () => {
    expect(toFFM('<p><b>Unclosed')).toBe('**Unclosed**');
  });
});

describe('toFFM input validation', () => {
  it('fails fast for non-string input', () => {
    expect(() => toFFM(null as unknown as string)).toThrow(
      new TypeError('Input must be a string'),
    );
  });

  it('accepts an empty fragment', () => {
    expect(toFFM('')).toBe('');
  });
});
