// @/document/util/formatTime.ts
import { t, locale } from '@fuyeor/vue-locale';

// Format relative timestamps in the active locale.
export const formatTime = (timestamp: number): string => {
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 60000) return t('document.justNow');
  if (diff < 3600000)
    return t('document.minutesAgo', {
      value: Math.floor(diff / 60000),
    });
  if (diff < 86400000)
    return t('document.hoursAgo', {
      value: Math.floor(diff / 3600000),
    });
  if (diff < 172800000) return t('document.yesterday');
  if (diff < 604800000)
    return t('document.daysAgo', {
      value: Math.floor(diff / 86400000),
    });
  if (diff < 2592000000)
    return t('document.weeksAgo', {
      value: Math.floor(diff / 604800000),
    });

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(timestamp);
};
