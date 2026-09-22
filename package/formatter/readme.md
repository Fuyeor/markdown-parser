@ffm/formatter — A lightweight, deterministic Markdown and FFM (Fuyeor Flavored Markdown) formatter with built-in CJK typographic spacing, table alignment, list indentation normalization, and semantic fence processing.

## Features

- **Typography**: Automatic spacing between Chinese/Japanese and Latin/digits without altering protected tokens (inline code/math).
- **Table Normalization**: Canonical pipe table formatting and delimiter cleanup.
- **List Indentation**: Consistent 2-space indentation depth for nested ordered and unordered lists.
- **Semantic Fences**: Recursive formatting inside semantic containers (`quote`, `slide`, `chain`, `accordion`).
- **Configurable Blank Lines**: Fine-grained control over consecutive blank line collapsing.

You can also test it online at [flavored.fuyeor.com](https://flavored.fuyeor.com/playground).

## Quick Start

```ts
import { format } from '@ffm/formatter';

const markdown = `
# the old man and the sea
这是english文本。
|Name|Age|
|------|-------|
|Fuyeor|20|
`;

const formatted = format(markdown, {
  autoCase: {
    heading: 'title',
    glossary: { 'english': 'English' },
  },
});
console.log(formatted);
```

**Output**:

```markdown
# The Old Man and the Sea

这是 English 文本。

| Name | Age |
| --- | --- |
| Fuyeor | 20 |
```

## API Option

`format(content: string, option?: FormatOption): string`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `maxBlankLine` | `number` | `1` | Maximum allowable consecutive blank lines between blocks. |
| `autoCase.sentence` | `'capitalize'` | `undefined` | Capitalize the first letter of each sentence. |
| `autoCase.heading` | `'sentence' \| 'title' \| 'capitalize'` | `undefined` | Heading casing style. `title` uses Chicago/AP style. |
| `autoCase.glossary` | `Record<string, string>` | `undefined` | Term dictionary for boundary-safe replacements. |
| `continuousScript.autoSpacing` | `boolean` | `true` | Insert spaces between continuous script and Latin/digit boundaries. |
| `continuousScript.autoUpperWord` | `boolean` | `false` | Capitalize standalone English words in continuous script text. |
| `continuousScript.fullwidthPunctuation` | `boolean` | `true` | Capitalize standalone English words in Chinese and Japanese text. |
| `transformer` | `(text: string) => string` | `undefined` | Custom text transformer callback. |

### Advanced Example

```ts
import { format } from '@ffm/formatter';

const source = `
# introduction to webauthn and ts
我经常用 ts 开发。/api/v1 接口很稳定。
react nativeの動作原理
`;

const formatted = format(source, {
  autoCase: {
    heading: 'title',
    glossary: {
      ts: 'TypeScript',
      webauthn: 'WebAuthn',
    },
  },
  continuousScript: {
    autoSpacing: true,
    autoUpperWord: true,
  },
  maxBlankLine: 1,
});
```

**Output**:

````markdown
# Introduction to WebAuthn and TypeScript

我经常用 TypeScript 开发。/api/v1 接口很稳定。

React Native の動作原理
````