// src/index.spec.ts
import { describe, expect, it } from 'vitest';
import cases from './cases.json';
import { linkify } from './index';

type LinkifyCase = {
  text: string;
  expect: string;
};

type LinkifyCases = Record<string, LinkifyCase[]>;

// Execute every sectioned fixture against the public linkify API.
describe('linkify JSON cases', () => {
  for (const [section, sectionCases] of Object.entries(cases as LinkifyCases)) {
    describe(section, () => {
      for (const testCase of sectionCases) {
        it(testCase.text, () => {
          const actual = linkify(testCase.text).map((match) => match.text);
          const expected = testCase.expect ? [testCase.expect] : [];
          expect(actual).toEqual(expected);
        });
      }
    });
  }
});
