// @fuyeor/markdown-parser-playground/src/main.ts
import { createLocale } from '@fuyeor/locale';
import { createApp, watch } from 'vue';
import localeSource from './locale/locale.json';
import App from './App.vue';
import './styles.css';

const supportedLocales = ['ar', 'de', 'en', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'zh-hans'] as const;
type SupportedLocale = (typeof supportedLocales)[number];
type LocaleSource = Record<string, Partial<Record<SupportedLocale, string>>>;

// Detect a supported browser language while keeping English as the deterministic fallback.
function detectLocale(): SupportedLocale {
  const browserLocale = window.navigator.language.toLowerCase();
  if (browserLocale.startsWith('zh')) return browserLocale.includes('hant') ? 'en' : 'zh-hans';
  const language = browserLocale.slice(0, 2) as SupportedLocale;
  return supportedLocales.includes(language) ? language : 'en';
}

const locale = createLocale({ locale: detectLocale() });
const messagesByLocale = Object.fromEntries(
  supportedLocales.map((language) => [
    language,
    Object.fromEntries(
      Object.entries(localeSource as LocaleSource).map(([key, messages]) => [
        key,
        messages[language] ?? messages.en ?? key,
      ]),
    ),
  ]),
) as Record<SupportedLocale, Record<string, string>>;

for (const language of supportedLocales) locale.setLocaleMessage(language, messagesByLocale[language]);

watch(locale.locale, (language) => {
  window.document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
}, { immediate: true });

createApp(App).use(locale).mount('#app');
