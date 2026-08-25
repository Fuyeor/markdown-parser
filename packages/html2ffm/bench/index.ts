// packages/html2ffm/bench/index.ts
import { toFFM } from '@fuyeor/html2ffm';

const ITERATIONS = 1_000;
const html = `
  <article>
    <h1>Benchmark article</h1>
    <p><strong>Fuyeor</strong> converts <span style="color:red;font-size:20px">HTML</span> into FFM.</p>
    <blockquote><p>One</p><p>Two</p><p>Three</p></blockquote>
    <ul><li>First<ul><li>Nested</li></ul></li><li>Second</li></ul>
    <table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>A</td><td>1</td></tr></tbody></table>
  </article>
`;

// Measure steady-state conversion throughput and the process RSS delta for a repeatable local benchmark.
const initialRss = process.memoryUsage().rss;
const startedAt = process.hrtime.bigint();
let output = '';
for (let iteration = 0; iteration < ITERATIONS; iteration++) {
  output = toFFM(html);
}
const elapsedMilliseconds =
  Number(process.hrtime.bigint() - startedAt) / 1_000_000;
const finalRss = process.memoryUsage().rss;
const throughput = ITERATIONS / (elapsedMilliseconds / 1_000);

console.log(`iterations: ${ITERATIONS}`);
console.log(`elapsed_ms: ${elapsedMilliseconds.toFixed(2)}`);
console.log(`throughput_per_second: ${throughput.toFixed(2)}`);
console.log(`rss_delta_bytes: ${finalRss - initialRss}`);
console.log(`output_bytes: ${Buffer.byteLength(output, 'utf8')}`);
