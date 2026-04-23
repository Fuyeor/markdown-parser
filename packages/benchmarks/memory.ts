// @fuyeor/markdown-parser-benchmark/memory.ts
// pnpm -F @fuyeor/markdown-parser-benchmark bench:memory
// @ts-nocheck
import { createFuyeorMarkdownParser, render } from '@fuyeor/markdown-parser';
import MarkdownIt from 'markdown-it';
import { marked } from 'marked';
import { socialSample, blogSample } from './samples';

// Polyfill for window if needed by some specific logic
if (typeof window === 'undefined') global.window = globalThis;

const ffm = createFuyeorMarkdownParser();
const mdIt = new MarkdownIt();

const ffmIt = (content: string) => {
  const ast = ffm(content);
  return render(ast);
};

/**
 * Memory Measurement Assistant
 * Returns currently used heap memory (MB)
 */
const getMemory = () => {
  // Force GC if available (run with --expose-gc)
  global.gc();
  return process.memoryUsage().heapUsed / 1024 / 1024;
};

async function measure(name: string, content: string) {
  console.log(
    `\n--- Test Scenario: ${name} (${(content.length / 1024).toFixed(1)} KB) ---`,
  );

  // @fuyeor/markdown-parser
  const ffmStart = getMemory();
  let ffmResult = ffmIt(content);
  const ffmEnd = getMemory();
  const ffmImpact = Math.max(0, ffmEnd - ffmStart);

  // Clear and GC
  ffmResult = null;
  global.gc();

  // markdown-it
  const mdStart = getMemory();
  let mdResult = mdIt.render(content);
  const mdEnd = getMemory();
  const mdImpact = Math.max(0, mdEnd - mdStart);

  // marked
  const mkStart = getMemory();
  let mkResult = marked.parse(content);
  const mkEnd = getMemory();
  const mkImpact = Math.max(0, mkEnd - mkStart);

  console.log(`[@fuyeor/markdown-parser] Impact: ${ffmImpact.toFixed(2)} MB`);
  console.log(`[markdown-it] Impact: ${mdImpact.toFixed(2)} MB`);
  console.log(`[marked] Impact: ${mkImpact.toFixed(2)} MB`);

  const ratio = (mdImpact / (ffmImpact || 0.01)).toFixed(2);
  console.log(`📊 markdown-it relative to @fuyeor/markdown-parser: ${ratio}x`);

  const mkRatio = (mkImpact / (ffmImpact || 0.01)).toFixed(2);
  console.log(`📊 marked relative to @fuyeor/markdown-parser: ${mkRatio}x`);
}

const runTests = async () => {
  console.log('🚀 Starting Memory Benchmark...');
  await measure('Social', socialSample);
  await measure('Blog', blogSample);
};

runTests();
