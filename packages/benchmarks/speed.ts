// @fuyeor/markdown-parser-benchmark/speed.ts
// pnpm -F @fuyeor/markdown-parser-benchmark bench:speed
import { run, bench, group } from 'mitata';
import { createFuyeorMarkdownParser } from '@fuyeor/markdown-parser';
// @ts-ignore
import MarkdownIt from 'markdown-it';

const ffm = createFuyeorMarkdownParser();
const md = new MarkdownIt();

const content = `
# Heading
This is a paragraph with **bold** and *italic* text.
- List item 1
- List item 2
> Quote block
[Link](https://fuyeor.com)
\`\`\`code
console.log('test');
\`\`\`
`.repeat(100);

group('Rendering speed comparison', () => {
  bench('@fuyeor/markdown-parser', () => ffm(content));
  bench('markdown-it', () => md.render(content));
});

await run();
