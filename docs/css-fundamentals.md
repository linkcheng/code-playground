# CSS 学习笔记

> 基于 `kanban/src/index.css` 实战分析，扩展常见知识点与重难点

---

# 一、基础篇

## 1. 选择器

### 选择器分类

| 类型 | 语法 | 示例 | 特异性 |
|------|------|------|--------|
| 标签 | `tag` | `div`, `p`, `body` | (0, 0, 1) |
| 类 | `.class` | `.card`, `.dark` | (0, 1, 0) |
| ID | `#id` | `#root`, `#social` | (1, 0, 0) |
| 伪类 | `:state` | `:hover`, `:first-child`, `:root` | (0, 1, 0) |
| 伪元素 | `::part` | `::before`, `::after`, `::first-line` | (0, 0, 1) |
| 属性 | `[attr]` | `[type="text"]`, `[href^="https"]` | (0, 1, 0) |
| 通配 | `*` | `*` | (0, 0, 0) |

> 项目实例：`index.css` 使用了标签（`body`, `h1`, `h2`, `p`, `code`）、ID（`#root`, `#social`）、伪类（`:root`）、类（`.dark`）

### 组合选择器

```css
div p { }        /* 后代 — div 内所有 p（不限层级） */
div > p { }      /* 子代 — div 的直接子元素 p */
h1 + p { }       /* 相邻兄弟 — 紧跟 h1 后面的 p */
h1 ~ p { }       /* 通用兄弟 — h1 后面所有的 p */
```

### 优先级（Specificity）

用 **(a, b, c)** 表示，**从左到右逐位比较，不进位**：

```
(1, 0, 0)  #nav           ← ID 级
(0, 1, 0)  .card          ← 类/伪类/属性级
(0, 0, 1)  div            ← 标签/伪元素级
```

**完整排序（从低到高）**：

```
浏览器默认 → 标签 → 类/伪类/属性 → ID → 内联 style → !important
```

同级相同时，后声明的覆盖前面的（就近原则）。

**`:root` vs `html`**：

`:root` 选中 `<html>` 元素，但特异性 `(0, 1, 0)` 高于 `html` 的 `(0, 0, 1)`。CSS 变量定义在 `:root` 上可避免被标签选择器意外覆盖。

> 项目实例：`index.css:8` 用 `:root` 定义全局变量

---

## 2. 盒模型

每个元素是一个矩形盒子：

```
┌───────────────────────────┐
│          margin            │
│  ┌───────────────────────┐ │
│  │       border          │ │
│  │  ┌─────────────────┐  │ │
│  │  │    padding       │  │ │
│  │  │  ┌───────────┐  │  │ │
│  │  │  │  content   │  │  │ │
│  │  │  └───────────┘  │  │ │
│  │  └─────────────────┘  │ │
│  └───────────────────────┘ │
└───────────────────────────┘
```

```css
box-sizing: content-box;   /* 默认，width 只算 content */
box-sizing: border-box;    /* 推荐，width 包含 padding + border */
```

> 项目实例：`index.css:128` `#root` 设置 `box-sizing: border-box`

**常用全局重置**：

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

---

## 3. 排版（Typography）

### `font` 简写

```css
font: [style] [weight] [size/line-height] [family];
/* 实例 */
font: 18px/145% var(--sans);       /* size/line-height 可用斜杠合并 */
font: bold 16px/1.5 sans-serif;
```

> 项目实例：`index.css:25` `font: 18px/145% var(--sans)`

### 字体族栈（Font Stack）

```css
--sans: system-ui, 'Segoe UI', Roboto, sans-serif;
--mono: ui-monospace, Consolas, monospace;
```

浏览器从左到右查找，用第一个可用的字体。最后的 `sans-serif` / `monospace` 是通用族名兜底。

### 字体渲染优化

```css
-webkit-font-smoothing: antialiased;     /* macOS: 字体抗锯齿 */
-moz-osx-font-smoothing: grayscale;
font-synthesis: none;                     /* 禁止浏览器合成粗体/斜体 */
text-rendering: optimizeLegibility;       /* 优化字距和连字 */
```

> 项目实例：`index.css:30-33`

---

## 4. 颜色格式

| 格式 | 示例 | 特点 |
|------|------|------|
| HEX | `#6b6375` | 最常用 |
| RGB/RGBA | `rgba(170, 59, 255, 0.1)` | 支持透明度 |
| HSL | `hsl(264, 100%, 61%)` | 按色相/饱和度/亮度调色 |
| oklch | `oklch(0.205 0 0)` | 感知均匀的色彩空间（见进阶篇） |

