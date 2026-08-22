// @fuyeor/markdown-parser-playground/src/locale/index.ts
import localeSource from './locale.json';

export const SUPPORTED_LOCALES = ['ar', 'de', 'en', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'zh-hans'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
type LocaleSource = Record<string, Partial<Record<SupportedLocale, string>>>;

export const messagesByLocale = Object.fromEntries(
  SUPPORTED_LOCALES.map((language) => [
    language,
    Object.fromEntries(
      Object.entries(localeSource as LocaleSource).map(([key, messages]) => [key, messages[language] ?? messages.en ?? key]),
    ),
  ]),
) as Record<SupportedLocale, Record<string, string>>;
