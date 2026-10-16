// @ffm/parser/src/plugin/hydrate.ts
import { loadStyleSheet } from '@fuyeor/util';
import type { AsyncCapability, AsyncRenderer, HydrateOption } from '#/type';

// Walk a container and hydrate every declared async capability in parallel.
export async function hydrate(
  root: ParentNode,
  renderers: readonly AsyncRenderer[],
  option?: HydrateOption,
): Promise<void> {
  const acquisition = new Map<AsyncCapability, Promise<unknown>>();
  const tasks: Promise<void>[] = [];

  for (const renderer of renderers) {
    if (option?.capability && !option.capability.has(renderer.name)) continue;

    const elements = root.querySelectorAll<HTMLElement>(
      `${renderer.selector}:not([data-ffm-rendered])`,
    );
    if (elements.length === 0) continue;

    renderer.style?.forEach(loadStyleSheet);

    tasks.push(
      run(renderer, elements, acquisition, option?.onError).catch((error) => {
        option?.onError?.(renderer.name, error);
      }),
    );
  }

  await Promise.allSettled(tasks);
}

async function run(
  renderer: AsyncRenderer,
  elements: NodeListOf<HTMLElement>,
  acquisition: Map<AsyncCapability, Promise<unknown>>,
  onError: HydrateOption['onError'],
): Promise<void> {
  let pending = acquisition.get(renderer.name);
  if (!pending) {
    pending = (async () => {
      if (renderer.style) await Promise.all(renderer.style.map(loadStyleSheet));
      return renderer.load();
    })();
    acquisition.set(renderer.name, pending);
  }
  const lib = await pending;

  const results = await Promise.allSettled(
    Array.from(elements, (element) => {
      element.dataset.ffmRendered = 'true';
      return renderer.render(element, lib);
    }),
  );

  for (const result of results) {
    if (result.status === 'rejected') onError?.(renderer.name, result.reason);
  }
}
