// @fuyeor/markdown-formatter/src/index.spec.ts
import { describe, expect, it } from 'vitest';
import { format } from './index';

describe('format', () => {
  it('adds spaces between CJK text and Latin letters or numbers', () => {
    expect(format('这是10个XX')).toBe('这是 10 个 XX');
  });

  it('removes trailing spaces before a line break', () => {
    expect(format('句末。  \n下一句')).toBe('句末。\n下一句');
  });

  it('trims leading and trailing whitespace from the document', () => {
    expect(format(' \n\n  第一行\n第二行  \n\n')).toBe('第一行\n第二行');
  });

  it('normalizes list indentation and marker spacing', () => {
    expect(format('    -   第一项\n      - 第二项')).toBe(
      '  - 第一项\n  - 第二项',
    );
  });

  it('normalizes table padding and delimiter hyphens', () => {
    expect(
      format(
        '|  表头一  | 表头二 |\n| :------- | -------: |\n|  内容一 | 内容二  |',
      ),
    ).toBe('| 表头一 | 表头二 |\n| :--- | ---: |\n| 内容一 | 内容二 |');
  });

  it('converts a contiguous block with at least three quote markers', () => {
    expect(format('>>> 第一行\n>>> 第二行\n\n后续内容')).toBe(
      '```quote\n第一行\n第二行\n```\n\n后续内容',
    );
  });

  it('formats semantic FFM fences without changing their delimiters', () => {
    expect(format('```quote\n这是10个XX。  \n```')).toBe(
      '```quote\n这是 10 个 XX。\n```',
    );
    expect(format('```chain\n**第一步**\n```')).toBe(
      '```chain\n**第一步**\n```',
    );
  });

  it('does not alter fenced code content', () => {
    const source = '```ffm\n这是10个XX。  \n    -   code\n```';
    expect(format(source)).toBe(source);
  });

  it('does not alter inline code or math expressions', () => {
    expect(format('文本 `这是10个XX` 与 $10个XX$')).toBe(
      '文本 `这是10个XX` 与 $10个XX$',
    );
  });

  it('fails fast for non-string input', () => {
    expect(() => format(null as unknown as string)).toThrow(TypeError);
  });
});
