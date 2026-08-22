// @fuyeor/markdown-parser-playground/src/router/index.ts
import { useLocaleStore } from '@fuyeor/commons';
import { createRouter, RouterView, type RouteRecord } from '@fuyeor/vue-router';
import { SUPPORTED_LOCALES } from '../locale';
import Playground from '../Playground.vue';

const localePattern = SUPPORTED_LOCALES.join('|');
const routes: Array<RouteRecord> = [
  {
    path: `{/:locale(${localePattern})}?`,
    component: RouterView,
    children: [
      {
        path: '',
        name: 'playground',
        component: Playground,
      },
    ],
  },
];

const router = createRouter({ routes });
router.beforeEach(async (to) => {
  const localeStore = useLocaleStore();
  const routeLocale = String(to.params.locale || '');

  if (!routeLocale) return { name: 'playground', params: { locale: localeStore.locale } };
  if (!SUPPORTED_LOCALES.includes(routeLocale as (typeof SUPPORTED_LOCALES)[number])) {
    return { name: 'playground', params: { locale: localeStore.locale } };
  }
  if (routeLocale !== localeStore.locale) await localeStore.setLocale(routeLocale);
  return true;
});

export default router;
