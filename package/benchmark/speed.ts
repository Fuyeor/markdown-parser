// @ffm/benchmark/speed.ts
// pnpm -F @ffm/benchmark bench:speed
// @ts-nocheck
import { run, bench, group } from 'mitata';
import { createFuyeorMarkdownParser, render } from '@ffm/parser';
import MarkdownIt from 'markdown-it';
import { marked } from 'marked';
import { social, article } from './samples';

const ffm = createFuyeorMarkdownParser();
const mdIt = new MarkdownIt({ linkify: true });

const ffmIt = (content: string) => {
  const ast = ffm(content);
  return render(ast);
};

// Benchmarking Social scenario
group('50 Social Post (Small/Frequent)', () => {
  bench('@ffm/parser (AST)', () => ffm(social));
  bench('@ffm/parser (HTML)', () => ffmIt(social));
  bench('markdown-it (HTML)', () => mdIt.render(social));
  bench('marked (HTML)', () => marked.parse(social));
});

// Benchmarking Blog scenario
group('20 Blog Post (Structured/Nested)', () => {
  bench('@ffm/parser (AST)', () => ffm(article));
  bench('@ffm/parser (HTML)', () => ffmIt(article));
  bench('markdown-it (HTML)', () => mdIt.render(article));
  bench('marked (HTML)', () => marked.parse(article));
});

await run();
