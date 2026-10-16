// @ffm/parser/src/plugin/highlight/type.ts

export type LanguageDefinition = (highlight: any) => Language;

export interface Highlight {
  getLanguage(languageName: string): Language | undefined;
  highlightElement(element: Element): void;
  // registerLanguage 函数声明
  registerLanguage(
    languageName: string,
    languageDefinition: LanguageDefinition,
  ): void;
  configure(options: { ignoreUnescapedHTML: boolean }): void;
  isInitialized?: boolean;
}

export interface HighlightSource {
  /** highlight.js core CDN URL */
  script: string;
  /** highlight CSS */
  style?: readonly string[];
  /**
   * 外部官方语言的 CDN URL 解析函数
   * e.g. (lang) => getCdnLibraryUrl(`highlight.js/11.11.1/languages/${lang}.min.js`)
   */
  language?: (lang: string) => string;
  /** user registered language */
  register?: Record<string, () => Promise<{ default: LanguageDefinition }>>;
}

export interface Language {
  name: string;
  aliases?: string[];
  contains?: any[];
  keywords?: Record<string, string> | string;
}
