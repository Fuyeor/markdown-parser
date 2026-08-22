// @/config/sidebar/menu.config.ts
import { getIconUrl } from '@fuyeor/commons';
import type { SidebarItemConfig } from '@fuyeor/interactify';

export const sidebarItemsRaw: SidebarItemConfig[] = [
  {
    target: '/',
    icon: getIconUrl('home'),
    textKey: 'home',
  },
  {
    target: '/playground',
    icon: getIconUrl('home'),
    textKey: 'playground',
  },
];
