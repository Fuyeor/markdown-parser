// @ffm/benchmark/memory.ts
// pnpm -F @ffm/benchmark bench:memory
// @ts-nocheck
import { createFuyeorMarkdownParser, render } from '@ffm/parser';
import MarkdownIt from 'markdown-it';
import { marked } from 'marked';
import { social, article } from './samples';

// Polyfill for window if needed by some specific logic
if (typeof window === 'undefined') global.window = globalThis;

const ffm = createFuyeorMarkdownParser();
const mdIt = new MarkdownIt({ linkify: true });

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

  // @ffm/parser
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

  console.log(`[@ffm/parser] Impact: ${ffmImpact.toFixed(2)} MB`);
  console.log(`[markdown-it] Impact: ${mdImpact.toFixed(2)} MB`);
  console.log(`[marked] Impact: ${mkImpact.toFixed(2)} MB`);

  const ratio = (mdImpact / (ffmImpact || 0.01)).toFixed(2);
  console.log(`📊 markdown-it relative to @ffm/parser: ${ratio}x`);

  const mkRatio = (mkImpact / (ffmImpact || 0.01)).toFixed(2);
  console.log(`📊 marked relative to @ffm/parser: ${mkRatio}x`);
}

const runTests = async () => {
  console.log('🚀 Starting Memory Benchmark...');
  await measure('Social', social);
  await measure('Blog', article);
};

runTests();
