import { describe, it, expect, beforeEach } from "vitest";
import { DocumentModel, type Position, type Range } from "../src/document/DocumentModel.js";

describe("DocumentModel", () => {
  let doc: DocumentModel;

  beforeEach(() => {
    doc = new DocumentModel();
  });

  describe("基本文本操作", () => {
    it("应该创建空文档", () => {
      expect(doc.getText()).toBe("");
      expect(doc.getLineCount()).toBe(1);
    });

    it("应该创建带初始文本的文档", () => {
      const docWithText = new DocumentModel("Hello\nWorld");
      expect(docWithText.getText()).toBe("Hello\nWorld");
      expect(docWithText.getLineCount()).toBe(2);
    });

    it("应该能够设置和获取文本", () => {
      doc.setText("New text");
      expect(doc.getText()).toBe("New text");
    });

    it("应该正确计算行数", () => {
      doc.setText("Line 1");
      expect(doc.getLineCount()).toBe(1);

      doc.setText("Line 1\nLine 2");
      expect(doc.getLineCount()).toBe(2);

      doc.setText("Line 1\nLine 2\nLine 3");
      expect(doc.getLineCount()).toBe(3);

      doc.setText("Line 1\n\nLine 3");
      expect(doc.getLineCount()).toBe(3);
    });

    it("应该能够获取指定行的内容", () => {
      doc.setText("First\nSecond\nThird");
      expect(doc.getLine(0)).toBe("First");
      expect(doc.getLine(1)).toBe("Second");
      expect(doc.getLine(2)).toBe("Third");
    });

    it("获取不存在的行应该抛出错误", () => {
      doc.setText("Only one line");
      expect(() => doc.getLine(-1)).toThrow("Line -1 is out of range");
      expect(() => doc.getLine(1)).toThrow("Line 1 is out of range");
    });
  });

  describe("位置与偏移转换", () => {
    beforeEach(() => {
      doc.setText("Hello\nWorld\nTest");
      // 文本布局:
      // 0: "Hello" (0-4)
      // 1: "World" (6-10)  
      // 2: "Test"  (12-15)
    });

    it("应该正确将位置转换为偏移", () => {
      expect(doc.positionToOffset({ line: 0, column: 0 })).toBe(0);
      expect(doc.positionToOffset({ line: 0, column: 5 })).toBe(5);
      expect(doc.positionToOffset({ line: 1, column: 0 })).toBe(6);
      expect(doc.positionToOffset({ line: 1, column: 5 })).toBe(11);
      expect(doc.positionToOffset({ line: 2, column: 0 })).toBe(12);
      expect(doc.positionToOffset({ line: 2, column: 4 })).toBe(16);
    });

    it("应该正确将偏移转换为位置", () => {
      expect(doc.offsetToPosition(0)).toEqual({ line: 0, column: 0 });
      expect(doc.offsetToPosition(5)).toEqual({ line: 0, column: 5 });
      expect(doc.offsetToPosition(6)).toEqual({ line: 1, column: 0 });
      expect(doc.offsetToPosition(11)).toEqual({ line: 1, column: 5 });
      expect(doc.offsetToPosition(12)).toEqual({ line: 2, column: 0 });
      expect(doc.offsetToPosition(16)).toEqual({ line: 2, column: 4 });
    });

    it("应该处理越界的位置和偏移", () => {
      // 超出列范围的位置
      expect(doc.positionToOffset({ line: 0, column: 100 })).toBe(5);
      expect(doc.positionToOffset({ line: 1, column: 100 })).toBe(11);
      
      // 负数位置
      expect(doc.positionToOffset({ line: -1, column: 0 })).toBe(0);
      expect(doc.positionToOffset({ line: 0, column: -1 })).toBe(0);
      
      // 超出范围的偏移
      expect(doc.offsetToPosition(-1)).toEqual({ line: 0, column: 0 });
      expect(doc.offsetToPosition(100)).toEqual({ line: 2, column: 4 });
    });

    it("位置和偏移转换应该互为逆操作", () => {
      const positions: Position[] = [
        { line: 0, column: 0 },
        { line: 0, column: 3 },
        { line: 1, column: 2 },
        { line: 2, column: 4 },
      ];

      positions.forEach(pos => {
        const offset = doc.positionToOffset(pos);
        expect(doc.offsetToPosition(offset)).toEqual(pos);
      });
    });
  });

  describe("文本编辑操作", () => {
    beforeEach(() => {
      doc.setText("Hello\nWorld");
    });

    it("应该能够在指定位置插入文本", () => {
      doc.insert({ line: 0, column: 5 }, " TypeScript");
      expect(doc.getText()).toBe("Hello TypeScript\nWorld");

      doc.insert({ line: 1, column: 0 }, "Beautiful ");
      expect(doc.getText()).toBe("Hello TypeScript\nBeautiful World");
    });

    it("应该能够删除指定范围的文本", () => {
      const range: Range = {
        start: { line: 0, column: 0 },
        end: { line: 0, column: 5 }
      };
      doc.deleteRange(range);
      expect(doc.getText()).toBe("\nWorld");
    });

    it("应该能够替换指定范围的文本", () => {
      const range: Range = {
        start: { line: 0, column: 0 },
        end: { line: 0, column: 5 }
      };
      doc.replaceRange(range, "Hi");
      expect(doc.getText()).toBe("Hi\nWorld");
    });

    it("应该处理跨行的范围操作", () => {
      doc.setText("Line 1\nLine 2\nLine 3");
      const range: Range = {
        start: { line: 0, column: 5 },
        end: { line: 2, column: 0 }
      };
      doc.replaceRange(range, " replaced ");
      expect(doc.getText()).toBe("Line  replaced Line 3");
    });

    it("应该正确处理反向范围（end < start）", () => {
      const range: Range = {
        start: { line: 0, column: 5 },
        end: { line: 0, column: 0 }
      };
      doc.replaceRange(range, "Hi");
      expect(doc.getText()).toBe("Hi\nWorld");
    });
  });

  describe("文本查找和替换", () => {
    beforeEach(() => {
      doc.setText("Hello world, this is a world of code, world!");
    });

    it("应该能够查找第一个匹配项", () => {
      const result = doc.findFirst("world");
      expect(result).not.toBeNull();
      expect(result).toEqual({
        start: { line: 0, column: 6 },
        end: { line: 0, column: 11 }
      });
    });

    it("查找不存在的文本应该返回null", () => {
      const result = doc.findFirst("notexist");
      expect(result).toBeNull();
    });

    it("查找空字符串应该返回null", () => {
      const result = doc.findFirst("");
      expect(result).toBeNull();
    });

    it("应该能够替换所有匹配项", () => {
      const count = doc.replaceAll("world", "universe");
      expect(count).toBe(3);
      expect(doc.getText()).toBe("Hello universe, this is a universe of code, universe!");
    });

    it("替换不存在的文本应该返回0", () => {
      const count = doc.replaceAll("notexist", "something");
      expect(count).toBe(0);
      expect(doc.getText()).toBe("Hello world, this is a world of code, world!");
    });

    it("替换空字符串应该返回0", () => {
      const count = doc.replaceAll("", "something");
      expect(count).toBe(0);
      expect(doc.getText()).toBe("Hello world, this is a world of code, world!");
    });

    it("应该正确处理重叠的替换", () => {
      doc.setText("aaa");
      const count = doc.replaceAll("aa", "b");
      expect(count).toBe(1);
      expect(doc.getText()).toBe("ba");
    });
  });

  describe("行范围获取", () => {
    it("应该获取单行文档的范围", () => {
      doc.setText("Single line");
      const range = doc.getLineRange(0);
      expect(range).toEqual({
        start: { line: 0, column: 0 },
        end: { line: 0, column: 11 }
      });
    });

    it("应该获取多行文档的范围", () => {
      doc.setText("Line 1\nLine 2\nLine 3");
      
      const range0 = doc.getLineRange(0);
      expect(range0).toEqual({
        start: { line: 0, column: 0 },
        end: { line: 1, column: 0 }
      });

      const range1 = doc.getLineRange(1);
      expect(range1).toEqual({
        start: { line: 1, column: 0 },
        end: { line: 2, column: 0 }
      });

      const range2 = doc.getLineRange(2);
      expect(range2).toEqual({
        start: { line: 2, column: 0 },
        end: { line: 2, column: 6 }
      });
    });

    it("应该正确处理以换行符结尾的文本", () => {
      doc.setText("Line 1\nLine 2\n");
      
      const range0 = doc.getLineRange(0);
      expect(range0).toEqual({
        start: { line: 0, column: 0 },
        end: { line: 1, column: 0 }
      });

      const range1 = doc.getLineRange(1);
      expect(range1).toEqual({
        start: { line: 1, column: 0 },
        end: { line: 2, column: 0 }
      });
    });

    it("获取不存在行的范围应该抛出错误", () => {
      doc.setText("Single line");
      expect(() => doc.getLineRange(-1)).toThrow("Line -1 is out of range");
      expect(() => doc.getLineRange(1)).toThrow("Line 1 is out of range");
    });
  });

  describe("边界情况和错误处理", () => {
    it("应该正确处理空文档", () => {
      expect(doc.getText()).toBe("");
      expect(doc.getLineCount()).toBe(1);
      expect(doc.getLine(0)).toBe("");
      
      const pos = doc.offsetToPosition(0);
      expect(pos).toEqual({ line: 0, column: 0 });
      
      const offset = doc.positionToOffset({ line: 0, column: 0 });
      expect(offset).toBe(0);
    });

    it("应该正确处理只包含换行符的文档", () => {
      doc.setText("\n");
      expect(doc.getLineCount()).toBe(2);
      expect(doc.getLine(0)).toBe("");
      expect(doc.getLine(1)).toBe("");
    });

    it("应该正确处理多个连续换行符", () => {
      doc.setText("\n\n\n");
      expect(doc.getLineCount()).toBe(4);
      for (let i = 0; i < 4; i++) {
        expect(doc.getLine(i)).toBe("");
      }
    });

    it("应该正确处理位置边界情况", () => {
      doc.setText("Test");
      
      // 测试位置限制功能
      expect(doc.positionToOffset({ line: -10, column: -10 })).toBe(0);
      expect(doc.positionToOffset({ line: 10, column: 10 })).toBe(4);
    });

    it("应该正确处理复杂的文本结构", () => {
      const complexText = "第一行\n\n第三行有中文\n  缩进行\n\n最后一行";
      doc.setText(complexText);
      
      expect(doc.getLineCount()).toBe(6);
      expect(doc.getLine(0)).toBe("第一行");
      expect(doc.getLine(1)).toBe("");
      expect(doc.getLine(2)).toBe("第三行有中文");
      expect(doc.getLine(3)).toBe("  缩进行");
      expect(doc.getLine(4)).toBe("");
      expect(doc.getLine(5)).toBe("最后一行");
    });
  });
});