> 项目实例：`index.css` 混合使用了 HEX（第 9-11 行）、RGBA（第 15-16 行）、oklch（第 12 行等）

---

## 5. 布局

### Flexbox（一维布局）

```css
display: flex;

/* 方向 */
flex-direction: row | column;

/* 对齐 */
justify-content: flex-start | center | space-between;  /* 主轴 */
align-items: stretch | center;                          /* 交叉轴 */

/* 子项 */
flex: 1;                    /* 填满剩余 */
flex-shrink: 0;             /* 不缩小 */
```

> 项目实例：`index.css:126-127` `#root` 用 `flex-direction: column` 纵向排列

### Grid（二维布局）

```css
display: grid;
grid-template-columns: repeat(3, 1fr);  /* 三等分 */
grid-template-columns: 200px 1fr;       /* 侧边栏 + 内容 */
gap: 16px;
```

### 定位（Position）

| 值 | 行为 |
|----|------|
| `static` | 默认，正常文档流 |
| `relative` | 相对自身偏移，不脱离文档流 |
| `absolute` | 相对最近的定位祖先，脱离文档流 |
| `fixed` | 相对视口，脱离文档流 |
| `sticky` | 滚动到阈值时固定 |

---

## 6. 响应式

### 媒体查询

```css
@media (max-width: 1024px) { }        /* 视口宽度条件 */
@media (prefers-color-scheme: dark) { }  /* 用户偏好暗色 */
```

> 项目实例：`index.css:35-37` 嵌套在 `:root` 内的媒体查询（CSS 嵌套语法），`index.css:99` 独立的暗色媒体查询

### 常用断点

| 断点 | 宽度 | Tailwind 前缀 |
|------|------|--------------|
| sm | ≥ 640px | `sm:` |
| md | ≥ 768px | `md:` |
| lg | ≥ 1024px | `lg:` |
| xl | ≥ 1280px | `xl:` |

---

## 7. 层叠与继承

### 层叠来源（优先级从低到高）

```
用户代理样式 → 作者样式 → 作者 !important → 用户代理 !important
```

### 继承

- **继承的**：`color`、`font-family`、`font-size`、`line-height`、`text-align`、CSS 变量
- **不继承的**：`margin`、`padding`、`border`、`background`、`width`、`height`

```css
.card { color: inherit; }    /* 显式继承 */
.card { color: initial; }    /* 重置为默认值 */
.card { color: unset; }      /* 继承属性→inherit，非继承属性→initial */
```

---

# 二、进阶篇（index.css 进阶知识点）

## 8. CSS 嵌套（Nesting）

原生 CSS 支持在规则内部嵌套媒体查询或其他规则：

```css
:root {
  font-size: 18px;

  @media (max-width: 1024px) {
    font-size: 16px;     /* 等价于外层 @media (max-width: 1024px) { :root { font-size: 16px } } */
  }
}
```

> 项目实例：`index.css:35-37` 和 `index.css:146-149` 都使用了嵌套 `@media`

---

## 9. `@layer` 层级控制

`@layer` 显式控制样式层的优先级，**后声明的 layer 优先级更高**：

```css
@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
  html { @apply font-sans; }
}
```

**为什么需要 `@layer`**：

普通 CSS 中，优先级靠选择器特异性决定。`@layer` 允许你把样式分组，按组控制优先级 — **不管选择器多具体，低优先级 layer 永远输给高优先级 layer**。

```
未分层样式（最高）
  ↓
@layer C（后声明）
  ↓
@layer B
  ↓
@layer A（先声明，最低）
```

> 项目实例：`index.css:256-262` 用 `@layer base` 包裹基础重置样式

---

## 10. `oklch()` 色彩空间

```css
oklch(L C H)

L: 亮度 0~1（0=黑, 1=白）
C: 色度 0~0.4（0=灰, 越大越鲜艳）
H: 色相 0~360（类似 HSL 的色相环）
```

**vs HEX/RGB/HSL**：oklch 是**感知均匀**的 — 亮度值 0.5 在不同色相下看起来同样亮，而 HSL 做不到（HSL 的 50% 亮度在黄色和蓝色下视觉亮度差异很大）。

```css
/* oklch 中 C=0 表示无彩色（灰色） */
--primary: oklch(0.205 0 0);       /* 深灰 */
--primary-foreground: oklch(0.985 0 0);  /* 近白 */
```

> 项目实例：`index.css:39-81` shadcn/ui token 全部用 oklch

