import { DocumentModel, type Position, type Range } from "./document/DocumentModel.js";

// 演示：创建文档、插入/替换、位置与偏移转换
const doc = new DocumentModel("Hello\nWorld");

logSection("初始文本");
console.log(doc.getText());
console.log("行数:", doc.getLineCount()); // 2
console.log("第 1 行:", doc.getLine(0)); // Hello

logSection("插入操作（在第一行末尾插入 ', TS'）");
doc.insert({ line: 0, column: doc.getLine(0).length }, ", TS");
console.log(doc.getText()); // Hello, TS\nWorld

logSection("查找 'World'");
const found = doc.findFirst("World");
console.log(found);

if (found) {
  logSection("替换 'World' -> 'TypeScript'");
  doc.replaceRange(found, "TypeScript");
  console.log(doc.getText()); // Hello, TS\nTypeScript
}

logSection("位置 <-> 偏移");
const pos: Position = { line: 1, column: 4 }; // "TypeScript" 的 'S'
const off = doc.positionToOffset(pos);
console.log("Position", pos, "-> offset", off);
console.log("offset", off, "-> Position", doc.offsetToPosition(off));

logSection("测试 replaceAll 方法");
const doc2 = new DocumentModel("Hello world, this is a world of code, world!");
console.log("原文本:", doc2.getText());
const replaceCount = doc2.replaceAll("world", "universe");
console.log("替换 'world' -> 'universe', 替换次数:", replaceCount);
console.log("替换后:", doc2.getText());

logSection("测试 getLineRange 方法");
const doc3 = new DocumentModel("Line 1\nLine 2\nLine 3");
console.log("原文本:");
console.log(doc3.getText());
for (let i = 0; i < doc3.getLineCount(); i++) {
  const range = doc3.getLineRange(i);
  console.log(`第 ${i} 行范围:`, range);
  // 使用范围来获取该行内容（包含换行符）
  const startOffset = doc3.positionToOffset(range.start);
  const endOffset = doc3.positionToOffset(range.end);
  const lineContent = doc3.getText().slice(startOffset, endOffset);
  console.log(`第 ${i} 行内容: "${lineContent}"`);
}

logSection("边界情况测试");
// 测试空字符串替换
const doc4 = new DocumentModel("test");
console.log("空字符串替换次数:", doc4.replaceAll("", "x")); // 应该返回 0

// 测试不存在的字符串替换
const doc5 = new DocumentModel("hello");
console.log("不存在字符串替换次数:", doc5.replaceAll("xyz", "abc")); // 应该返回 0

// 测试单行文档的 getLineRange
const doc6 = new DocumentModel("Single line");
const singleLineRange = doc6.getLineRange(0);
console.log("单行文档范围:", singleLineRange);
console.log("单行内容:", doc6.getText().slice(
  doc6.positionToOffset(singleLineRange.start),
  doc6.positionToOffset(singleLineRange.end)
));

// 测试 getLineRange 错误处理
try {
  doc6.getLineRange(-1);
} catch (error) {
  console.log("负数行号错误:", (error as Error).message);
}

try {
  doc6.getLineRange(10);
} catch (error) {
  console.log("超出范围行号错误:", (error as Error).message);
}

function logSection(title: string) {
  console.log("\n=== " + title + " ===");
}