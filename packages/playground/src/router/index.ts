// @fuyeor/markdown-parser-playground/src/router/index.ts
import { useLocaleStore } from '@fuyeor/commons';
import { createRouter, RouterView, type RouteRecord } from '@fuyeor/vue-router';
import { LOCALE_REGEX, SUPPORTED_LOCALES } from '../config/locales';

const appRoutes: Array<RouteRecord> = [
  {
    path: '',
    name: 'playground',
    component: () => import('../Playground.vue'),
  },
];

const routes: Array<RouteRecord> = [
  {
    path: `{/:locale(${LOCALE_REGEX})}?`,
    component: RouterView,
    children: appRoutes,
  },
];

const router = createRouter({ routes });
router.beforeEach(async (to) => {
  const localeStore = useLocaleStore();
  const routeLocale = to.params.locale as string | undefined;

  if (!routeLocale) {
    return { name: to.name, params: { ...to.params, locale: localeStore.locale } };
  }
  if (!SUPPORTED_LOCALES.includes(routeLocale as (typeof SUPPORTED_LOCALES)[number])) return false;
  if (routeLocale !== localeStore.locale) await localeStore.setLocale(routeLocale);
  return true;
});

export default router;
