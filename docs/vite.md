# Vite 学习笔记

> 学习时间: 2026-04-20
> Vite 版本: v6+

---

## 一、Vite 是什么？

Vite（法语"快"，发音 /vit/）是新一代前端构建工具，由 Vue 作者尤雨溪开发，**框架无关**。

### 1.1 核心问题

传统构建工具（Webpack）启动流程：

```
启动 → 遍历所有模块 → 打包成 bundle → 启动 dev server → 浏览器加载
      └──────── 耗时数秒到数十秒 ────────┘
```

项目越大，启动越慢，因为必须先完成整个应用的打包。

### 1.2 Vite 的解法：双引擎架构

```
开发环境:  浏览器请求 → esbuild 转译（Go 编写，极快） → 返回 ESM
生产环境:  Rollup 打包 → Tree-shaking → Code Splitting → 优化输出
```

| 阶段 | 引擎 | 语言 | 作用 |
|------|------|------|------|
| 开发转译 | esbuild | Go | 单文件按需转译，毫秒级 |
| 生产打包 | Rollup | JS | 整体打包优化，输出高效产物 |

### 1.3 为什么快？

| 特性 | 原理 |
|------|------|
| **冷启动快** | 不打包，浏览器原生 ESM 按需加载源文件 |
| **HMR 快** | 基于模块依赖图，只重新编译修改的模块及其依赖链 |
| **预构建** | 首次启动时用 esbuild 将 CommonJS/UMD 依赖转为 ESM 并缓存 |
| **生产优化** | Rollup 天然支持 tree-shaking，输出更小的 bundle |

### 1.4 与 Webpack 对比

| 维度 | Vite | Webpack |
|------|------|---------|
| 冷启动 | 毫秒级（按需加载） | 秒级（全量打包） |
| HMR | 极快（精确模块级） | 较慢（依赖链重建） |
| 配置复杂度 | 低（约定优先） | 高（显式配置一切） |
| 生态成熟度 | 快速增长 | 非常成熟 |
| 生产打包 | Rollup | 自身 |

---

## 二、创建项目

```bash
# 交互式创建
pnpm create vite

# 指定模板
pnpm create vite my-app --template react-ts
```

**常用模板：**

| 模板 | 说明 |
|------|------|
| `react-ts` | React + TypeScript |
| `vue-ts` | Vue + TypeScript |
| `vanilla-ts` | 原生 TS（无框架） |
| `svelte-ts` | Svelte + TypeScript |

---

## 三、配置文件 vite.config.ts

### 3.1 最小配置（脚手架生成）

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### 3.2 kanban 项目实际配置

```ts
// kanban/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [react(), tailwindcss()],
})
```

逐行解读：
- `defineConfig()` — 提供 TS 类型提示，运行时无任何效果
- `@vitejs/plugin-react` — JSX 转换 + React Fast Refresh（HMR）
- `@tailwindcss/vite` — Tailwind CSS v4 的 Vite 原生插件
- `resolve.alias` — `@` 映射到 `src` 目录，告别 `../../../` 相对路径

---

## 四、常用配置项

### 4.1 resolve — 模块解析

```ts
resolve: {
  // 路径别名
  alias: {
    '@': '/src',
    '@components': '/src/components',
    '@hooks': '/src/hooks',
  },
  // 导入时省略的扩展名（默认已包含 .ts/.tsx/.js/.jsx/.json）
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
}
```

### 4.2 plugins — 插件系统

Vite 插件基于 Rollup 插件接口扩展，是 Vite 的核心扩展机制。

```ts
plugins: [
  react(),                 // @vitejs/plugin-react：JSX + Fast Refresh
  // svgr(),               // vite-plugin-svgr：SVG → React 组件
  // compression(),        // vite-plugin-compression：Gzip/Brotli 预压缩
  // visualizer(),         // rollup-plugin-visualizer：打包体积分析
]
```

**常用插件：**

| 插件 | 用途 |
|------|------|
| `@vitejs/plugin-react` | React JSX 转换 + Fast Refresh |
| `@vitejs/plugin-vue` | Vue SFC 支持 |
| `@tailwindcss/vite` | Tailwind CSS v4 集成 |
| `vite-plugin-svgr` | SVG 作为 React 组件导入 |
| `vite-plugin-compression` | 生产构建预压缩 |

### 4.3 server — 开发服务器

