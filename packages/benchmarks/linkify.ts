// @fuyeor/markdown-parser-benchmark/linkify.ts
import { readFileSync } from 'node:fs';
import { bench, group, run } from 'mitata';
import { linkify } from '@fuyeor/linkify';
import { LinkifyIt } from 'linkify-it';

type PositiveFixture = {
  line: number;
  text: string;
  expected: string;
};

type FixtureFailure = {
  line: number;
  text: string;
  expected?: string;
  actual: string[];
};

type FixtureChecks = {
  total: number;
  passed: number;
  failures: FixtureFailure[];
};

type FixtureReport = {
  positive: FixtureChecks;
  negative: FixtureChecks;
};

const linksFixture = readFileSync(
  new URL('./fixtures/linkify-it/links.txt', import.meta.url),
  'utf8',
);
const notLinksFixture = readFileSync(
  new URL('./fixtures/linkify-it/not_links.txt', import.meta.url),
  'utf8',
);
const linkifyIt = new LinkifyIt({ fuzzyLink: true, fuzzyIP: true, urlAuth: true });
linkifyIt.normalize = () => {};

// Parse linkify-it's alternating input/expected-output fixture format.
function parsePositiveFixtures(source: string): PositiveFixture[] {
  const lines = source.split(/\r?\n/g);
  const fixtures: PositiveFixture[] = [];

  for (let index = 0; index < lines.length; index++) {
    const text = lines[index].replace(/^%.*/, '');
    const next = (lines[index + 1] ?? '').replace(/^%.*/, '');
    if (!text.trim()) continue;

    if (next.trim()) {
      fixtures.push({ line: index + 1, text, expected: next });
      index++;
    } else {
      fixtures.push({ line: index + 1, text, expected: text });
    }
  }

  return fixtures;
}

// Convert a fixture file into the exact text corpus used by both benchmarks.
function fixtureCorpus(source: string): string {
  return source
    .split(/\r?\n/g)
    .filter((line) => !line.startsWith('%'))
    .join('\n');
}

// Check one implementation against a list of positive fixtures.
function evaluatePositiveFixtures(
  fixtures: PositiveFixture[],
  matcher: (text: string) => string[],
): FixtureChecks {
  const failures: FixtureFailure[] = [];
  let passed = 0;

  for (const fixture of fixtures) {
    const actual = matcher(fixture.text);
    if (actual.includes(fixture.expected)) {
      passed++;
    } else {
      failures.push({
        line: fixture.line,
        text: fixture.text,
        expected: fixture.expected,
        actual,
      });
    }
  }

  return { total: fixtures.length, passed, failures };
}

// Check one implementation against the official negative fixtures.
function evaluateNegativeFixtures(
  source: string,
  matcher: (text: string) => string[],
): FixtureChecks {
  const failures: FixtureFailure[] = [];
  let total = 0;
  let passed = 0;

  for (const [index, sourceLine] of source.split(/\r?\n/g).entries()) {
    if (!sourceLine.trim() || sourceLine.startsWith('%')) continue;
    total++;
    const text = sourceLine.replace(/^%.*/, '');
    const actual = matcher(text);
    if (actual.length === 0) {
      passed++;
    } else {
      failures.push({ line: index + 1, text, actual });
    }
  }

  return { total, passed, failures };
}

// Evaluate both official fixture files without requiring behavioral parity.
function evaluateFixtures(matcher: (text: string) => string[]): FixtureReport {
  return {
    positive: evaluatePositiveFixtures(parsePositiveFixtures(linksFixture), matcher),
    negative: evaluateNegativeFixtures(notLinksFixture, matcher),
  };
}

// Keep console output useful without dumping the entire fixture diff.
function summarizeReport(report: FixtureReport) {
  return {
    positive: {
      total: report.positive.total,
      passed: report.positive.passed,
      failed: report.positive.total - report.positive.passed,
      examples: report.positive.failures.slice(0, 8),
    },
    negative: {
      total: report.negative.total,
      passed: report.negative.passed,
      failed: report.negative.total - report.negative.passed,
      examples: report.negative.failures.slice(0, 8),
    },
  };
}

const positiveFixtures = parsePositiveFixtures(linksFixture);
const fixtureText = `${fixtureCorpus(linksFixture)}\n${fixtureCorpus(notLinksFixture)}`;
const syntheticText = `
Here is a test with multiple links.
Visit http://example.com or https://example.org.
Some fuzzy links: google.com, my-site.net, and bbc.co.uk.
Also check out invalid links like readme.md or script.js.
Links with punctuation: https://example.com/path., (https://example.org)!
`.repeat(1000);

console.log(
  JSON.stringify(
    {
      fixtureSource: 'markdown-it/linkify-it/test/fixtures',
      positiveCases: positiveFixtures.length,
      negativeCases: evaluateNegativeFixtures(notLinksFixture, () => []).total,
      corpusBytes: Buffer.byteLength(fixtureText),
      '@fuyeor/linkify': summarizeReport(
        evaluateFixtures((text) => linkify(text).map((match) => match.text)),
      ),
      'linkify-it': summarizeReport(
        evaluateFixtures(
          (text) => linkifyIt.match(text)?.map((match) => match.url) ?? [],
        ),
      ),
    },
    null,
    2,
  ),
);

group('Synthetic corpus (276 KB)', () => {
  bench('@fuyeor/linkify', () => {
    linkify(syntheticText);
  });

  bench('linkify-it', () => {
    linkifyIt.match(syntheticText);
  });
});

group('Official linkify-it fixtures', () => {
  bench('@fuyeor/linkify', () => {
    linkify(fixtureText);
  });

  bench('linkify-it', () => {
    linkifyIt.match(fixtureText);
  });
});

await run();
