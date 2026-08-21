// packages/linkify/benchmark.js
import { statSync } from 'node:fs';

const { linkify } = await import('./dist/index.js');

const text = `
Here is a test with multiple links.
Visit http://example.com or https://example.org.
Some fuzzy links: google.com, my-site.net, and bbc.co.uk.
Also check out invalid links like readme.md or script.js.
Links with punctuation: https://example.com/path., (https://example.org)!
`.repeat(1000);

const warmupIterations = 10;
const measurementIterations = 30;

for (let i = 0; i < warmupIterations; i++) linkify(text);

const samples = [];
let matchCount = 0;
for (let i = 0; i < measurementIterations; i++) {
  const start = process.hrtime.bigint();
  matchCount = linkify(text).length;
  const elapsed = process.hrtime.bigint() - start;
  samples.push(Number(elapsed) / 1e6);
}

samples.sort((a, b) => a - b);
const sum = samples.reduce((total, sample) => total + sample, 0);
const percentile = (value) =>
  samples[Math.min(samples.length - 1, Math.floor(samples.length * value))];

console.log(
  JSON.stringify({
    inputBytes: Buffer.byteLength(text),
    matchCount,
    iterations: measurementIterations,
    minMs: Number(samples[0].toFixed(3)),
    medianMs: Number(percentile(0.5).toFixed(3)),
    p95Ms: Number(percentile(0.95).toFixed(3)),
    averageMs: Number((sum / samples.length).toFixed(3)),
    distBytes: statSync(new URL('./dist/index.js', import.meta.url)).size,
    declarationBytes: statSync(new URL('./dist/index.d.ts', import.meta.url)).size,
  }),
);
