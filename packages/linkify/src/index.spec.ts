// src/index.spec.ts
import { describe, expect, it } from 'vitest';
import cases from './linkify-cases.json';
import { linkify } from './index';

type LinkifyCase = {
  text: string;
  expect: string;
  section: string;
};

// Execute every fixture against the public linkify API.
describe('linkify JSON cases', () => {
  for (const testCase of cases as LinkifyCase[]) {
    it(`[${testCase.section}] ${testCase.text}`, () => {
      const matches = linkify(testCase.text);
      const actual = matches.map((match) => match.text).join('');
      expect(actual).toBe(testCase.expect);
    });
  }
});
