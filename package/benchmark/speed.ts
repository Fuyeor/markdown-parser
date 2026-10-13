// @ffm/benchmark/speed.ts
// pnpm -F @ffm/benchmark bench:speed
// @ts-nocheck
import { run, bench, group } from 'mitata';
import { createMarkdownParser, createCommonParser, render } from '@ffm/parser';
import MarkdownIt from 'markdown-it';
import { marked } from 'marked';
import { social, article } from './sample';

const ffm = createMarkdownParser();
const ffm2 = createCommonParser();
const mdIt = new MarkdownIt({ linkify: true });

const ffmIt = (content: string) => {
  const ast = ffm(content);
  return render(ast);
};

const ffmIt2 = (content: string) => {
  const ast = ffm2(content);
  return render(ast);
};

// Benchmarking Social scenario
group('50 Social Post (Small/Frequent)', () => {
  bench('@ffm/parser (AST, Full)', () => ffm(social));
  bench('@ffm/parser (AST, No Extension)', () => ffm2(social));
  bench('@ffm/parser (HTML, Full)', () => ffmIt(social));
  bench('@ffm/parser (HTML, No Extension)', () => ffmIt2(social));
  bench('markdown-it (HTML)', () => mdIt.render(social));
  bench('marked (HTML)', () => marked.parse(social));
});

// Benchmarking Blog scenario
group('20 Blog Post (Structured/Nested)', () => {
  bench('@ffm/parser (AST, No Extension)', () => ffm2(article));
  bench('@ffm/parser (AST, Full)', () => ffm(article));
  bench('@ffm/parser (HTML, No Extension)', () => ffmIt2(article));
  bench('@ffm/parser (HTML, Full)', () => ffmIt(article));
  bench('markdown-it (HTML)', () => mdIt.render(article));
  bench('marked (HTML)', () => marked.parse(article));
});

await run();