---

## 11. 逻辑属性（Logical Properties）

```css
/* 物理方向 — 固定方向，不适配 RTL 语言 */
margin-left: 10px;
border-left: 1px solid;

/* 逻辑方向 — 跟随书写方向自动调整 */
margin-inline-start: 10px;   /* LTR=left, RTL=right */
border-inline: 1px solid;    /* 同时设置左右 */
padding-block: 10px;         /* 上下 */
```

| 逻辑属性 | LTR 等价 | RTL 等价 |
|---------|---------|---------|
| `inline-start` | `left` | `right` |
| `inline-end` | `right` | `left` |
| `block-start` | `top` | `top` |
| `block-end` | `bottom` | `bottom` |

> 项目实例：`index.css:124` `border-inline: 1px solid var(--border)`

---

## 12. 视口单位

| 单位 | 含义 |
|------|------|
| `vh` | 视口高度的 1%（移动端可能包含浏览器地址栏） |
| `svh` | Small Viewport Height — 最小视口（排除地址栏） |
| `lvh` | Large Viewport Height — 最大视口（包含地址栏） |
| `dvh` | Dynamic Viewport Height — 跟随地址栏收起/展开动态变化 |

```css
min-height: 100vh;    /* 移动端可能有滚动条 */
min-height: 100svh;   /* 排除地址栏，稳定的可视高度 */
```

> 项目实例：`index.css:125` `min-height: 100svh`

---

## 13. `color-scheme`

```css
color-scheme: light dark;
```

告诉浏览器这个元素同时支持亮色和暗色方案。浏览器会据此调整：
- 表单控件（`<input>`、`<select>`）的默认样式
- 滚动条颜色
- 系统颜色（如 `Canvas`、`LinkText`）

不设置的话，即使在暗色模式下，原生控件可能仍显示为亮色。

> 项目实例：`index.css:27`

---

## 14. CSS 变量与 Design Token 体系

### 变量定义与覆盖

```css
:root {
  --primary: oklch(0.205 0 0);       /* 亮色模式 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary: oklch(0.922 0 0);     /* 暗色模式覆盖 */
  }
}

.dark {
  --primary: oklch(0.922 0 0);       /* 类名手动切换（覆盖媒体查询） */
}
```

**三层暗色方案**（项目中并存）：
1. `@media (prefers-color-scheme: dark)` — 跟随系统偏好
2. `.dark` 类 — JS 手动切换（如 next-themes）
3. `@custom-variant dark (&:is(.dark *))` — Tailwind v4 的 `dark:` 前缀

> 项目实例：`index.css:8-97`（亮色 token）、`index.css:99-117`（媒体查询暗色）、`index.css:222-254`（类名暗色）

### `var()` 与 `calc()` 组合

```css
--radius: 0.625rem;

/* 派生变量 */
--radius-sm: calc(var(--radius) * 0.6);
--radius-md: calc(var(--radius) * 0.8);
--radius-lg: var(--radius);            /* 不用 calc，直接引用 */
--radius-xl: calc(var(--radius) * 1.4);
```

**好处**：只需改 `--radius` 一个值，所有圆角等比例缩放。

> 项目实例：`index.css:213-219`

### `@theme inline`（Tailwind v4）

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: 'Geist Variable', sans-serif;
}
```

这是 Tailwind CSS v4 的语法，把 CSS 变量注册为 Tailwind token，使得 `bg-background`、`text-foreground` 等 class 可用。`inline` 表示不生成额外 CSS 输出。

> 项目实例：`index.css:179-220`

---

## 15. `filter` 滤镜

```css
filter: invert(1) brightness(2);
```

- `invert(1)` — 颜色完全反转（黑→白，白→黑）
- `brightness(2)` — 亮度翻倍

组合效果：把深色图标变成浅色，适配暗色背景。

> 项目实例：`index.css:115` 暗色模式下反转社交图标颜色

---

# 三、重难点篇（CSS 高频考点）

## 16. BFC（Block Formatting Context）块级格式化上下文

BFC 是一个独立的渲染区域，内部元素的布局不影响外部。

**触发 BFC 的条件**：
- `overflow: hidden / auto / scroll`（非 `visible`）
- `display: flow-root`（最干净的方式）
- `display: flex / grid / inline-block`
- `position: absolute / fixed`
- `float` 不为 `none`

**BFC 解决的问题**：

```css
/* 1. margin 塌陷：父子元素 margin 合并 */
.parent {
  overflow: hidden;   /* 或 display: flow-root */
}

