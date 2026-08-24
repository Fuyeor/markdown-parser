// @/composables/usePlaygroundLink.ts
import { computed } from 'vue';
import { useRoute, type RouteLocationRaw } from '@fuyeor/vue-router';

// Build a locale-preserving link to the blank playground document.
export function usePlaygroundLink() {
  const route = useRoute();

  return computed<RouteLocationRaw>(() => ({
    name: 'Playground',
    params: { ...route.params, id: undefined },
  }));
}

export type PlaygroundLink = ReturnType<typeof usePlaygroundLink>;
