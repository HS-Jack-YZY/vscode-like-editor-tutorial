# VSCode-like Editor 技术指南

本文档详细说明项目的技术架构、设计思路、为什么要用某些函数、数据如何传递，以及为什么需要多层嵌套结构。

## 目录

1. [项目架构总览](#项目架构总览)
2. [核心数据模型：DocumentModel](#核心数据模型documentmodel)
3. [React 前端架构](#react-前端架构)
4. [数据流详解](#数据流详解)
5. [为什么需要这些层级？](#为什么需要这些层级)
6. [文件结构说明](#文件结构说明)

---

## 项目架构总览

### 整体分层设计

```
┌─────────────────────────────────────────┐
│         用户界面层 (UI Layer)            │
│    Editor / DocumentViewer / etc.       │
│                                         │
│  使用 Hooks 获取数据和操作函数            │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      自定义 Hook 层 (Custom Hooks)       │
│         useDocumentModel()              │
│                                         │
│  封装业务逻辑，提供便利的 API             │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│       Context 层 (Context Layer)        │
│         DocumentContext                 │
│                                         │
│  管理全局状态，提供 doc 单例和 version    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│     核心数据层 (Core Data Layer)         │
│          DocumentModel                  │
│                                         │
│  纯 TypeScript，不依赖 React             │
└─────────────────────────────────────────┘
```

### 为什么要分这么多层？

**分层的核心目的：职责分离（Separation of Concerns）**

1. **核心数据层（DocumentModel）**：纯业务逻辑，不依赖任何 UI 框架
2. **Context 层（DocumentContext）**：连接 React 和 DocumentModel，管理全局状态
3. **Hooks 层（useDocumentModel）**：封装常用操作，提供便利的 API
4. **UI 层（Components）**：专注于界面展示和用户交互

这种分层让代码：
- **易于测试**：核心逻辑不依赖 React，可以独立测试
- **易于复用**：DocumentModel 可以在 Node.js、Electron 等环境使用
- **易于维护**：每层职责清晰，修改某层不会影响其他层
- **易于扩展**：未来可以轻松替换 UI 层（比如换成 Vue）

---

## 核心数据模型：DocumentModel

### 文件位置
`src/document/DocumentModel.ts`

### 作用
DocumentModel 是整个编辑器的核心数据结构，负责：
- 存储文本内容
- 提供文本操作方法（插入、删除、替换、查找）
- 提供位置和偏移量的相互转换

### 核心概念

#### 1. Position（位置）
```typescript
export type Position = {
  line: number;    // 行号，从 0 开始
  column: number;  // 列号，从 0 开始
};
```

**为什么用 Position？**
- 编辑器需要以"行列"方式定位文本（用户友好）
- 便于实现行号显示、光标定位等功能

#### 2. Range（范围）
```typescript
export type Range = {
  start: Position;
  end: Position;
};
```

**为什么用 Range？**
- 表示一段文本区域（如选中的文本）
- 用于删除、替换等操作
- **半开区间约定**：包含 start，不包含 end（符合编程习惯）

#### 3. 核心方法

##### positionToOffset() 和 offsetToPosition()

**为什么需要这两个转换函数？**

在编辑器中，有两种表示文本位置的方式：
1. **Position（行列）**：用户友好，易于理解（"第 3 行第 5 列"）
2. **Offset（偏移量）**：计算机友好，易于字符串操作（"第 42 个字符"）

```typescript
// 例子：文本 "Hello\nWorld"
// Position {line: 1, column: 2} 表示 "World" 的 "r"
// 对应 Offset 8（"Hello\n" 有 6 个字符，"Wo" 有 2 个字符）

doc.positionToOffset({line: 1, column: 2}); // => 8
doc.offsetToPosition(8); // => {line: 1, column: 2}
```

**使用场景：**
- 用户点击编辑器 → textarea 返回 offset → 转换为 Position → 显示行号
- 用户选择"替换第 3 行" → Position → 转换为 offset → 执行字符串操作

##### insert()、deleteRange()、replaceRange()

**为什么提供这三个方法？**
- `insert()`：在光标位置插入文本（最常用）
- `deleteRange()`：删除选中区域
- `replaceRange()`：替换选中区域（等于 delete + insert，但更高效）

这三个操作是所有文本编辑的基础。

##### replaceAll()

**为什么单独提供 replaceAll()？**
- "查找并替换全部"是常用功能
- 单独实现比多次调用 `replaceRange()` 更高效
- 返回替换次数，便于用户反馈

##### getLineRange()

**为什么需要 getLineRange()？**
- 获取某一行的完整范围（包括换行符）
- 用于实现"删除整行"、"复制整行"等功能
- 处理边界情况（最后一行可能没有换行符）

### 为什么 DocumentModel 不使用 React？

**关键原则：核心业务逻辑与 UI 框架解耦**

优点：
1. **可移植性**：DocumentModel 可以在 Node.js、Electron、Web Worker 中使用
2. **可测试性**：不需要 React 测试工具，直接测试即可（见 `test/DocumentModel.test.ts`）
3. **性能**：不需要 React 的重渲染机制，操作更快
4. **灵活性**：未来可以更换 UI 框架而不改动核心逻辑

---

## React 前端架构

### 1. Context 层：DocumentContext

#### 文件位置
`src/frontend/context/DocumentContext.tsx`

#### 作用
DocumentContext 是 React 和 DocumentModel 之间的桥梁，负责：
1. **管理 DocumentModel 单例**：整个应用只有一个 DocumentModel 实例
2. **提供版本号（version）**：用于触发 React 重新渲染
3. **提供更新函数（forceUpdate）**：修改文档后通知 React 更新 UI

#### 核心概念

##### 为什么需要 version？

**React 的渲染机制问题：**
```typescript
const [doc] = useState(() => new DocumentModel("Hello"));

// ❌ 这样修改文档，React 不知道数据变了！
doc.setText("World");  // 文档内容变了，但 React 不会重新渲染

// ✅ 使用 version 强制重新渲染
const [version, setVersion] = useState(0);
doc.setText("World");
setVersion(v => v + 1);  // 通知 React 数据变了
```

**原因：**
- DocumentModel 是一个普通的类实例，React 无法追踪其内部状态变化
- React 只能追踪 `useState` 或 `useReducer` 的状态变化
- 通过增加 `version` 数字，告诉 React "数据变了，请重新渲染"

##### 为什么使用 useMemo？

```typescript
const value = useMemo<DocumentContextValue>(
  () => ({
    doc,
    version,
    forceUpdate,
    setText,
  }),
  [doc, version, forceUpdate, setText]
);
```

**目的：优化性能，避免不必要的重新渲染**

- 如果每次都创建新对象，所有使用 Context 的组件都会重新渲染
- `useMemo` 只在依赖项变化时才创建新对象
- 减少子组件的无意义渲染

##### 为什么使用 useCallback？

```typescript
const forceUpdate = useCallback(() => {
  setVersion((v) => v + 1);
}, []);

const setText = useCallback(
  (newText: string) => {
    doc.setText(newText);
    forceUpdate();
  },
  [doc, forceUpdate]
);
```

**目的：保持函数引用稳定**

- 如果每次都创建新函数，依赖这些函数的 `useEffect` 会反复执行
- `useCallback` 确保只在依赖项变化时才创建新函数
- 提升性能，避免无限循环

#### DocumentProvider 组件

```typescript
export function DocumentProvider({ 
  initialText = "Hello\nWorld\n这是第三行", 
  children 
}: DocumentProviderProps) {
  const [doc] = useState(() => new DocumentModel(initialText));
  const [version, setVersion] = useState(0);
  
  // ... forceUpdate, setText, value ...
  
  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}
```

**为什么需要 Provider？**

- React Context 的标准用法，提供全局状态
- 包裹整个应用，让所有子组件都能访问 DocumentModel
- 初始化 DocumentModel 实例，确保全局单例

**为什么 doc 用 useState 的初始化函数？**

```typescript
const [doc] = useState(() => new DocumentModel(initialText));
```

- 只在组件首次挂载时创建 DocumentModel
- 避免每次重新渲染都创建新实例
- 懒初始化，性能更好

#### useDocument Hook

```typescript
export function useDocument(): DocumentContextValue {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
}
```

**为什么需要这个 Hook？**

1. **类型安全**：自动推断返回类型，无需手动标注
2. **错误检测**：如果在 Provider 外使用，立即报错（开发时发现问题）
3. **简化代码**：直接 `const { doc } = useDocument()` 即可使用

### 2. Hooks 层：useDocumentModel

#### 文件位置
`src/frontend/hooks/useDocumentModel.ts`

#### 作用
封装常用的文档操作，提供更高级、更便利的 API。

#### 为什么需要 useDocumentModel？

**对比 useDocument 和 useDocumentModel：**

```typescript
// ❌ 使用 useDocument（底层 API）
const { doc, version, forceUpdate } = useDocument();
const lineCount = useMemo(() => doc.getLineCount(), [doc, version]);
const handleInsert = () => {
  doc.insert({line: 0, column: 0}, "Hello");
  forceUpdate();  // 别忘了调用！
};

// ✅ 使用 useDocumentModel（高级 API）
const { lineCount, insert } = useDocumentModel();
const handleInsert = () => {
  insert({line: 0, column: 0}, "Hello");
  // 自动调用 forceUpdate，无需手动触发
};
```

**优点：**
1. **自动更新**：所有修改函数都自动调用 `forceUpdate()`
2. **便利属性**：提供 `lineCount`、`getText` 等常用属性
3. **简化代码**：减少样板代码，降低出错概率

#### 核心实现

##### getText 为什么用 useCallback？

```typescript
const getText = useCallback(() => doc.getText(), [doc]);
```

- 保持函数引用稳定，避免子组件不必要的重新渲染
- 虽然 `doc` 不会变化，但遵循 React 最佳实践

##### lineCount 为什么用 useMemo？

```typescript
const lineCount = useMemo(() => doc.getLineCount(), [doc, version]);
```

**关键：依赖 version！**

- `doc.getLineCount()` 需要重新计算（不是简单读取属性）
- 每次 `version` 变化，说明文档被修改了，需要重新计算行数
- `useMemo` 缓存计算结果，避免重复计算

##### 修改函数为什么都调用 forceUpdate？

```typescript
const insert = useCallback(
  (pos: Position, insertText: string) => {
    doc.insert(pos, insertText);
    forceUpdate();  // 通知 React 重新渲染
  },
  [doc, forceUpdate]
);
```

**核心原因：同步 DocumentModel 和 React 状态**

- DocumentModel 的修改不会自动触发 React 更新
- 必须手动调用 `forceUpdate()` 增加 `version`
- `version` 变化 → React 重新渲染 → 界面显示最新内容

### 3. 组件层

#### Editor 组件

##### 文件位置
`src/frontend/components/Editor.tsx`

##### 作用
主编辑器组件，提供类似 VSCode 的编辑界面：
- 行号显示
- 当前行高亮
- 文本编辑区

##### 关键实现

###### 双向绑定

```typescript
const { setText, getText } = useDocumentModel();

<textarea
  value={getText()}
  onChange={(e) => setText(e.target.value)}
/>
```

**数据流：**
1. 用户输入 → `onChange` 事件触发
2. 调用 `setText()` → 更新 DocumentModel → 调用 `forceUpdate()`
3. `version` 增加 → React 重新渲染 → `getText()` 返回最新内容
4. `textarea` 的 `value` 更新 → 界面显示最新文本

###### 行号显示

```typescript
const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

{lineNumbers.map((lineNum) => (
  <div key={lineNum}>{lineNum}</div>
))}
```

- `lineCount` 来自 `useDocumentModel`，自动根据文本行数更新
- 每次文本变化 → `lineCount` 更新 → 行号重新渲染

###### 光标位置追踪

```typescript
const handleSelectionChange = () => {
  const cursorPosition = textarea.selectionStart;  // 浏览器提供的 offset
  const textBeforeCursor = getText().substring(0, cursorPosition);
  const lineNumber = textBeforeCursor.split("\n").length;
  setCurrentLine(lineNumber);
};
```

**为什么需要这样计算？**
- `textarea.selectionStart` 返回的是 offset（偏移量）
- 需要转换为行号才能高亮当前行
- 简单粗暴的方法：数光标前有多少个换行符

#### DocumentViewer 组件

##### 文件位置
`src/frontend/components/DocumentViewer.tsx`

##### 作用
展示文档内容和版本号，提供测试按钮。

```typescript
const { doc, version, setText } = useDocument();

<div>
  <strong>Document Content (v{version}):</strong>
  <pre>{doc.getText()}</pre>
</div>
```

**为什么显示 version？**
- 开发和调试时，直观看到文档更新次数
- 验证 `forceUpdate` 机制是否正常工作

#### EditorExample 组件

##### 文件位置
`src/frontend/components/EditorExample.tsx`

##### 作用
演示 `useDocumentModel` 各种功能的示例组件。

```typescript
const { insert, replaceRange, replaceAll, setText } = useDocumentModel();

const handleReplaceAll = () => {
  const count = replaceAll("line", "LINE");
  alert(`Replaced ${count} occurrences`);
};
```

**为什么需要这个组件？**
- 教学和演示用途
- 测试各种文档操作功能
- 帮助理解 API 使用方式

---

## 数据流详解

### 完整的数据流路径

#### 1. 初始化流程

```
1. index.html 加载
   ↓
2. src/frontend/main.tsx 执行
   ↓
3. 创建 React Root，渲染 <App />
   ↓
4. App.tsx 渲染 <DocumentProvider>
   ↓
5. DocumentProvider 创建 DocumentModel 实例
   ↓
6. DocumentProvider 创建 Context.Provider，提供 value
   ↓
7. 子组件（Editor、DocumentViewer 等）通过 useDocumentModel 或 useDocument 访问 doc
```

#### 2. 用户编辑文本流程

```
用户在 Editor 的 textarea 中输入文字
   ↓
触发 onChange 事件
   ↓
调用 setText(e.target.value)
   ↓
useDocumentModel 的 setText 函数执行
   ↓
调用 doc.setText(newText) - 更新 DocumentModel
   ↓
调用 forceUpdate() - 增加 version
   ↓
version 变化触发 React 重新渲染
   ↓
所有使用 useDocument 或 useDocumentModel 的组件重新渲染
   ↓
Editor 的 getText() 返回最新文本
   ↓
textarea 的 value 更新，显示最新内容
```

#### 3. 使用 insert、replaceRange 等方法的流程

```
用户点击"Insert at Start"按钮
   ↓
调用 insert({line: 0, column: 0}, "Inserted: ")
   ↓
useDocumentModel 的 insert 函数执行
   ↓
调用 doc.insert(pos, insertText) - 更新 DocumentModel
   ↓
调用 forceUpdate() - 增加 version
   ↓
version 变化触发 React 重新渲染
   ↓
所有组件重新渲染，显示最新内容
```

### 值的传递路径

```
DocumentModel 实例
   ↓ (通过 useState)
存储在 DocumentProvider 的 state
   ↓ (通过 Context.Provider 的 value)
传递给所有子组件
   ↓ (通过 useContext)
useDocument 获取 { doc, version, forceUpdate, setText }
   ↓ (通过自定义 Hook 封装)
useDocumentModel 提供便利的 API
   ↓ (通过组件调用)
Editor、DocumentViewer 等组件使用
```

### 为什么 version 要放在 Context 中？

**问题：为什么不直接在 DocumentModel 中维护 version？**

```typescript
// ❌ 如果在 DocumentModel 中维护 version
class DocumentModel {
  private text: string;
  private version: number = 0;
  
  setText(newText: string) {
    this.text = newText;
    this.version++;
  }
}
```

**问题是：React 无法感知 this.version 的变化！**

- React 只能追踪 `useState`、`useReducer` 等 Hook 的状态
- DocumentModel 是普通类，React 无法追踪其内部属性
- 必须将 `version` 放在 React 的 state 中（`useState`）

**正确做法：**
```typescript
// ✅ version 在 React state 中
const [version, setVersion] = useState(0);

// 修改文档后，手动更新 React state
doc.setText(newText);
setVersion(v => v + 1);  // React 能感知到变化
```

---

## 为什么需要这些层级？

### 常见疑问解答

#### Q1: 为什么不直接在组件中创建 DocumentModel？

```typescript
// ❌ 错误做法
function Editor() {
  const [doc] = useState(() => new DocumentModel());
  // ...
}

function DocumentViewer() {
  const [doc] = useState(() => new DocumentModel());
  // ...
}
```

**问题：**
- 每个组件都有自己的 DocumentModel 实例
- 无法共享数据，Editor 的修改 DocumentViewer 看不到
- 需要全局单例

**正确做法：**
- 使用 Context 提供全局单例
- 所有组件共享同一个 DocumentModel

#### Q2: 为什么需要 useDocumentModel，不直接用 useDocument？

```typescript
// 可以直接用 useDocument
const { doc, forceUpdate } = useDocument();
doc.insert({line: 0, column: 0}, "Hello");
forceUpdate();

// 但 useDocumentModel 更方便
const { insert } = useDocumentModel();
insert({line: 0, column: 0}, "Hello");  // 自动 forceUpdate
```

**原因：**
- **封装性**：隐藏 `forceUpdate` 细节，降低使用难度
- **安全性**：防止忘记调用 `forceUpdate` 导致界面不更新
- **便利性**：提供常用属性（`lineCount`、`getText`）

#### Q3: 为什么 DocumentModel 要独立于 React？

**核心原因：关注点分离（Separation of Concerns）**

1. **可测试性**：
   - DocumentModel 的测试不依赖 React
   - 不需要 `@testing-library/react`，直接测试即可
   - 测试更快、更简单

2. **可移植性**：
   - DocumentModel 可以在 Node.js 中使用（见 `src/index.ts`）
   - 可以在 Electron 的 Main Process 中使用
   - 可以在 Web Worker 中使用

3. **可维护性**：
   - 业务逻辑和 UI 逻辑分离
   - 修改 DocumentModel 不影响 React 组件
   - 修改 React 组件不影响 DocumentModel

4. **灵活性**：
   - 未来可以替换为 Vue、Svelte 等框架
   - 核心逻辑不变，只需重写 UI 层

#### Q4: 为什么不用 Redux 或其他状态管理库？

**当前架构的优势：**
- **简单**：只需要一个 Context，无需学习额外的库
- **轻量**：没有额外依赖，打包体积小
- **够用**：对于文档编辑器，Context 完全足够

**什么时候需要 Redux？**
- 状态逻辑非常复杂（多个 reducer）
- 需要时间旅行调试（记录每一步操作）
- 需要中间件（如异步操作、日志记录）

对于当前项目，Context + Hooks 已经足够。

---

## 文件结构说明

### src/document/DocumentModel.ts

**作用：** 核心数据模型

**为什么需要：**
- 存储和操作文本数据
- 提供位置和偏移量转换
- 与 React 无关，可独立使用

**不使用 React 的原因：**
- 保持核心逻辑纯粹
- 便于测试和移植
- 可在非 React 环境使用

### src/frontend/context/DocumentContext.tsx

**作用：** 连接 React 和 DocumentModel

**为什么需要：**
- 提供 DocumentModel 的全局单例
- 管理 `version` 状态，触发 React 更新
- 封装 `forceUpdate` 和 `setText` 方法

**提供的接口：**
```typescript
interface DocumentContextValue {
  doc: DocumentModel;       // 文档实例
  version: number;          // 版本号（触发更新）
  forceUpdate: () => void;  // 强制更新函数
  setText: (text: string) => void;  // 设置文本并更新
}
```

### src/frontend/hooks/useDocumentModel.ts

**作用：** 封装常用操作，提供便利 API

**为什么需要：**
- 自动调用 `forceUpdate()`，无需手动触发
- 提供 `lineCount`、`getText` 等便利属性
- 简化组件代码，降低出错概率

**提供的接口：**
```typescript
interface UseDocumentModelResult {
  doc: DocumentModel;
  getText: () => string;
  lineCount: number;
  insert: (pos: Position, text: string) => void;
  replaceRange: (range: Range, text: string) => void;
  replaceAll: (query: string, replacement: string) => number;
  setText: (text: string) => void;
}
```

### src/frontend/hooks/index.ts

**作用：** Hooks 的统一导出入口

**为什么需要：**
- 简化 import 路径
- 便于管理和维护
- 统一导出接口

**使用示例：**
```typescript
// ✅ 从 index.ts 导入
import { useDocumentModel } from "../hooks/index.js";

// ❌ 不推荐直接导入（路径更长）
import { useDocumentModel } from "../hooks/useDocumentModel.js";
```

### src/frontend/components/Editor.tsx

**作用：** 主编辑器组件

**功能：**
- 显示行号
- 高亮当前行
- 提供文本编辑区
- 追踪光标位置

**为什么需要：**
- 提供类似 VSCode 的编辑体验
- 核心 UI 组件

### src/frontend/components/DocumentViewer.tsx

**作用：** 展示文档内容和版本号

**为什么需要：**
- 调试工具，查看文档状态
- 演示 Context 和 Hook 的使用

### src/frontend/components/EditorExample.tsx

**作用：** 演示 useDocumentModel 的各种功能

**为什么需要：**
- 教学和演示
- 测试各种 API
- 帮助理解使用方式

### src/frontend/App.tsx

**作用：** 根组件，组织整体布局

**为什么需要：**
- 包裹 DocumentProvider，提供全局状态
- 组织各个子组件
- 定义整体布局结构

### src/frontend/main.tsx

**作用：** Web 应用入口

**为什么需要：**
- Vite 的入口文件
- 创建 React Root
- 渲染整个应用

### src/index.ts

**作用：** Node.js 演示入口

**为什么需要：**
- 演示 DocumentModel 在 Node.js 环境的使用
- 说明核心逻辑不依赖 React
- 提供命令行测试（`npm run dev:node`）

### index.html

**作用：** Web 应用的 HTML 入口

**为什么需要：**
- 提供 `<div id="root"></div>` 挂载点
- 加载 `main.tsx` 启动应用
- Vite 自动处理模块化

### vite.config.ts

**作用：** Vite 构建配置

**为什么需要：**
- 配置 React 插件
- 配置构建输出目录
- Vite 需要的标准配置文件

### tsconfig.json

**作用：** TypeScript 编译配置

**为什么需要：**
- 配置 TypeScript 编译选项
- 定义模块解析规则
- 启用类型检查

### vitest.config.ts

**作用：** Vitest 测试配置

**为什么需要：**
- 配置测试环境
- 配置覆盖率报告
- Vitest 需要的配置文件

### package.json

**作用：** 项目配置和依赖管理

**为什么需要：**
- 定义项目名称、版本、脚本
- 管理依赖包
- npm/yarn 的标准配置文件

### eslint.config.js

**作用：** ESLint 代码规范配置

**为什么需要：**
- 统一代码风格
- 检查常见错误和不良实践
- 配合 TypeScript 提供更严格的检查

**关键配置：**
```javascript
// 使用 TypeScript ESLint 推荐规则
...tseslint.configs.recommended

// 强制使用 type 而不是 interface
"@typescript-eslint/consistent-type-definitions": ["error", "type"]
```

### .prettierrc

**作用：** Prettier 代码格式化配置

**为什么需要：**
- 自动格式化代码
- 统一代码风格（缩进、引号、分号等）
- 避免格式化相关的代码审查争议

**关键配置：**
```json
{
  "semi": true,              // 使用分号
  "singleQuote": false,      // 使用双引号
  "trailingComma": "es5",    // ES5 兼容的尾随逗号
  "printWidth": 100          // 行宽 100 字符
}
```

### .editorconfig

**作用：** 编辑器通用配置

**为什么需要：**
- 跨编辑器统一配置（VSCode、WebStorm、Sublime 等）
- 配置缩进、换行符等基础格式
- 确保团队成员使用相同的编辑器设置

---

## 常见开发场景示例

### 场景 1：添加新的文档操作方法

**需求：** 添加一个"删除指定行"的功能

**步骤：**

1. **在 DocumentModel 中添加方法**（`src/document/DocumentModel.ts`）
```typescript
/**
 * 删除指定行
 * @param line 要删除的行号（0-based）
 */
deleteLine(line: number): void {
  const range = this.getLineRange(line);
  this.deleteRange(range);
}
```

2. **在 useDocumentModel 中封装**（`src/frontend/hooks/useDocumentModel.ts`）
```typescript
const deleteLine = useCallback(
  (line: number) => {
    doc.deleteLine(line);
    forceUpdate();  // 触发更新
  },
  [doc, forceUpdate]
);

return {
  // ... 其他方法
  deleteLine,
};
```

3. **在组件中使用**
```typescript
function MyEditor() {
  const { deleteLine } = useDocumentModel();
  
  const handleDeleteFirstLine = () => {
    deleteLine(0);
  };
  
  return <button onClick={handleDeleteFirstLine}>删除第一行</button>;
}
```

### 场景 2：添加撤销/重做功能

**需求：** 实现 Ctrl+Z 撤销和 Ctrl+Y 重做

**思路：**

1. **在 DocumentContext 中维护历史记录**
```typescript
const [history, setHistory] = useState<string[]>([initialText]);
const [historyIndex, setHistoryIndex] = useState(0);

const undo = useCallback(() => {
  if (historyIndex > 0) {
    const newIndex = historyIndex - 1;
    doc.setText(history[newIndex]!);
    setHistoryIndex(newIndex);
    forceUpdate();
  }
}, [historyIndex, history, doc, forceUpdate]);

const redo = useCallback(() => {
  if (historyIndex < history.length - 1) {
    const newIndex = historyIndex + 1;
    doc.setText(history[newIndex]!);
    setHistoryIndex(newIndex);
    forceUpdate();
  }
}, [historyIndex, history, doc, forceUpdate]);
```

2. **每次修改时保存历史**
```typescript
const saveToHistory = useCallback(() => {
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(doc.getText());
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
}, [history, historyIndex, doc]);
```

### 场景 3：添加搜索高亮功能

**需求：** 搜索文本并高亮所有匹配结果

**思路：**

1. **在 DocumentModel 中添加查找方法**
```typescript
/**
 * 查找所有匹配位置
 */
findAll(query: string): Range[] {
  const results: Range[] = [];
  let startIndex = 0;
  
  while (true) {
    const index = this.text.indexOf(query, startIndex);
    if (index === -1) break;
    
    const start = this.offsetToPosition(index);
    const end = this.offsetToPosition(index + query.length);
    results.push({ start, end });
    
    startIndex = index + query.length;
  }
  
  return results;
}
```

2. **在组件中使用**
```typescript
function SearchHighlight() {
  const { doc } = useDocumentModel();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => doc.findAll(query), [doc, query]);
  
  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <div>找到 {matches.length} 个匹配</div>
      {/* 渲染高亮... */}
    </div>
  );
}
```

### 场景 4：优化大文件性能

**问题：** 处理 10000+ 行的大文件时，`lineCount` 计算很慢

**解决方案：在 DocumentModel 中缓存行数**

```typescript
class DocumentModel {
  private text: string;
  private cachedLineCount: number | null = null;

  setText(newText: string): void {
    this.text = newText;
    this.cachedLineCount = null;  // 清除缓存
  }

  getLineCount(): number {
    if (this.cachedLineCount === null) {
      this.cachedLineCount = this.text === "" ? 1 : this.text.split("\n").length;
    }
    return this.cachedLineCount;
  }
  
  // insert, delete 等方法也要清除缓存
  insert(pos: Position, insertText: string): void {
    // ... 原有逻辑
    this.cachedLineCount = null;  // 清除缓存
  }
}
```

### 场景 5：多编辑器实例

**需求：** 在同一页面中显示多个独立的编辑器

**解决方案：每个编辑器用独立的 DocumentProvider**

```typescript
function App() {
  return (
    <div>
      <DocumentProvider initialText="编辑器 1 的内容">
        <Editor />
      </DocumentProvider>
      
      <DocumentProvider initialText="编辑器 2 的内容">
        <Editor />
      </DocumentProvider>
    </div>
  );
}
```

每个 `DocumentProvider` 创建独立的 `DocumentModel` 实例，互不干扰。

---

## 调试技巧

### 1. 查看 version 变化

在 `DocumentContext` 中添加日志：

```typescript
const forceUpdate = useCallback(() => {
  setVersion((v) => {
    console.log("forceUpdate called, version:", v, "->", v + 1);
    return v + 1;
  });
}, []);
```

### 2. 追踪文档修改

在 `DocumentModel` 的每个修改方法中添加日志：

```typescript
setText(newText: string): void {
  console.log("setText called:", { old: this.text, new: newText });
  this.text = newText;
}
```

### 3. 使用 React DevTools

- 安装 React DevTools 浏览器扩展
- 查看组件树和 Hooks 状态
- 追踪 `version`、`doc` 的变化

### 4. 断点调试

在关键位置设置断点：
- `forceUpdate()` 函数中
- `insert()`、`replaceRange()` 等修改方法中
- 组件的 `useEffect` 中

---

## 性能优化建议

### 1. 避免不必要的重新渲染

**问题：** 每次 `version` 变化，所有使用 `useDocumentModel` 的组件都会重新渲染

**解决方案：**
- 使用 `React.memo` 包裹不需要频繁更新的组件
- 只订阅需要的数据（不要滥用 `useDocumentModel`）

```typescript
// ❌ 组件只需要 lineCount，但会在所有修改时重新渲染
function LineCounter() {
  const { lineCount } = useDocumentModel();
  return <div>Lines: {lineCount}</div>;
}

// ✅ 使用 React.memo 优化
const LineCounter = React.memo(function LineCounter() {
  const { lineCount } = useDocumentModel();
  return <div>Lines: {lineCount}</div>;
});
```

### 2. 大文件优化

对于大文件（10000+ 行）：
- 使用虚拟滚动（只渲染可见行）
- 缓存计算结果（如行数、行偏移量）
- 考虑使用 Web Worker 处理文本操作

### 3. 批量更新

**问题：** 连续多次修改会触发多次渲染

**解决方案：** 批量更新

```typescript
// ❌ 触发 3 次渲染
insert({line: 0, column: 0}, "A");
insert({line: 1, column: 0}, "B");
insert({line: 2, column: 0}, "C");

// ✅ 一次性修改，只触发 1 次渲染
const text = doc.getText();
const newText = "A" + text.split("\n")[0] + "\n" +
                "B" + text.split("\n")[1] + "\n" +
                "C" + text.split("\n")[2];
setText(newText);
```

---

## 测试策略

### 1. 单元测试（DocumentModel）

**目标：** 测试核心业务逻辑

**工具：** Vitest（无需 React）

**示例：**
```typescript
describe("DocumentModel", () => {
  it("should insert text at position", () => {
    const doc = new DocumentModel("Hello\nWorld");
    doc.insert({ line: 0, column: 5 }, " TS");
    expect(doc.getText()).toBe("Hello TS\nWorld");
  });
});
```

**覆盖：**
- 所有公共方法
- 边界情况（空文档、单行文档、最后一行等）
- 错误处理（行号越界等）

### 2. 集成测试（Hooks）

**目标：** 测试 React Hooks 的行为

**工具：** Vitest + @testing-library/react（可选）

**策略：**
- 模拟 Hook 的行为，测试底层 DocumentModel 操作
- 测试 `forceUpdate` 是否被正确调用
- 测试 `version` 是否正确更新

### 3. 端到端测试（组件）

**目标：** 测试用户交互流程

**工具：** Playwright、Cypress 等

**场景：**
- 用户输入文本 → 验证文档内容
- 用户点击按钮 → 验证文档修改
- 用户搜索文本 → 验证高亮显示

---

## 关键技术点总结

### 1. React Context 的使用

**问题：** 多个组件需要共享数据

**解决方案：** 使用 Context 提供全局状态

```typescript
// 1. 创建 Context
const DocumentContext = createContext<DocumentContextValue | null>(null);

// 2. 提供 Context
<DocumentContext.Provider value={value}>
  {children}
</DocumentContext.Provider>

// 3. 使用 Context
const context = useContext(DocumentContext);
```

### 2. 强制更新机制

**问题：** DocumentModel 的变化不会触发 React 更新

**解决方案：** 使用 `version` 配合 `forceUpdate`

```typescript
// 维护版本号
const [version, setVersion] = useState(0);

// 强制更新函数
const forceUpdate = useCallback(() => {
  setVersion(v => v + 1);
}, []);

// 修改后调用
doc.setText("new text");
forceUpdate();  // 触发更新
```

### 3. useCallback 和 useMemo 的使用

**目的：** 优化性能，避免不必要的重新渲染

```typescript
// useCallback：缓存函数
const insert = useCallback(
  (pos: Position, text: string) => {
    doc.insert(pos, text);
    forceUpdate();
  },
  [doc, forceUpdate]  // 只在依赖变化时重新创建
);

// useMemo：缓存计算结果
const lineCount = useMemo(
  () => doc.getLineCount(),
  [doc, version]  // 只在依赖变化时重新计算
);
```

### 4. 类型安全

**TypeScript 的优势：**
- 编译时发现错误
- 自动补全和提示
- 重构更安全

**例子：**
```typescript
// Position 和 Range 类型确保参数正确
insert(pos: Position, text: string) => void
replaceRange(range: Range, text: string) => void

// 编译器会检查参数类型
insert({ line: 0, column: 0 }, "Hello");  // ✅
insert({ x: 0, y: 0 }, "Hello");  // ❌ 编译错误
```

### 5. 单一职责原则

每个文件、每个函数都有明确的职责：
- **DocumentModel**：管理文本数据
- **DocumentContext**：管理 React 状态
- **useDocumentModel**：封装便利 API
- **Editor**：显示编辑界面

---

## 学习建议

### 理解顺序

1. **先理解 DocumentModel**
   - 阅读 `src/document/DocumentModel.ts`
   - 运行 `npm run dev:node`，看控制台输出
   - 阅读 `test/DocumentModel.test.ts`，理解每个方法

2. **理解 React Context**
   - 阅读 `src/frontend/context/DocumentContext.tsx`
   - 理解为什么需要 `version` 和 `forceUpdate`
   - 理解 `useCallback` 和 `useMemo` 的作用

3. **理解 useDocumentModel**
   - 阅读 `src/frontend/hooks/useDocumentModel.ts`
   - 对比 `useDocument` 和 `useDocumentModel` 的区别
   - 理解为什么所有修改函数都调用 `forceUpdate`

4. **理解组件**
   - 阅读 `src/frontend/components/Editor.tsx`
   - 理解数据如何从 Context 流到组件
   - 理解用户操作如何触发数据更新

### 动手实践

1. **修改 DocumentModel**
   - 添加新方法（如 `deleteLines(startLine, endLine)`）
   - 运行测试，确保不破坏现有功能

2. **添加新功能到 useDocumentModel**
   - 封装新的便利方法
   - 确保调用 `forceUpdate()`

3. **创建新组件**
   - 使用 `useDocumentModel` 获取数据和方法
   - 实现新的 UI 功能（如搜索、高亮）

---

## 总结

### 核心设计原则

1. **分层架构**：数据层、状态层、逻辑层、UI 层各司其职
2. **关注点分离**：业务逻辑与 UI 逻辑分离
3. **单一职责**：每个文件、每个函数只做一件事
4. **类型安全**：使用 TypeScript 确保编译时类型检查

### 为什么这样设计？

- **易于测试**：核心逻辑可以独立测试
- **易于复用**：DocumentModel 可在多个环境使用
- **易于维护**：职责清晰，修改影响范围小
- **易于扩展**：添加新功能不影响现有代码
- **易于理解**：层次分明，逻辑清晰

### 关键技术点

- **DocumentModel**：纯 TypeScript 核心数据模型
- **Context**：React 全局状态管理
- **version + forceUpdate**：强制更新机制
- **useCallback / useMemo**：性能优化
- **自定义 Hook**：封装业务逻辑

这种架构是现代 Web 应用的标准做法，理解它将帮助你构建更复杂的应用。
