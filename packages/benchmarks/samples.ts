// @fuyeor/markdown-parser-benchmark/samples.ts

/**
 * Social Media Scenario
 * Focus: Short, heavy formatting (bold, italic), many links, and mentions.
 */
export const socialSample = `
I'm currently focused on refining the benchmarking process for **@fuyeor/markdown-parser**.

I've initiated *memory* and *speed tests*, using files like \`@fuyeor/markdown-parser-benchmark/memory.ts\` and \`@fuyeor/markdown-parser-benchmark/speed.ts\`.

Further, I'm working to __create content scenarios__ like [social](https://fuyeor.com).

#Farkdown #Tech #Social @Fuyeor 🚀
`.repeat(50); // Simulating a long feed

/**
 * Blog Post Scenario
 * Focus: Structured headers, nested lists, code blocks, and tables.
 */
export const blogSample = `
### The \`translate\` attribute [link](https://html.spec.whatwg.org/multipage/dom.html#the-translate-attribute)

> The **\`translate\` attribute** is used to specify whether an element's attribute values and the text content of its \`Text\` node children should be translated when the page is localized, or left unchanged. It is an **[enumerated attribute](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#enumerated-attribute)** with the following keywords and states:

| Keyword | State | Brief description |
|---------|-------|-------------------|
| \`yes\`   | Yes   | Sets translation mode to **translate-enabled**. |
| \`no\`    | No    | Sets translation mode to **no-translate**. |

**Default behaviors**  
- The attribute's *missing value default* and *invalid value default* are both the **Inherit** state.  
- Its *empty value default* is the **Yes** state.

#### Translatable attributes

> The following attributes are defined as **translatable attributes**:

- \`abbr\` on \`th\` elements
- \`alt\` on \`area\`, \`img\`, and \`input\` elements
- \`content\` on \`meta\` elements, if the \`name\` attribute specifies a metadata name whose value is known to be translatable
- \`download\` on \`a\` and \`area\` elements
- \`label\` on \`optgroup\`, \`option\`, and \`track\` elements
- \`lang\` on HTML elements (must be "translated" to match the language used in the translation)
- \`placeholder\` on \`input\` and \`textarea\` elements
- \`srcdoc\` on \`iframe\` elements (must be parsed and recursively processed)
- \`style\` on HTML elements (must be parsed and recursively processed, e.g., for the values of \`'content'\` properties)
- \`title\` on all HTML elements
- \`value\` on \`input\` elements with a \`type\` attribute in the **Button** state or the **Reset Button** state

#### Example

\`\`\`\`quote
In this example, everything in the document is to be translated when the page is localized, except the sample keyboard input and sample program output:

\`\`\`html
<!DOCTYPE HTML>
<html lang="en"> <!-- default on the document element is translate=yes -->
 <head>
  <title>The Bee Game</title> <!-- implied translate=yes inherited from ancestors -->
 </head>
 <body>
  <p>The Bee Game is a text adventure game in English.</p>
  <p>When the game launches, the first thing you should do is type
  <kbd translate="no">eat honey</kbd>. The game will respond with:</p>
  <pre><samp translate="no">Yum yum! That was some good honey!</samp></pre>
 </body>
</html>
\`\`\`
\`\`\`\`
`.repeat(20);
