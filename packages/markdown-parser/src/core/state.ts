// @fuyeor/markdown-parser/src/core/state.ts
export class BlockState {
  lines: string[];
  lineIndex: number = 0;
  readonly lineCount: number;

  constructor(content: string) {
    // convert tab at the line beginning to 4 spaces
    this.lines = content
      .replace(/\r\n|\r/g, '\n')
      .replace(/^[ \t]*\t/gm, '    ')
      .split('\n');
    this.lineCount = this.lines.length;
  }

  get currentLine(): string | null {
    if (this.lineIndex >= this.lineCount) return null;
    return this.lines[this.lineIndex];
  }

  get remainingLines(): string[] {
    return this.lines.slice(this.lineIndex);
  }

  advance(count: number = 1): void {
    this.lineIndex += count;
  }
}

export class InlineState {
  content: string;
  pos: number = 0;
  readonly length: number;

  constructor(content: string) {
    this.content = content;
    this.length = content.length;
  }

  get currentChar(): string | null {
    if (this.pos >= this.length) return null;
    return this.content[this.pos];
  }

  advance(count: number = 1): void {
    this.pos += count;
  }
}
