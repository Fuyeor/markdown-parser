// @fuyeor/markdown-parser-benchmark/speed.ts
// pnpm -F @fuyeor/markdown-parser-benchmark bench:speed
// @ts-nocheck
import { run, bench, group } from 'mitata';
import { createFuyeorMarkdownParser, render } from '@fuyeor/markdown-parser';
import MarkdownIt from 'markdown-it';
import { marked } from 'marked';
import { socialSample, blogSample } from './samples';

const ffm = createFuyeorMarkdownParser();
const mdIt = new MarkdownIt();

const ffmIt = (content: string) => {
  const ast = ffm(content);
  return render(ast);
};

// Benchmarking Social scenario
group('50 Social Posts (Small/Frequent)', () => {
  bench('@fuyeor/markdown-parser', () => ffmIt(socialSample));
  bench('markdown-it', () => mdIt.render(socialSample));
  bench('marked', () => marked.parse(socialSample));
});

// Benchmarking Blog scenario
group('20 Blog Posts (Structured/Nested)', () => {
  bench('@fuyeor/markdown-parser', () => ffmIt(blogSample));
  bench('markdown-it', () => mdIt.render(blogSample));
  bench('marked', () => marked.parse(blogSample));
});

await run();
