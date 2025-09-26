import { describe, it, expect } from "vitest";
import { DocumentModel } from "../src/document/DocumentModel.js";

describe("DocumentModel Integration Tests", () => {
  it("应该支持完整的文档编辑工作流", () => {
    // 创建一个空文档
    const doc = new DocumentModel();
    
    // 添加一些初始内容
    doc.setText("Hello World\nThis is a test\nEnd");
    expect(doc.getLineCount()).toBe(3);
    
    // 在第一行末尾添加内容
    doc.insert({ line: 0, column: 11 }, "!");
    expect(doc.getText()).toBe("Hello World!\nThis is a test\nEnd");
    
    // 查找并替换 "test" 为 "demo"
    const found = doc.findFirst("test");
    expect(found).not.toBeNull();
    if (found) {
      doc.replaceRange(found, "demo");
    }
    expect(doc.getText()).toBe("Hello World!\nThis is a demo\nEnd");
    
    // 批量替换 "is" 为 "was"
    const replaceCount = doc.replaceAll("is", "was");
    expect(replaceCount).toBe(2); // "This" -> "Thwas", "is" -> "was"
    expect(doc.getText()).toBe("Hello World!\nThwas was a demo\nEnd");
    
    // 删除整个第二行
    const lineRange = doc.getLineRange(1);
    doc.deleteRange(lineRange);
    expect(doc.getText()).toBe("Hello World!\nEnd");
    expect(doc.getLineCount()).toBe(2);
    
    // 在文档末尾添加新行
    doc.insert({ line: 1, column: 3 }, "\nNew line added");
    expect(doc.getText()).toBe("Hello World!\nEnd\nNew line added");
    expect(doc.getLineCount()).toBe(3);
  });

  it("应该正确处理多语言文本编辑", () => {
    const doc = new DocumentModel("Hello 世界\n你好 World\nend");
    
    // 测试中文字符的位置计算
    expect(doc.positionToOffset({ line: 0, column: 6 })).toBe(6);
    expect(doc.positionToOffset({ line: 1, column: 2 })).toBe(11);
    
    // 查找中文内容
    const found = doc.findFirst("世界");
    expect(found).toEqual({
      start: { line: 0, column: 6 },
      end: { line: 0, column: 8 }
    });
    
    // 替换中文内容
    if (found) {
      doc.replaceRange(found, "World");
    }
    expect(doc.getText()).toBe("Hello World\n你好 World\nend");
    
    // 处理包含中文的行范围
    const line1Range = doc.getLineRange(1);
    const line1Content = doc.getText().slice(
      doc.positionToOffset(line1Range.start),
      doc.positionToOffset(line1Range.end)
    );
    expect(line1Content).toBe("你好 World\n");
  });

  it("应该支持复杂的文档重构操作", () => {
    // 模拟一个简单的代码文档
    const doc = new DocumentModel(`function hello() {
  console.log("Hello");
  return "world";
}

const result = hello();`);

    // 重命名函数
    let count = doc.replaceAll("hello", "greet");
    expect(count).toBe(2);
    
    // 更新字符串内容
    const stringMatch = doc.findFirst('"Hello"');
    if (stringMatch) {
      doc.replaceRange(stringMatch, '"Greetings"');
    }
    
    // 验证最终结果
    expect(doc.getText()).toBe(`function greet() {
  console.log("Greetings");
  return "world";
}

const result = greet();`);
    
    // 验证行数没有改变
    expect(doc.getLineCount()).toBe(6);
  });
});