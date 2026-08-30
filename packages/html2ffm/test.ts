// @fuyeor/html2ffm/src/test.ts
// npx tsx test.ts
import { toFFM } from './src/index';

// HTML snippet wanted to test
const inputHtml = `<p>Hello</p>`;

console.log('🟥 HTML');

// HTML snippet wanted to test
console.log(`
<p>Hello</p>
`);

console.log('🟪 Fuyeor Flavored Markdown\n');

console.log(`${toFFM(inputHtml)}\n`);
