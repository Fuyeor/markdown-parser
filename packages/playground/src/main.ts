// @fuyeor/markdown-parser-playground/src/main.ts
import App from './App.vue';
import router from './router';
import { createApp } from 'vue';
import { initializeLocale } from '@fuyeor/commons';
import { vRipple, vTooltip } from '@fuyeor/interactify';
import './styles.css';

async function bootstrap() {
  // Create the application and register core plugins before locale initialization.
  const app = createApp(App);
  app.use(router);
  await initializeLocale({ app });
  app.directive('ripple', vRipple);
  app.directive('tooltip', vTooltip);
  app.mount('#app');
}

bootstrap();
