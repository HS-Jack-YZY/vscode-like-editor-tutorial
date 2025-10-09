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

- `npm run dev` 本地运行示例（tsx 直接运行 TypeScript）
- `npm run typecheck` 执行 TypeScript 类型检查
- `npm run lint` 代码规范检查（ESLint）
- `npm run format` 使用 Prettier 格式化
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

## 学习阶段

- 0：环境、仓库、Copilot 工作流
- 1：TypeScript 核心与文档模型（本阶段）
- 后续：React、Electron、Monaco 等
