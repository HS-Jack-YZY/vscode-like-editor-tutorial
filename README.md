# VSCode-like Editor Tutorial

本仓库用于学习 TypeScript / React / Electron，并最终做出一个类 VSCode 的编辑器工具。

## 📖 文档

- **[技术指南（TECHNICAL_GUIDE.md）](./TECHNICAL_GUIDE.md)** - 详细的技术架构文档
  - 项目架构总览和分层设计
  - 核心模块（DocumentModel）详解
  - React 层架构（Context、Hooks、Components）
  - 数据流和状态管理机制
  - 为什么需要多层嵌套
  - 每个文件和函数的作用说明
  - 常见开发场景示例
  - 调试技巧和性能优化
  - 测试策略

## 开发脚本

### 运行应用

- `npm run dev:node` 运行 Node.js 示例（展示 DocumentModel 基础用法）
- `npm run dev:web` 运行 Web 编辑器（Vite 开发服务器，访问 http://localhost:5173）
- `npm run dev:electron` 运行 Electron 桌面应用（开发模式，自动重载）

### 构建

- `npm run build:node` 编译 TypeScript 代码
- `npm run build:web` 构建 Web 应用
- `npm run build:electron` 打包 Electron 桌面应用（生成可分发的安装包）
- `npm run build:electron:dir` 构建 Electron 应用目录（用于测试，不打包成安装包）

### 代码质量

- `npm run typecheck` 执行 TypeScript 类型检查
- `npm run lint` 代码规范检查（ESLint）
- `npm run format` 使用 Prettier 格式化

### 测试

- `npm run test` 运行测试套件（监听模式）
- `npm run test:run` 运行测试套件（单次运行）
- `npm run test:watch` 运行测试套件（监听模式）
- `npm run test:ui` 运行测试套件（UI界面）
- `npm run test:coverage` 运行测试并生成覆盖率报告

## 测试

本项目使用 [Vitest](https://vitest.dev/) 作为测试框架，提供快速、现代的测试体验。

### 测试文件结构

```
test/
├── DocumentModel.test.ts    # DocumentModel 类的单元测试
└── ...                      # 其他测试文件
```

### 运行测试

```bash
# 运行所有测试（监听模式）
npm test

# 运行所有测试（单次运行）
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage

# 使用 UI 界面运行测试
npm run test:ui
```

### 测试覆盖率

当前 DocumentModel 类的测试覆盖率达到 98%+，包括：

- 基本文本操作测试（创建、获取、设置文本等）
- 位置与偏移转换测试
- 文本编辑操作测试（插入、删除、替换）
- 文本查找和替换测试
- 行范围获取测试
- 边界情况和错误处理测试

### 测试原则

- 每个公共方法都应该有对应的测试
- 包含正常情况和边界情况的测试
- 使用中文测试描述，便于理解
- 测试应该独立且可重复运行

## 推荐提交信息格式

- `feat: ...` 新功能或文件
- `fix: ...` 修复
- `chore: ...` 工具链/配置变更
- `refactor: ...` 重构
- `test: ...` 测试相关

## 项目结构

```
src/
├── document/
│   └── DocumentModel.ts         # 文档模型核心类
├── electron/
│   ├── main.ts                  # Electron 主进程
│   ├── preload.ts               # Electron 预加载脚本
│   └── electron.d.ts            # Electron API 类型定义
├── frontend/
│   ├── components/
│   │   ├── Editor.tsx           # 主编辑器组件（带行号和高亮）
│   │   ├── EditorExample.tsx    # Hook 使用示例
│   │   └── DocumentViewer.tsx   # 文档查看器
│   ├── context/
│   │   └── DocumentContext.tsx  # React Context 状态管理
│   ├── hooks/
│   │   ├── useDocumentModel.ts  # 文档操作 Hook
│   │   └── index.ts
│   ├── App.tsx                  # 应用入口组件
│   └── main.tsx                 # React 应用挂载点
├── index.ts                     # Node.js 示例程序
test/
├── DocumentModel.test.ts        # DocumentModel 单元测试
├── DocumentModel.integration.test.ts  # 集成测试
└── useDocumentModel.test.ts     # Hook 测试
```

## 核心功能

### DocumentModel

文本编辑器的核心数据结构，提供：

- 基本文本操作（获取、设置、获取行数、获取指定行）
- 位置与偏移量转换（Position ↔ Offset）
- 文本编辑操作（插入、删除、替换范围）
- 文本查找与替换（查找第一个、查找所有、全部替换）
- 行范围操作

### React 前端

#### Editor 组件

类 VSCode 的编辑器界面，包含：

- 左侧行号栏（Gutter），显示行号
- 当前行高亮显示
- 暗色主题样式
- 与 DocumentModel 实时同步

#### Context + Hooks 架构

- `DocumentContext`：提供单例 DocumentModel 实例和版本管理
- `useDocument`：访问 Context 的基础 Hook
- `useDocumentModel`：封装文档操作的高级 Hook，自动触发 UI 更新

### Electron 桌面应用

项目已集成 Electron，可以作为桌面应用运行：

#### 架构说明

- **主进程（Main Process）**: `src/electron/main.ts` - 负责窗口管理和系统级功能
- **预加载脚本（Preload Script）**: `src/electron/preload.ts` - 在渲染进程和主进程之间提供安全的 IPC 通信
- **渲染进程（Renderer Process）**: React 应用 - 与 Web 版本共享相同的代码

#### 安全特性

- 启用 `contextIsolation` 确保渲染进程无法直接访问 Node.js API
- 禁用 `nodeIntegration` 防止 XSS 攻击
- 通过 `contextBridge` 暴露安全的 API

#### 开发模式

```bash
npm run dev:electron
```

开发模式下会：
- 启动 Vite 开发服务器
- 自动编译 Electron 主进程和预加载脚本
- 启动 Electron 应用并加载开发服务器
- 自动打开开发者工具
- 支持热重载

#### 打包分发

```bash
# 构建未打包的应用目录（用于测试）
npm run build:electron:dir

# 打包成可分发的安装包
npm run build:electron
```

打包支持的平台：
- **macOS**: DMG 和 ZIP
- **Windows**: NSIS 安装器和便携版
- **Linux**: AppImage 和 DEB 包

生成的安装包位于 `release/` 目录。

## 学习阶段

- ✅ 阶段 0：环境、仓库、Copilot 工作流
- ✅ 阶段 1：TypeScript 核心与文档模型
- ✅ 阶段 2：React 前端基础架构
- ✅ 阶段 3：Electron 桌面应用集成
- 🚧 后续：Monaco 编辑器集成、文件系统操作等
