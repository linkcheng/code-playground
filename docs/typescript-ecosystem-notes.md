# TypeScript 生态系统学习笔记

> 学习时间: 2026-03-25
> Node.js 版本: v22.22.1

---

## 一、pnpm 详解

### 1.1 pnpm 是什么？

**pnpm** = performant npm（高性能的包管理器）

核心特点：使用**硬链接和符号链接**，而不是复制文件。

```
npm/yarn 结构:
node_modules/
  ├── lodash/          → 完整副本
  ├── axios/
  │   └── node_modules/
  │       └── lodash/  → 又一份副本（重复！）

pnpm 结构:
.pnpm-store/           → 全局存储，唯一的物理副本
  ├── lodash@4.17.21/  → 只存储一份
node_modules/
  ├── lodash/.pnpm/    → 符号链接到 store
```

### 1.2 pnpm Workspace（分层管理）

```
code-playground/              ← 根 workspace
├── package.json              → 共享依赖、统一脚本
├── pnpm-workspace.yaml       → workspace 定义
│
├── ts-node-demo/             ← 子包 A（独立环境）
│   ├── package.json          → 特有依赖
│   └── tsconfig.json         ← 独立 TS 配置
│
└── react-ts-demo/            ← 子包 B（独立环境）
    ├── package.json          → 特有依赖
    └── tsconfig.json         ← 独立 TS 配置
```

**优势：**
- 依赖去重：`lodash` 只存一份
- 磁盘节省：相比 npm 节省 50%+ 空间
- 安装速度：硬链接比复制快 2-3 倍
- 严格隔离：每个包只能访问自己声明的依赖
- 统一管理：根目录一条命令安装所有依赖

### 1.3 核心配置文件

**pnpm-workspace.yaml**
```yaml
packages:
  - 'ts-node-demo'
  - 'react-ts-demo'
```

**根 package.json**
```json
{
  "private": true,           // 防止意外发布
  "scripts": {
    "dev": "pnpm --filter ts-node-demo run dev"
  }
}
```

**常用命令：**
```bash
pnpm install                    # 安装所有依赖
pnpm --filter <name> add <pkg>  # 为特定子包添加依赖
pnpm --filter <name> run <cmd>  # 运行子包脚本
```

### 1.4 添加子项目流程

**核心原则：脚手架管生成，workspace 管依赖。**

脚手架工具（`pnpm create vite`、`npm init` 等）只负责生成项目模板（文件 + `package.json`），它们不了解你的 monorepo 结构。`pnpm-workspace.yaml` 需要手动维护。

**标准流程：**

```bash
# 步骤 1：用脚手架生成项目
pnpm create vite my-project --template=react-ts

# 步骤 2：注册到 workspace
# 编辑 pnpm-workspace.yaml，在 packages 中添加 'my-project'

# 步骤 3：安装依赖（pnpm 会为所有 workspace 成员统一解析）
pnpm install
```

**为什么步骤 2 不可省略？**

`pnpm install` 只会为 `pnpm-workspace.yaml` 中列出的包安装依赖。如果新项目没有注册，`node_modules` 会缺失，dev server 启动时报 `ERR_MODULE_NOT_FOUND`。

> 实践经验：创建 kanban 子项目时，`pnpm create vite kanban` 成功但 `pnpm dev` 失败，原因就是缺少步骤 2。

---

## 二、配置文件详解

### 2.1 package.json

**`type: "module"` 的作用：**
```json
{
  "type": "module"
}
```

| before (undefined) | after ("module") |
|-------------------|------------------|
| `const fs = require('fs')` | `import fs from 'fs'` |
| `module.exports = {}` | `export default {}` |
| CommonJS 模式 | ES Module 模式 |

**dependencies vs devDependencies：**
```json
{
  "dependencies": {
    "react": "^19.2.4"        // 运行时必需，会被打包
  },
  "devDependencies": {
    "typescript": "~5.9.3",   // 开发时需要，不会被打包
    "vite": "^8.0.1"
  }
}
```

**npm 作用域包（Scoped Packages）：**
```
@scope/name    → 作用域包（属于某个组织/项目）
name           → 普通包
```

| 格式 | 示例 | 含义 |
|------|------|------|
| `@scope/name` | `@dnd-kit/core` | `dnd-kit` 作用域下的 `core` 包 |
| `name` | `react` | 没有作用域的普通包 |

