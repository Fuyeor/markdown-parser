const { linkify } = require('./dist/index.js');
const fs = require('fs');

const text = `
Here is a test with multiple links.
Visit http://example.com or https://example.org.
Some fuzzy links: google.com, my-site.net, and bbc.co.uk.
Also check out invalid links like readme.md or script.js.
Links with punctuation: https://example.com/path., (https://example.org)!
`.repeat(1000); // make it long enough

const start = performance.now();
const matches = linkify(text);
const end = performance.now();

console.log(`Matched ${matches.length} links in ${(end - start).toFixed(2)} ms.`);
