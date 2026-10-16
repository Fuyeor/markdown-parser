// @ffm/parser/src/plugin/latex/type.ts

export interface Katex {
  render(
    text: string,
    element: HTMLElement,
    options?: {
      displayMode?: boolean;
      throwOnError?: boolean;
      errorColor?: string;
      macros?: Record<string, string>;
      colorIsTextColor?: boolean;
      output?: 'html' | 'mathml' | 'htmlAndMathml';
    },
  ): void;
}

export interface KatexSource {
  script: string;
  style?: readonly string[];
}
