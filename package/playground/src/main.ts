// @/main.ts
// pnpm playground
import App from './App.vue';
import router from '@app/router';

import { createApp } from 'vue';
import { initializeLocale, createHead } from '@fuyeor/commons';
import { vRipple, vTooltip } from '@fuyeor/interactify';

const app = createApp(App);
const head = createHead();

app.use(router);
app.use(head);

await initializeLocale({ app });

app.directive('ripple', vRipple);
app.directive('tooltip', vTooltip);

app.mount('#app');
