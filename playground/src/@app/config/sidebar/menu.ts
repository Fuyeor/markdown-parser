// @app/config/sidebar/menu.ts
import { getIconUrl } from '@fuyeor/commons';
import type { SidebarItemConfig } from '@fuyeor/interactify';

export const rawSidebarNav: SidebarItemConfig[] = [
  {
    target: '/',
    icon: getIconUrl('home'),
    textKey: 'home',
  },
];
