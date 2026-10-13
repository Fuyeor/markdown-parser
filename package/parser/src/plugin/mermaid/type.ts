// @ffm/parser/src/plugin/mermaid/type.ts

export interface Mermaid {
  parse(code: string): Promise<void>;
  render(
    id: string,
    code: string,
  ): Promise<{ svg: string; bindFunctions?: (element: Element) => void }>;
  initialize(config: {
    startOnLoad?: boolean;
    securityLevel?: string;
    suppressErrorRendering?: boolean;
  }): void;
  isInitialized?: boolean;
}

export interface MermaidSource {
  script: string;
  style?: readonly string[];
}
