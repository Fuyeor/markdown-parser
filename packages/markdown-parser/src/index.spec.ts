// @fuyeor/markdown-parser/src/index.spec.ts
import { describe, it, expect } from 'vitest';
import { MarkdownParser } from './core/parser';
import { createFuyeorMarkdownParser } from './default';
import { render } from './core/render';
import { latexPlugin } from './plugins/latex';
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

  it('uses linkify for internationalized fuzzy domains', () => {
    const ast = createFuyeorMarkdownParser()('Visit fuyeor.xn--p1ai');
    const link = ast[0].children?.find((node) => node.type === 'link');

    expect(link).toMatchObject({
      url: 'https://fuyeor.рф',
      children: [{ type: 'text', content: 'fuyeor.рф' }],
    });
  });

  it('registers LaTeX as an explicit parser plugin', () => {
    const latexParse = new MarkdownParser().use(latexPlugin).build();
    const ast = latexParse('The formula is $x^2$.');

    expect(ast[0].children).toEqual([
      { type: 'text', content: 'The formula is ' },
      { type: 'math_inline', content: 'x^2' },
      { type: 'text', content: '.' },
    ]);
  });

  it('renders inline and multiline block LaTeX through the FFM parser', () => {
    const ast = createFuyeorMarkdownParser()(
      'Inline $x^2$ formula.\n\n$$\nx^2 + y^2\n$$',
    );

    expect(ast.map((node) => node.type)).toEqual(['paragraph', 'math_block']);
    expect(render(ast))
      .toBe(`<p>Inline <span class="math-inline">x^2</span> formula.</p>
<div class="math-block">x^2 + y^2</div>
`);
  });

  it('escapes LaTeX placeholders and leaves unmatched delimiters as text', () => {
    const ast = createFuyeorMarkdownParser()(
      '$<script>alert(1)</script>$ and $unfinished',
    );

    expect(render(ast)).toBe(
      '<p><span class="math-inline">&lt;script&gt;alert(1)&lt;/script&gt;</span> and $unfinished</p>\n',
    );
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

  it('renders aligned headed tables', () => {
    const ast = createFuyeorMarkdownParser()(
      '| 属性 | 类型 | 说明 |\n| :--- | :---: | ---: |\n| name | string | 用户名 |',
    );

    expect(render(ast)).toBe(`<table>
<thead>
<tr>
<th align="left">属性</th>
<th align="center">类型</th>
<th align="right">说明</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">name</td>
<td align="center">string</td>
<td align="right">用户名</td>
</tr>
</tbody>
</table>
`);
  });

  it('renders separator-first tables without a header', () => {
    const ast = createFuyeorMarkdownParser()(
      '| :--- | ---: |\n| Ray ID | a2c5ac427b7aa727 |\n| IP 地址 | 172.214.47.18 |',
    );
    const tableNode = ast.find((node) => node.type === 'table');

    expect(tableNode?.headers).toBeUndefined();
    expect(tableNode?.children).toHaveLength(2);
    expect(render(ast)).toBe(`<table>
<tbody>
<tr>
<td align="left">Ray ID</td>
<td align="right">a2c5ac427b7aa727</td>
</tr>
<tr>
<td align="left">IP 地址</td>
<td align="right">172.214.47.18</td>
</tr>
</tbody>
</table>
`);
  });

  it('rejects unsafe link schemes', () => {
    const ast = parse('[click](javascript:alert(1))');

    expect(ast[0].children?.some((node) => node.type === 'link')).toBe(false);
  });

  it('bounds recursive block parsing', () => {
    const boundedParse = createFuyeorMarkdownParser({ maxNestingDepth: 8 });

    expect(() => boundedParse(`${'>'.repeat(100)} value`)).not.toThrow();
  });

  it('fails fast for an invalid nesting depth', () => {
    expect(() => new MarkdownParser({ maxNestingDepth: 0 })).toThrow(
      RangeError,
    );
  });

  it.each([
    ['modern two-space indentation', '  - example'],
    ['legacy three-space marker alignment', '   - example'],
  ])('recognizes %s as a nested list', (_description, childLine) => {
    const ast = createFuyeorMarkdownParser()(`1. example\n${childLine}`);
    const rootList = ast[0];

    expect(rootList.type).toBe('list');
    expect(rootList.children).toHaveLength(1);
    expect(
      rootList.children?.[0].children?.some((node) => node.type === 'list'),
    ).toBe(true);
  });

  it('uses two-space steps for deeper list nesting', () => {
    const ast = createFuyeorMarkdownParser()(
      '1. root\n   - level 1\n    - level 2',
    );
    const rootItem = ast[0].children?.[0];
    const levelOneList = rootItem?.children?.find(
      (node) => node.type === 'list',
    );
    const levelOneItem = levelOneList?.children?.[0];
    const levelTwoList = levelOneItem?.children?.find(
      (node) => node.type === 'list',
    );

    expect(levelOneList).toBeDefined();
    expect(levelTwoList).toBeDefined();
  });
});
