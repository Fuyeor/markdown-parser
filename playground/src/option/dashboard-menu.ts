// @/option/dashboard-menu.ts
import { getIconUrl } from '@fuyeor/commons';

export const dashboardMenu = {
  title: '',
  description: 'option.desc',
  groups: [
    {
      title: '',
      items: [
        {
          icon: getIconUrl('palette'),
          title: 'option.general',
          to: { name: 'Option.General' },
        },
        {
          icon: getIconUrl('extension'),
          title: 'option.editor',
          to: { name: 'Option.Editor' },
        },
      ],
    },
  ],
};
