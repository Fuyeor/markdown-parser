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
  readonly content: string;
  pos: number = 0;
  readonly length: number;
  readonly #tokenPositions = new Map<string, number[]>();

  constructor(content: string) {
    this.content = content;
    this.length = content.length;
  }

  get currentChar(): string | null {
    if (this.pos >= this.length) return null;
    return this.content[this.pos];
  }

  findNextToken(token: string, from: number): number {
    if (!token) throw new RangeError('token must not be empty');

    let positions = this.#tokenPositions.get(token);
    if (!positions) {
      positions = [];
      let position = this.content.indexOf(token);
      while (position !== -1) {
        positions.push(position);
        position = this.content.indexOf(token, position + 1);
      }
      this.#tokenPositions.set(token, positions);
    }

    let low = 0;
    let high = positions.length;
    while (low < high) {
      const middle = low + ((high - low) >> 1);
      if (positions[middle] < from) low = middle + 1;
      else high = middle;
    }

    return positions[low] ?? -1;
  }

  advance(count: number = 1): void {
    this.pos += count;
  }
}
