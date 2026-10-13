// @ffm/parser/src/plugin/highlight/type.ts

export interface Highlight {
  getLanguage(languageName: string): Language | undefined;
  highlightElement(element: Element): void;
  // registerLanguage 函数声明
  registerLanguage(
    languageName: string,
    languageDefinition: (highlight: any) => Language,
  ): void;
  configure(options: { ignoreUnescapedHTML: boolean }): void;
  isInitialized?: boolean;
}

export interface HighlightSource {
  script: string;
  style?: readonly string[];
  /** Lazy language modules keyed by normalized language name. */
  language?: Record<string, () => Promise<{ default: unknown }>>;
}

export interface Language {
  name: string;
  aliases?: string[];
  contains?: any[];
  keywords?: Record<string, string> | string;
}
