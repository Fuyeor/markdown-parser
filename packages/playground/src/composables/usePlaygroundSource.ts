// @/composables/usePlaygroundSource.ts
import { ref } from 'vue';

const source = ref('');

export function usePlaygroundSource() {
  return {
    source,
  };
}
