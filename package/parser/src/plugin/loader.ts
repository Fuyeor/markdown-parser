// @ffm/parser/src/async/loader.ts
const scriptCache = new Map<string, Promise<unknown>>();
const moduleCache = new Map<string, Promise<unknown>>();
const styleCache = new Set<string>();

// Load a classic script once and resolve the global it exposes.
export function loadScript<T>(url: string, global: string): Promise<T> {
  const cached = scriptCache.get(url);
  if (cached) return cached as Promise<T>;

  const { promise, resolve, reject } = Promise.withResolvers<T>();
  const element = window.document.createElement('script');
  element.src = url;
  element.async = true;
  element.crossOrigin = 'anonymous';
  element.addEventListener('load', () => {
    const value = (window as unknown as Record<string, unknown>)[global];
    // onload implies synchronous execution finished; a missing global is a real error.
    if (value === undefined)
      reject(new Error(`Global "${global}" is missing after loading "${url}"`));
    else resolve(value as T);
  });
  element.addEventListener('error', () =>
    reject(new Error(`Failed to load script: "${url}"`)),
  );
  window.document.head.append(element);

  promise.catch(() => scriptCache.delete(url));
  scriptCache.set(url, promise);
  return promise;
}

// Load a script purely for its side effects (e.g. registering into window.hljs).
export function loadEffect(url: string): Promise<void> {
  const cached = scriptCache.get(url);
  if (cached) return cached.then(() => undefined);

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const element = window.document.createElement('script');
  element.src = url;
  element.async = true;
  element.crossOrigin = 'anonymous';
  element.addEventListener('load', () => resolve());
  element.addEventListener('error', () =>
    reject(new Error(`Failed to load script: "${url}"`)),
  );
  window.document.head.append(element);

  promise.catch(() => scriptCache.delete(url));
  scriptCache.set(url, promise);
  return promise;
}

// Dynamically import an ES module; Vite must not try to bundle the URL.
export function loadModule<T>(url: string): Promise<T> {
  const cached = moduleCache.get(url);
  if (cached) return cached as Promise<T>;

  const promise = import(/* @vite-ignore */ url) as Promise<T>;
  promise.catch(() => moduleCache.delete(url));
  moduleCache.set(url, promise);
  return promise;
}

// Inject a stylesheet once; on failure drop it so the caller can retry.
export function loadStyle(url: string): Promise<void> {
  if (styleCache.has(url)) return Promise.resolve();
  styleCache.add(url);

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const element = window.document.createElement('link');
  element.rel = 'stylesheet';
  element.crossOrigin = 'anonymous';
  element.href = url;
  element.addEventListener('load', () => resolve());
  element.addEventListener('error', () => {
    styleCache.delete(url);
    element.remove();
    reject(new Error(`Failed to load stylesheet: "${url}"`));
  });
  window.document.head.append(element);
  return promise;
}
