// @ffm/parser/test/index.spec.ts
// pnpm -F @ffm/parser test
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, afterAll } from 'vitest';
import { createMarkdownParser } from '#/default';
import { render } from '#/core/render';

// commonMark: 0.13.2 edition
import commonMark from './spec/commonMark.json' with { type: 'json' };
// githubMark: 0.29 edition
import githubMark from './spec/githubMark.json' with { type: 'json' };

const parse = createMarkdownParser();
const failures: any[] = [];

/**
 * skip unimplemented test cases
 */
const shouldSkip = (item: any) => {
  const skipSections = [
    // 4-space indentation to code block
    'Indented code blocks',
    // setext
    'Setext headings',
    // don't parse HTML
    'HTML blocks',
    'Inline HTML',
    'Link reference definitions',
    // not implement this at the moment;
    // we will consider implementing it using the native API later
    'Entity and numeric character references',
    // unfriendly for Chinese and Japanese users `~~content~~`
    '[extension] Strikethrough',
    // will consider implementing this later
    '[extension] Task list items',
  ];

  if (
    // skip if the use case contains bold or italic text
    // as we do not implement a Latin-centric grammar.
    item.markdown.includes('_') ||
    // 4-space indentation to code block
    (item.markdown.startsWith('    ') && item.html.startsWith('<pre><code>')) ||
    // most users don't use the system's default email address
    // and don't want to trigger side effects after clicking
    item.html.includes('mailto:') ||
    // modern Web doesn't need to support it
    // also, it's for webmasters; regular users won't use it.
    item.html.includes('ftp:') ||
    // don't implement xmpp
    item.html.includes('xmpp:') ||
    // default skipped sections
    skipSections.includes(item.section)
  )
    return true;

  return false;
};

function assertMarkdown(
  section: string,
  markdown: string,
  expectedHtml: string,
) {
  const ast = parse(markdown);
  const resultHtml = render(ast).trim();
  const targetHtml = expectedHtml.trim();

  if (resultHtml !== targetHtml) {
    failures.push({
      section,
      source: markdown,
      // use equal-width words for easier comparison
      expect: targetHtml,
      actual: resultHtml,
    });

    expect(resultHtml).toBe(targetHtml);
  }
}

describe('markdown compatibility test', () => {
  describe('Common Mark', () => {
    const validSpecs = commonMark.filter((item: any) => !shouldSkip(item));

    validSpecs.forEach((caseItem: any) => {
      it(caseItem.markdown, () => {
        assertMarkdown(
          `Common Mark ${caseItem.section}`,
          caseItem.markdown,
          caseItem.html,
        );
      });
    });
  });

  describe('GitHub Mark', () => {
    const validSpecs = githubMark.filter((item: any) => !shouldSkip(item));

    validSpecs.forEach((caseItem: any) => {
      it(caseItem.markdown, () => {
        assertMarkdown(
          `GitHub Mark ${caseItem.section}`,
          caseItem.markdown,
          caseItem.html,
        );
      });
    });
  });

  // after test complete, write error details into JSON
  afterAll(() => {
    if (failures.length > 0) {
      writeFileSync(
        resolve(__dirname, './test.failed.json'),
        JSON.stringify(failures, null, 2),
        'utf-8',
      );
    }
  });
});
