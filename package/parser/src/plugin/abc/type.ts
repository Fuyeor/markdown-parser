// @ffm/parser/src/plugin/abc/type.ts

// 定义 abcjs 的最小化接口类型
export interface Abc {
  renderAbc(
    element: HTMLElement,
    code: string,
    option: {
      responsive: string;
      add_classes: boolean;
      paddingbottom: number;
      paddingtop: number;
      paddingleft: number;
      paddingright: number;
    },
  ): void;
}

export interface AbcSource {
  script: string;
  style?: readonly string[];
}
