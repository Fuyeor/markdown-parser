// @/document/composable/useDocumentStats.ts
import { statText } from '@fuyeor/util';
import { computed, type Ref } from 'vue';

export function useDocumentStats(source: Ref<string>) {
  const stats = computed(() => statText(source.value));
  return { stats };
}