```ts
server: {
  port: 3000,              // 端口号，默认 5173
  open: true,              // 启动时自动打开浏览器
  host: true,              // 监听所有地址（0.0.0.0），局域网可访问
  cors: true,              // 开发服务器启用 CORS

  // API 代理：解决开发环境跨域
  proxy: {
    '/api': {
      target: 'http://localhost:8080',  // 后端服务地址
      changeOrigin: true,               // 修改请求头中的 Origin
      rewrite: (path) => path.replace(/^\/api/, ''),  // 重写路径
    },
  },
}
```

**`server.proxy` 工作原理：**

```
浏览器 → http://localhost:5173/api/users
  ↓ (Vite dev server 代理)
后端   ← http://localhost:8080/users
```

> **注意**：代理仅在开发环境生效。生产环境中前端和 API 通常部署在同一域名下（Nginx 反向代理），不存在跨域问题。

### 4.4 build — 生产构建

```ts
build: {
  outDir: 'dist',          // 输出目录，默认 'dist'
  sourcemap: true,         // 生成 source map（调试用）
  minify: 'esbuild',       // 压缩方式：'esbuild'（快）| 'terser'（兼容性好）
  chunkSizeWarningLimit: 1000,  // chunk 大小警告阈值（KB）

  rollupOptions: {
    output: {
      // 手动分包：控制 chunk 拆分策略
      manualChunks: {
        'vendor': ['react', 'react-dom'],    // 框架单独打包
        'ui': ['@radix-ui/react-dialog'],    // UI 库单独打包
      },
    },
  },
}
```

**为什么需要分包？**

```
不分包：  app.[hash].js (2MB)  → 每次改业务代码，用户要重新下载 2MB

分包后：  vendor.[hash].js (500KB)  → 框架代码，几乎不变，缓存有效
         app.[hash].js (200KB)      → 业务代码，经常变，只重新下载这部分
```

### 4.5 css — CSS 处理

```ts
css: {
  // CSS Modules 配置
  modules: {
    localsConvention: 'camelCase',  // 类名风格：camelCaseOnly | camelCase | dashes
  },
  // CSS 预处理器
  preprocessorOptions: {
    scss: {
      additionalData: `@import "@/styles/variables.scss";`,  // 全局注入 SCSS 变量
    },
  },
}
```

> Vite 内建支持 `.css`、`.module.css`、`.scss`、`.less` 等格式，但预处理器（sass/less）需要额外安装。

### 4.6 preview — 预览生产构建

```ts
preview: {
  port: 4173,              // vite preview 的端口
}
```

```bash
pnpm build && pnpm preview   # 构建后本地预览生产产物
```

---

## 五、环境变量

### 5.1 .env 文件

```
.env                  → 所有环境加载
.env.development      → vite dev 时加载（开发环境）
.env.production       → vite build 时加载（生产环境）
.env.local            → 所有环境加载，被 git 忽略（本地覆盖）
```

### 5.2 前缀规则

```
VITE_开头 → 暴露给客户端（通过 import.meta.env.VITE_xxx 访问）
其他前缀 → 仅服务端可用，不暴露给前端
```

**示例 `.env.development`：**
```bash
VITE_API_BASE_URL=http://localhost:8080    # ✅ 前端可访问
SECRET_KEY=xxx                              # ❌ 前端无法访问
```

**在代码中使用：**
```ts
const apiUrl = import.meta.env.VITE_API_BASE_URL
//                                      ^^^^^^^^^^^^^^^^ 自动有 TS 类型提示
```

### 5.3 TypeScript 类型扩展

```ts
// src/vite-env.d.ts（脚手架自动生成）
/// <reference types="vite/client" />

// 自定义环境变量类型：
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

> **安全提醒**：不要把 API Key 等敏感信息用 `VITE_` 前缀。这些变量会被打包进客户端代码，任何人都能在浏览器源码中看到。

---

## 六、配置频率参考

| 频率 | 配置项 | 场景 |
|------|--------|------|
| **几乎必用** | `plugins`、`resolve.alias` | React 支持 + 路径别名 |
| **常用** | `server.proxy`、`server.port` | 开发时代理 API、指定端口 |
| **按需** | `build.rollupOptions`、`css.preprocessorOptions` | 分包策略、CSS 预处理器 |
| **少用** | `optimizeDeps`、`worker` | 依赖预构建优化、Web Worker |

---

## 七、常用命令

```bash
vite              # 启动开发服务器
vite build        # 生产构建
vite preview      # 预览生产构建
vite optimize     # 手动触发依赖预构建
```

对应 `package.json` scripts：
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

> `tsc -b` 在 `vite build` 之前运行，做类型检查。Vite 自身只做转译不做类型检查（为了速度）。
