// @app/state/appearance.ts
import { createAppearanceState } from '@fuyeor/commons';
import { useFlowerEffect } from '@fuyeor/interactify';

export const useAppearanceState = createAppearanceState({
  onEnableFlower: useFlowerEffect,
});