作用：避免命名冲突、表明组织归属。一个库常拆为多个子包（如 `@dnd-kit/core`、`@dnd-kit/sortable`）。安装方式不变：`pnpm add @dnd-kit/core`。

**语义化版本（SemVer）：**

格式：`主版本.次版本.补丁版本`（`major.minor.patch`）
- **主版本**：不兼容的 API 变更
- **次版本**：向后兼容的新功能
- **补丁版本**：向后兼容的 bug 修复

| 前缀 | 示例 | 允许更新的范围 |
|------|------|---------------|
| `^` | `^6.3.1` | `>=6.3.1 <7.0.0`（锁主版本） |
| `~` | `~6.3.1` | `>=6.3.1 <6.4.0`（锁主+次版本） |
| 无 | `6.3.1` | 只能用 `6.3.1`（精确锁定） |

> `^` 是 `npm install` / `pnpm add` 的默认行为。实际安装版本锁定在 `pnpm-lock.yaml` 中，确保团队一致。

### 2.2 tsconfig.json 配置体系

**为什么需要多个配置文件？**
```
tsconfig.json          → 基础配置（引用其他）
├── tsconfig.app.json  → 应用代码（浏览器环境）
└── tsconfig.node.json → 构建脚本（Node.js 环境）
```

**tsconfig.app.json（应用代码）：**
```json
{
  "compilerOptions": {
    "target": "ES2023",                    // 编译目标
    "lib": ["ES2023", "DOM", "DOM.Iterable"], // 可用的 API
    "module": "ESNext",                    // 模块系统
    "moduleResolution": "bundler",         // 模块解析
    "jsx": "react-jsx",                    // JSX 转换
    "strict": true,                        // 严格模式
    "noEmit": true                         // 不生成 .js（Vite 处理）
  }
}
```

**tsconfig.node.json（构建脚本）：**
```json
{
  "compilerOptions": {
    "lib": ["ES2023"],              // 没有 DOM
    "types": ["node"],              // Node.js 类型
    "noEmit": true
  }
}
```

| 配置 | tsconfig.app.json | tsconfig.node.json |
|------|-------------------|-------------------|
| lib | ES2023 + DOM | ES2023 |
| types | vite/client | node |
| include | src | vite.config.ts |
| 环境 | 浏览器 | Node.js |

---

## 三、ESM 和 __dirname

### 3.1 __dirname 是什么？

`__dirname` 是 Node.js 的全局变量，表示当前执行脚本所在目录的绝对路径。

```javascript
console.log(__dirname)   // /project/src/utils
console.log(__filename)  // /project/src/utils/index.js
```

### 3.2 ESM 中的问题

ES Module（`"type": "module"`）中 `__dirname` 不存在：

```javascript
// ❌ 报错: ReferenceError: __dirname is not defined
console.log(__dirname)
```

### 3.3 解决方案

**传统方式（兼容所有版本）：**
```javascript
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
```

**Node.js 20.11.0+ 方式（推荐）：**
```javascript
console.log(import.meta.dirname)   // 等同于 __dirname
console.log(import.meta.filename)  // 等同于 __filename
```

---

## 四、module 和 moduleResolution

### 4.1 module - 编译目标模块系统

```json
"module": "ESNext"
```

控制 TypeScript 编译后的 JavaScript 使用哪种模块语法。

| 值 | 编译后语法 |
|-----|-----------|
| `"CommonJS"` | `const { foo } = require('bar')` |
| `"ESNext"` | `import { foo } from 'bar'` |

### 4.2 moduleResolution - 模块解析策略

```json
"moduleResolution": "bundler"
```

控制 TypeScript 如何解析 `import` 语句。

| 模式 | 用途 | 扩展名要求 |
|------|------|-----------|
| `"node"` | 传统 Node.js | 需要 .js |
| `"node16"`/`"nodenext"` | Node.js 12.20+ | 严格 ESM |
| `"bundler"` | 打包工具 | 不需要扩展名 |

### 4.3 为什么后端也能用 bundler？

```typescript
// moduleResolution: "node"
import { foo } from './utils.js'  // ← 必须写 .js

// moduleResolution: "bundler"
import { foo } from './utils'     // ✅ 不需要扩展名
```