/* 2. 浮动塌陷：父元素高度不包含浮动子元素 */
.container {
  display: flow-root; /* 推荐，无副作用 */
}

/* 3. 阻止元素被浮动元素覆盖 */
.sidebar { float: left; width: 200px; }
.main { overflow: hidden; } /* 形成 BFC，不与 sidebar 重叠 */
```

---

## 17. 层叠上下文（Stacking Context）

`z-index` 只在同一个层叠上下文内比较。**创建层叠上下文的条件**：

- `position` 非 `static` + `z-index` 非 `auto`
- `opacity` < 1
- `transform` 非 `none`
- `filter` 非 `none`
- `will-change` 指定了上述属性
- `isolation: isolate`

**常见坑**：

```html
<div style="z-index: 100">      <!-- 层叠上下文 A -->
  <div style="z-index: 999">    <!-- 在 A 内部最高，但无法超出 A -->
</div>
<div style="z-index: 101">      <!-- 层叠上下文 B -->
</div>
```

B（z-index: 101）永远在 A（z-index: 100）上面，无论 A 内部子元素的 z-index 多大。

**Modal 弹窗为什么用 `z-index: 50`**：确保弹窗在最外层独立层叠上下文中渲染。

> 项目实例：`TaskPage/index.tsx:154` Modal 用 `z-50`

---

## 18. CSS 动画与性能

### `transition`（过渡）

```css
.element {
  transition: property duration timing-function delay;
  /* 实例 */
  transition: background 0.3s ease, transform 0.2s ease-out;
}

.element:hover {
  background: blue;
  transform: scale(1.05);
}
```

### `animation`（关键帧动画）

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.element {
  animation: fadeIn 0.3s ease forwards;
}
```

### `transform`（变换）— 不触发重排

```css
transform: translate(10px, 20px);  /* 平移 */
transform: scale(1.5);             /* 缩放 */
transform: rotate(45deg);          /* 旋转 */
transform: skew(10deg);            /* 倾斜 */
```

### GPU 加速

```css
/* 触发 GPU 合成层（动画更流畅） */
transform: translateZ(0);
will-change: transform;
```

**性能原则**：只对 `transform` 和 `opacity` 做动画 — 这两个属性由合成器处理，不触发重排（layout）或重绘（repaint）。

**渲染管线**：

```
JS/CSS → Style → Layout → Paint → Composite
                     ↑        ↑        ↑
                  重排     重绘     仅这两个属性走这里
                 (慢)     (中)     (快)
```

---

## 19. CSS 常见布局难题

### 等高列

```css
/* 方案 1：Flexbox（推荐） */
.row { display: flex; }
.col { flex: 1; }  /* 自动等高 */

/* 方案 2：Grid */
.row { display: grid; grid-template-columns: 1fr 1fr 1fr; }
```

### 底部 Sticky Footer

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}
main { flex: 1; }
footer { /* 自然在底部 */ }
```

### 文本截断

```css
/* 单行 */
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 多行（-webkit 前缀，主流浏览器均支持） */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

## 20. CSS 单位速查

| 单位 | 类型 | 说明 |
|------|------|------|
| `px` | 绝对 | 像素，最直观 |
| `em` | 相对 | 相对父元素 font-size |
| `rem` | 相对 | 相对 `:root` 的 font-size |
| `%` | 相对 | 相对父元素的对应属性 |
| `vw/vh` | 视口 | 视口宽/高的 1% |
| `svh/lvh/dvh` | 视口 | 小/大/动态视口高度 |
| `fr` | Grid | Grid 剩余空间分配比例 |
| `ch` | 相对 | 字符 "0" 的宽度（等宽字体中很精确） |
| `dpr` | 设备 | `window.devicePixelRatio`，2x 屏幕下 `1 CSS px = 2 物理像素` |

---

## 21. `@import` 与 CSS 加载

```css
@import 'tailwindcss';
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/geist";
```

**注意**：`@import` 必须在文件最前面（除了 `@charset`）。浏览器串行加载 `@import`，但现代构建工具（Vite）会把它们合并到一个文件中，不影响性能。

> 项目实例：`index.css:1-4`

---

## 22. `inset` 简写

```css
/* 等价于 top/right/bottom/left 全部为 0 */
inset: 0;

/* 等价于 */
top: 0; right: 0; bottom: 0; left: 0;
```

常配合 `position: fixed/absolute` 实现全屏遮罩。

> 项目实例：TaskPage Modal 用 Tailwind 的 `inset-0`
