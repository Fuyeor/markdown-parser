// @fuyeor/markdown-parser-bench/memory.ts
// pnpm -F @fuyeor/markdown-parser-benchmark bench:memory
import { createFuyeorMarkdownParser } from '@fuyeor/markdown-parser';
// @ts-ignore
import MarkdownIt from 'markdown-it';

if (typeof window === 'undefined') (global as any).window = globalThis;

/**
 * Memory Measurement Assistant
 * Returns currently used heap memory (MB)
 */
const getMemory = () => {
  if (global.gc) global.gc();
  return process.memoryUsage().heapUsed / 1024 / 1024;
};

const ffm = createFuyeorMarkdownParser();
const md = new MarkdownIt();

const hugeContent = (
  '# Memory Test\n' +
  '- Item **Bold** [Link](https://fuyeor.com)\n' +
  '```ts\nconst a = 1;\n```\n' +
  '| a | b | c |\n|---|---|---|\n| 1 | 2 | 3 |\n'
).repeat(20000);

async function runMemoryTest() {
  // @fuyeor/markdown-parser
  const ffmStart = getMemory();
  let ffmResult: any = ffm(hugeContent);
  const ffmEnd = getMemory();
  const ffmImpact = ffmEnd - ffmStart;
  console.log(
    `[@fuyeor/markdown-parser] Peak Impact: ${ffmImpact.toFixed(2)} MB`,
  );

  // clear memory
  ffmResult = null;
  if (global.gc) global.gc();

  // markdown-it
  const mdStart = getMemory();
  const mdResult = md.render(hugeContent);
  const mdEnd = getMemory();
  const mdImpact = mdEnd - mdStart;
  console.log(`[markdown-it] Peak Impact: ${mdImpact.toFixed(2)} MB`);

  console.log('\n📊 Conclusion:');
  const ratio = (mdImpact / ffmImpact).toFixed(1);
  console.log(
    `@fuyeor/markdown-parser uses ${ratio}x memory compared to markdown-it.`,
  );
}

runMemoryTest();
