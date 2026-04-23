// @fuyeor/markdown-parser-benchmark/speed.ts
// pnpm -F @fuyeor/markdown-parser-benchmark bench:speed
// @ts-nocheck
import { run, bench, group } from 'mitata';
import { createFuyeorMarkdownParser, render } from '@fuyeor/markdown-parser';
import MarkdownIt from 'markdown-it';
import { marked } from 'marked';
import { socialSample, blogSample } from './samples';

const ffm = createFuyeorMarkdownParser();
const mdIt = new MarkdownIt({ linkify: true });

const ffmIt = (content: string) => {
  const ast = ffm(content);
  return render(ast);
};

// Benchmarking Social scenario
group('50 Social Posts (Small/Frequent)', () => {
  bench('@fuyeor/markdown-parser (AST)', () => ffm(socialSample));
  bench('@fuyeor/markdown-parser (HTML)', () => ffmIt(socialSample));
  bench('markdown-it (HTML)', () => mdIt.render(socialSample));
  bench('marked (HTML)', () => marked.parse(socialSample));
});

// Benchmarking Blog scenario
group('20 Blog Posts (Structured/Nested)', () => {
  bench('@fuyeor/markdown-parser (AST)', () => ffm(blogSample));
  bench('@fuyeor/markdown-parser (HTML)', () => ffmIt(blogSample));
  bench('markdown-it (HTML)', () => mdIt.render(blogSample));
  bench('marked (HTML)', () => marked.parse(blogSample));
});

await run();
