# Tailwind CSS + shadcn/ui 学习笔记

> 版本: Tailwind CSS v4 | shadcn/ui v4 (Nova) | 项目: kanban

## Tailwind CSS 与 shadcn/ui 的关系

它们**不是替代关系**，而是互补：

| 维度 | Tailwind CSS | shadcn/ui |
|---|---|---|
| 定位 | 样式工具 | UI 组件集合 |
| 做什么 | 提供 `flex`、`p-4` 等原子 class | 提供 Button、Dialog 等完整组件 |
| 依赖关系 | 独立 | **依赖 Tailwind**（组件用 Tailwind 编写） |
| 安装方式 | npm 包 | CLI 复制源码到项目 |

简单说：**Tailwind 是笔，shadcn 是画**。

---

## Tailwind CSS

### 安装（Vite 项目）

```bash
pnpm add tailwindcss @tailwindcss/vite
```

Vite 配置中添加插件：

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

CSS 入口文件添加导入：

```css
/* src/index.css */
@import 'tailwindcss';
```

> **v4 变化**：不再需要 `tailwind.config.js`、`postcss.config.js`、`npx tailwindcss init`。一切通过 CSS 配置。

### 基本用法

Tailwind 的每个 class 对应一条 CSS 属性：

```html
<!-- 布局 -->
<div class="flex items-center justify-between gap-4">

<!-- 间距 -->
<div class="p-4 mt-2 w-full max-w-lg">

<!-- 响应式：mobile-first -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

<!-- 状态变体 -->
<button class="bg-blue-500 hover:bg-blue-700 focus:ring-2 disabled:opacity-50">

<!-- 暗色模式 -->
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
```

### 自定义主题（v4 方式）

v4 使用 `@theme` 块在 CSS 中定义设计 token：

```css
@import 'tailwindcss';

@theme inline {
  --font-sans: 'Geist Variable', sans-serif;
  --color-primary: oklch(0.205 0 0);
  --color-background: oklch(1 0 0);
  --radius-lg: 0.625rem;
}
```

然后在组件中使用：

```html
<div class="bg-primary text-background rounded-lg">
```

> **对比 v3**：v3 用 `tailwind.config.js` 的 `theme.extend` 配置；v4 直接在 CSS 中声明，更直观。

### 项目实例（kanban）

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css — kanban 的主题配置 */
@import 'tailwindcss';
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@theme inline {
  --font-sans: 'Geist Variable', sans-serif;
  --color-primary: var(--primary);
  --color-background: var(--background);
  --radius-lg: var(--radius);
  /* ... 更多 token */
}
```

---

## shadcn/ui

### 核心理念

- **不是 npm 包**：不通过 `npm install` 安装，而是用 CLI 将源码**复制到你的项目**
- **完全可控**：代码在你手里，可以直接修改
- **基于 Radix UI**：底层使用 Radix 的无障碍原语，保证可访问性
- **Tailwind 编写**：组件样式用 Tailwind class 实现，改起来很容易

### 安装

```bash
# 初始化（检测项目配置，生成 components.json + lib/utils.ts）
pnpx shadcn@latest init

# 添加组件
pnpx shadcn@latest add button
pnpx shadcn@latest add dialog dropdown-menu
```

初始化会生成：

| 文件 | 作用 |
|---|---|
| `components.json` | shadcn 配置（风格、路径别名、图标库） |
| `src/lib/utils.ts` | `cn()` 工具函数 |
| `src/index.css` | 追加 CSS 变量（颜色、圆角等主题 token） |

### cn() 工具函数

这是 shadcn/ui 的核心工具，用于**合并 Tailwind class**：

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

为什么需要它：

```ts
// 不用 cn()：后面的 p-4 不会覆盖前面的 p-2（Tailwind 不保证顺序）
<div className="p-2 customClass">  // customClass 里写了 p-4，结果不确定

