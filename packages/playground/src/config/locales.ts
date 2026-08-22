// @fuyeor/markdown-parser-playground/src/config/locales.ts

export const SUPPORTED_LOCALES = ['ar', 'de', 'en', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'zh-hans'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_REGEX = SUPPORTED_LOCALES.join('|');
