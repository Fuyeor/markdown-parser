// src/index.spec.ts
import { describe, it, expect } from 'vitest';
import { linkify } from './index';

describe('linkify', () => {
  it('should match explicit http/https urls', () => {
    const text = 'Check out http://example.com and https://example.org/path';
    const matches = linkify(text);
    expect(matches).toHaveLength(2);
    expect(matches[0].url).toBe('http://example.com');
    expect(matches[1].url).toBe('https://example.org/path');
  });

  it('should match fuzzy domains with allowed TLDs', () => {
    const text = 'Visit example.com or my-site.net or foo.cn';
    const matches = linkify(text);
    expect(matches).toHaveLength(3);
    expect(matches[0].url).toBe('https://example.com');
    expect(matches[1].url).toBe('https://my-site.net');
    expect(matches[2].url).toBe('https://foo.cn');
  });

  it('should ignore fuzzy domains with unallowed TLDs', () => {
    // .md is excluded to prevent matching readme.md
    const text = 'Read the readme.md and script.js and style.css files.';
    const matches = linkify(text);
    expect(matches).toHaveLength(0);
  });

  it('should strip trailing punctuation', () => {
    const text = 'Go to example.com. Then example.org, and example.net! (example.io)';
    const matches = linkify(text);
    expect(matches[0].text).toBe('example.com');
    expect(matches[1].text).toBe('example.org');
    expect(matches[2].text).toBe('example.net');
    // Inside parens, the trailing paren is handled by bracket matching or punctuation logic
    expect(matches[3].text).toBe('example.io');
  });

  it('should handle balanced parentheses', () => {
    const text = 'A link with parens: https://en.wikipedia.org/wiki/Link_(disambiguation)';
    const matches = linkify(text);
    expect(matches[0].text).toBe('https://en.wikipedia.org/wiki/Link_(disambiguation)');
  });

  it('should strip unbalanced closing parentheses', () => {
    const text = 'Click here (https://example.com/page)';
    const matches = linkify(text);
    expect(matches[0].text).toBe('https://example.com/page');
  });

  it('should not match emails as links', () => {
    const text = 'Contact us at user@example.com';
    const matches = linkify(text);
    expect(matches).toHaveLength(0);
  });
});
