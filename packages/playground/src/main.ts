// @fuyeor/markdown-parser-playground/src/main.ts
import { initializeLocale } from '@fuyeor/commons';
import { createApp, watch } from 'vue';
import { messagesByLocale, SUPPORTED_LOCALES } from './locale';
import router from './router';
import App from './App.vue';
import './styles.css';

async function bootstrap() {
  const app = createApp(App);
  const locale = await initializeLocale({ app });
  for (const language of SUPPORTED_LOCALES) locale.setLocaleMessage(language, messagesByLocale[language]);

  watch(locale.locale, (language) => {
    window.document.documentElement.lang = language;
    window.document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, { immediate: true });

  app.use(router).mount('#app');
}

bootstrap();
