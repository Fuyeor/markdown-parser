// @fuyeor/markdown-parser/src/index.spec.ts
import { describe, it, expect } from 'vitest';
import { MarkdownParser } from './core/parser';
import { headingRule, codeBlockRule, tableRule } from './rules/blocks';
import { boldRule, linkRule } from './rules/inlines';

// build parser
const parse = new MarkdownParser()
  .addBlockRule(tableRule)
  .addBlockRule(codeBlockRule)
  .addBlockRule(headingRule)
  .addInlineRule(boldRule)
  .addInlineRule(linkRule)
  .build();

describe('test @fuyeor/markdown-parser', () => {
  it('parse and filter malicious code', () => {
    const ast = parse('text <script>alert(1)</script>');

    expect(ast[0].type).toBe('paragraph');
    expect(ast[0].children![0].content).toBe('text <script>alert(1)</script>');
  });

  it('parse ATX headings and internal bolding', () => {
    const ast = parse('## Hello **World**');

    expect(ast[0].type).toBe('heading');
    expect(ast[0].level).toBe(2);
    expect(ast[0].children![0].type).toBe('text');
    expect(ast[0].children![0].content).toBe('Hello ');
    expect(ast[0].children![1].type).toBe('bold');
  });

  it('parse fenced code block', () => {
    const content = '```ts\nconst a = 1;\n```';
    const ast = parse(content);

    expect(ast[0].type).toBe('code_block');
    expect(ast[0].lang).toBe('ts');
    expect(ast[0].content).toBe('const a = 1;');
  });

  it('parse standard links', () => {
    const ast = parse(
      'visit www.fuyeor.com or [click here](https://fuyeor.com)',
    );
    const children = ast[0].children!;

    // automatic completion protocol
    expect(children[1].type).toBe('link');
    expect(children[1].url).toBe('https://www.fuyeor.com');

    // generate standard link
    expect(children[3].type).toBe('link');
    expect(children[3].url).toBe('https://fuyeor.com');
  });

  it('parse table', () => {
    const content = `
| title 1 | title 2 |
|---|---|
| content 1 | content 2 |
`;
    const ast = parse(content);
    const tableNode = ast.find((n) => n.type === 'table')!;

    expect(tableNode).toBeDefined();
    expect(tableNode.headers).toHaveLength(2);
    expect(tableNode.children![0].type).toBe('table_row');
  });
});
