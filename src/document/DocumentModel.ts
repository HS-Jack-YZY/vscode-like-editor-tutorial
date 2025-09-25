/**
 * 文本编辑器最基础的数据结构：
 * - Position: 行列坐标（0-based）
 * - Range: 起止位置（半开区间约定：包含 start，不包含 end）
 * - DocumentModel: 维护文本并提供插入/删除/替换以及位移换算
 */

export type Position = {
  line: number;
  column: number;
};

export type Range = {
  start: Position;
  end: Position;
};

export class DocumentModel {
  private text: string;

  constructor(initialText = "") {
    this.text = initialText;
  }

  getText(): string {
    return this.text;
  }

  setText(newText: string): void {
    this.text = newText;
  }

  getLineCount(): number {
    if (this.text.length === 0) return 1;
    return this.text.split("\n").length;
  }

  getLine(line: number): string {
    const lines = this.text.split("\n");
    if (line < 0 || line >= lines.length) {
      throw new RangeError(`Line ${line} is out of range [0, ${lines.length - 1}]`);
    }
    return lines[line]!;
  }

  /**
   * 将 Position 转换为偏移量（0-based offset）
   */
  positionToOffset(pos: Position): number {
    const { line, column } = this.clampPosition(pos);
    if (line === 0) return Math.min(column, this.getLine(0).length);

    let offset = 0;
    for (let i = 0; i < line; i++) {
      offset += this.getLine(i).length + 1; // + '\n'
    }
    return offset + Math.min(column, this.getLine(line).length);
  }

  /**
   * 将偏移量转换为 Position
   */
  offsetToPosition(offset: number): Position {
    const clamped = Math.max(0, Math.min(offset, this.text.length));
    const lines = this.text.split("\n");

    let cumulative = 0;
    for (let line = 0; line < lines.length; line++) {
      const lineLen = lines[line]!.length;
      const lineStart = cumulative;
      const lineEnd = cumulative + lineLen; // 不含换行
      if (clamped <= lineEnd) {
        return { line, column: clamped - lineStart };
      }
      // 跳过换行符
      cumulative = lineEnd + 1;
    }
    // 若 offset 恰好在文本末尾（可能没有换行）
    const last = Math.max(0, lines.length - 1);
    return { line: last, column: lines[last]!.length };
  }

  /**
   * 在指定位置插入文本
   */
  insert(pos: Position, insertText: string): void {
    const offset = this.positionToOffset(pos);
    this.text = this.text.slice(0, offset) + insertText + this.text.slice(offset);
  }

  /**
   * 删除范围（半开区间）：[start, end)
   */
  deleteRange(range: Range): void {
    const { start, end } = this.normalizeRange(range);
    const startOffset = this.positionToOffset(start);
    const endOffset = this.positionToOffset(end);
    this.text = this.text.slice(0, startOffset) + this.text.slice(endOffset);
  }

  /**
   * 替换范围为新文本
   */
  replaceRange(range: Range, newText: string): void {
    const { start, end } = this.normalizeRange(range);
    const startOffset = this.positionToOffset(start);
    const endOffset = this.positionToOffset(end);
    this.text = this.text.slice(0, startOffset) + newText + this.text.slice(endOffset);
  }

  /**
   * 查找子串首次出现的范围（简单版，区分大小写）
   */
  findFirst(query: string): Range | null {
    if (query.length === 0) return null;
    const idx = this.text.indexOf(query);
    if (idx === -1) return null;
    const start = this.offsetToPosition(idx);
    const end = this.offsetToPosition(idx + query.length);
    return { start, end };
  }

  /**
   * 归一化范围，保证 start <= end
   */
  private normalizeRange(range: Range): Range {
    const sOff = this.positionToOffset(range.start);
    const eOff = this.positionToOffset(range.end);
    if (sOff <= eOff) return range;
    return { start: range.end, end: range.start };
  }

  /**
   * 将 Position 限制在文本范围内
   */
  private clampPosition(pos: Position): Position {
    const lines = this.text.split("\n");
    const maxLine = Math.max(0, lines.length - 1);
    const line = Math.max(0, Math.min(pos.line, maxLine));
    const maxCol = lines[line]!.length;
    const column = Math.max(0, Math.min(pos.column, maxCol));
    return { line, column };
  }
}
