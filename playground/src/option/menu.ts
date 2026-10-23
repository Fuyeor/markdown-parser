// @/option/menu.ts
import { getIconUrl } from '@fuyeor/commons';

export const dashboardMenu = {
  title: '',
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
        {
          icon: getIconUrl('learn'),
          title: 'option.document',
          to: { name: 'Option.Document' },
        },
      ],
    },
  ],
};