// 用 cn()：twMerge 智能合并，p-4 正确覆盖 p-2
<div className={cn("p-2", "p-4")}>  // → "p-4"
```

| 库 | 作用 |
|---|---|
| `clsx` | 条件拼接 class（`clsx("base", isActive && "active")`） |
| `tailwind-merge` | 智能合并冲突的 Tailwind class（`p-2` + `p-4` → `p-4`） |

### 组件使用

以 Button 为例（`src/components/ui/button.tsx`）：

```tsx
import { Button } from "@/components/ui/button"

// 基本用法
<Button>Click me</Button>

// 变体
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// 尺寸
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// 自定义 className（通过 cn() 合并）
<Button className="w-full">Full Width</Button>
```

### 组件结构解析

shadcn 生成的 Button 组件结构：

```
button.tsx
├── buttonVariants (CVA) — 定义所有 variant + size 组合
│   ├── variant: default | outline | secondary | ghost | destructive | link
│   └── size: default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg
├── Button 组件 — 接收 props，用 cn() 合并样式
│   ├── className — 用户自定义 class
│   ├── variant / size — 选择预定义样式
│   └── asChild — 是否将样式应用到子元素（通过 Radix Slot）
```

CVA（class-variance-authority）模式：

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", outline: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})
```

> **为什么不直接用条件 class？** CVA 类型安全，IDE 自动补全 variant 和 size 的值，且与 TypeScript 完美集成。

### 添加更多组件

```bash
# 常用组件
pnpx shadcn@latest add card input label select textarea
pnpx shadcn@latest add dialog alert-dialog
pnpx shadcn@latest add dropdown-menu popover
pnpx shadcn@latest add toast sonner

# 查看所有可用组件
pnpx shadcn@latest add --help
```

---

## 最佳实践

### 1. 用 cn() 而不是模板字符串拼接 class

```tsx
// Bad
<div className={`base-class ${isActive ? 'active' : ''} ${className}`}>

// Good
<div className={cn("base-class", isActive && "active", className)}>
```

### 2. 用语义化的 CSS 变量，不用硬编码颜色

```css
/* Good：通过变量控制主题 */
@theme inline {
  --color-primary: oklch(0.205 0 0);
}

/* Bad：硬编码 */
<div class="bg-[#1a1a1a]">
```

### 3. 不要修改 shadcn 生成文件的内部逻辑，用 className 扩展

```tsx
// Good：外部扩展
<Button className="w-full bg-red-500">Custom</Button>

// Bad：直接改 button.tsx 的默认样式（升级时会丢失）
```

### 4. 暗色模式用 CSS 变量，不用 Tailwind 的 dark: 前缀

```css
/* shadcn 的方式：在 CSS 中定义亮/暗两套变量 */
:root { --primary: oklch(0.205 0 0); }
.dark { --primary: oklch(0.922 0 0); }
```

```tsx
/* 组件代码无需关心主题，自动切换 */
<Button className="bg-primary">  // 自动适配亮/暗
```

### 5. shadcn 升级策略

因为代码在你手里，升级是**选择性**的：

```bash
# 查看某个组件是否有更新
pnpx shadcn@latest diff button

# 覆盖更新（会丢失你的修改）
pnpx shadcn@latest add button --overwrite
```

建议：对 shadcn 组件做少量扩展而非深度修改，这样升级时冲突更少。

---

## 依赖关系图

```
kanban/package.json
├── tailwindcss          ← CSS 引擎
├── @tailwindcss/vite    ← Vite 插件
├── shadcn               ← CLI 工具
├── radix-ui             ← shadcn 底层无障碍原语
├── class-variance-authority  ← 组件变体定义
├── clsx                 ← 条件拼接 class
├── tailwind-merge       ← 智能合并 Tailwind class
├── tw-animate-css       ← 动画工具
├── lucide-react         ← 图标库（Nova 预设）
└── @fontsource-variable/geist  ← Geist 字体
```
