// @/main.ts
// pnpm playground
import App from './App.vue';
import router from './router';

import { createApp } from 'vue';
import { initializeLocale, createHead } from '@fuyeor/commons';
import { vRipple, vTooltip } from '@fuyeor/interactify';

async function bootstrap() {
  const app = createApp(App);
  const head = createHead();

  app.use(router);
  app.use(head);

  await initializeLocale({ app });

  app.directive('ripple', vRipple);
  app.directive('tooltip', vTooltip);

  app.mount('#app');
}

bootstrap();
