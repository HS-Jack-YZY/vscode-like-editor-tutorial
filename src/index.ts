import { DocumentModel, type Position } from "./document/DocumentModel.js";

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

function logSection(title: string) {
  console.log("\n=== " + title + " ===");
}