**原因：**
- tsx/ts-node 等工具支持 bundler 模式
- 开发体验更好，配置更少
- 对于不发布的后端项目，兼容性不是首要考虑

---

## 五、构建工具对比

### 5.1 Vite vs Webpack vs tsx

| 维度 | Vite | Webpack | tsx |
|------|------|---------|-----|
| **定位** | 前端构建工具 | 通用模块打包器 | 后端 TS 运行器 |
| **核心** | esbuild + Rollup | JavaScript | esbuild + swc |
| **启动速度** | ⚡ 毫秒级 | 🐢 秒级 | ⚡ 毫秒级 |
| **配置复杂度** | 🟢 低 | 🔴 高 | 🟢 无需配置 |
| **主要用途** | 前端应用 | 复杂打包 | 后端运行 |
| **热更新** | ✅ 极快 | ✅ 较慢 | ❌ 不支持 |

**Vite 工作原理：**
```
开发环境: 浏览器请求 → esbuild 转译 → 返回 ESM
生产环境: Rollup 打包 → Tree-shaking → 优化输出
```

**tsx 工作原理：**
```
.ts 文件 → esbuild 转译 → in-memory JS → Node.js 执行
```

### 5.2 选型建议

```
前端项目 → Vite
复杂构建需求 → Webpack
后端开发 → tsx
```

---

## 六、后端代码运行方式

### 6.1 运行方式总览

| 方式 | 命令 | 是否编译 | 启动速度 |
|------|------|---------|---------|
| **tsx** | `npx tsx file.ts` | ❌ 否 | ⚡ 最快 |
| **编译后运行** | `tsc && node file.js` | ✅ 是 | 🐢 慢 |
| **ts-node** | `npx ts-node file.ts` | ❌ 否 | 🐢 较慢 |
| **Node.js v22** | `node file.ts` | ⚠️ 实验 | 🟢 中 |

### 6.2 node vs tsx

```bash
# Node.js v22 可以直接运行 .ts（实验性）
node file.ts  # ⚠️ 实验性，功能不完整

# tsx 稳定且功能完整
npx tsx file.ts  # ✅ 推荐
```

**Node.js v22 的限制：**
- 无类型检查
- 部分语法不支持（装饰器、enum）
- 无路径别名
- 性能不如 tsx

**最佳实践：**
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

## 七、前后端 TS 代码差异

### 7.1 模块解析

| 差异 | 后端 | 前端 |
|------|------|------|
| 解析方式 | Node.js | 构建工具 |
| CSS 导入 | ❌ | ✅ `import './app.css'` |
| 资源导入 | ❌ | ✅ `import logo from './logo.png'` |
| node 协议 | ✅ `from 'node:fs'` | ❌ |

### 7.2 类型定义

```typescript
// 后端
import type { Request } from 'express'

// 前端
import type { MouseEvent } from 'react'  // DOM 类型
```

### 7.3 文件扩展名

| 扩展名 | 后端 | 前端 |
|--------|------|------|
| `.ts` | ✅ 常用 | ✅ 纯 TS |
| `.tsx` | ❌ | ✅ JSX 组件 |

---

## 八、个人开发约定

```yaml
环境:
  Node.js: v22.22.1
  默认模块: ES Module ("type": "module")

代码风格优先:
  - 优先使用 import/export 语法
  - 避免使用 require/module.exports
  - 使用 import.meta.dirname 代替 __dirname
```

---

## 九、学习洞察

### 9.1 工具演进

```
Webpack (2012) → 解决模块化
Rollup (2015) → 专注库打包
esbuild (2020) → Go 重写，速度飞跃
Vite (2020) → esbuild + Rollup 组合
tsx (2022) → esbuild 取代 ts-node
Node.js v22 → 原生 TS 支持（实验性）
```

### 9.2 配置原则

- **开发体验 vs 生产稳定**: 开发用 tsx，生产用编译
- **分离配置**: 前后端、应用代码 vs 构建脚本分开
- **工具组合**: 不要重写，组合现有工具

### 9.3 ESM 统一趋势

- 前后端都支持 ESM
- 相同的 import/export 语法
- 但环境差异仍需要分离配置

---

## 附录：快速参考

### package.json scripts 模板

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint .",
    "test": "vitest"
  }
}
```

### tsconfig.json 模板（后端）

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2023"],
    "types": ["node"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### tsconfig.json 模板（前端 Vite）

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
```
