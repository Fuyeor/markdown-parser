// @ffm/converter/src/test.ts
// npx tsx test.ts
import { fromHTML } from './src/index.node';

// HTML snippet wanted to test
const inputHtml = `
<p>Hello</p>
`;

console.log('🟥 HTML');

// HTML snippet wanted to test
console.log(inputHtml);

console.log('🟪 Fuyeor Flavored Markdown\n');

console.log(`${fromHTML(inputHtml, { maxConsecutiveBlankLines: 4 })}\n`);
