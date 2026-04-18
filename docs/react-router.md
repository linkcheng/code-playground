# React Router 学习笔记

> 项目: kanban | 版本: react-router v7

## 路由库组成

| 包 | 作用 |
|---|---|
| `react-router` | 路由核心逻辑（匹配 URL、解析参数），与运行环境无关 |
| `react-router-dom` | 在核心之上封装浏览器特有 API（`<Link>`、`<BrowserRouter>` 等） |

> v7 采用"单一包"架构：`react-router-dom` 内部 re-export `react-router`，核心包自动包含。

## 常用 API

| API | 作用 |
|---|---|
| `<BrowserRouter>` | 包裹应用，启用 URL 路由 |
| `<Routes>` / `<Route>` | 定义 URL 路径与组件的映射 |
| `<Link to="/board">` | 无刷新跳转（替代 `<a>` 标签） |
| `useParams()` | 获取 URL 中的动态参数 |

## 创建路由的方式

### 1. createBrowserRouter（推荐）

v6.4+ 引入的**数据路由器**（Data Router），v7 推荐方式。

```tsx
import { createBrowserRouter } from "react-router"

const routes = [
  {
    path: "/",
    element: <Home />,
    loader: async () => {
      const tasks = await fetchTasks()
      return { tasks }
    }
  }
]

export const router = createBrowserRouter(routes)
// 配合 <RouterProvider router={router} /> 使用
```

**核心能力：**

| 功能 | 说明 |
|---|---|
| `loader` | 路由渲染前预加载数据（替代 `useEffect` 取数） |
| `action` | 处理表单提交/数据变更 |
| `errorElement` | 路由级错误边界，自动捕获加载/渲染错误 |
| `lazy` | 按需加载路由组件，实现代码分割 |
| 嵌套路由 | `<Outlet />` 实现布局嵌套 |

### 2. `<BrowserRouter>` + `<Routes>`（传统声明式）

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
</BrowserRouter>
```

- 纯组件声明，不支持 `loader` / `action`
- 适合简单项目

### 3. createMemoryRouter（测试/非浏览器环境）

```tsx
const router = createMemoryRouter(routes)
```

- URL 不变，路由状态保存在内存中
- 适合单元测试或 React Native

## 四种 Router 的历史记录栈对比

核心区别在于**URL 怎么存、怎么变、怎么回退**。

| | Browser | Hash | Memory | Static |
|---|---|---|---|---|
| **URL 存储** | 浏览器地址栏（真实路径） | `#` 后面的部分 | 内存中的数组 | 无 URL（一次性快照） |
| **历史 API** | `history.pushState` | `window.location.hash` | 内部 JS 数组 | 无 |
| **服务器要求** | 需要配置回退到 `index.html` | 不需要 | 不需要 | 服务端渲染时使用 |
| **SEO 友好** | 是 | 否（`#` 后内容不发给服务器） | 否 | 是 |

### createBrowserRouter — HTML5 History API

```
地址栏: example.com/dashboard
原理:   history.pushState() / popstate 事件
```

- URL 干净，没有 `#`
- **需要服务器配置**：所有路径都要回退到 `index.html`，否则刷新 404
- 生产环境首选

### createHashRouter — Hash 模式

```
地址栏: example.com/#/dashboard
原理:   修改 location.hash，监听 hashchange 事件
```

- URL 带 `#`，服务器永远只收到 `#` 前的部分
- **不需要服务器配置**，静态托管（GitHub Pages）也能用
- 缺点：URL 不美观，SEO 不友好

### createMemoryRouter — 内存模式

```
地址栏: 不变（完全无感知）
原理:   内部维护一个数组模拟历史栈: ["/", "/dashboard"]
```

- 浏览器地址栏完全不变
- 适用场景：单元测试、React Native、组件 Storybook

### createStaticRouter — 静态模式（SSR 专用）

```
地址栏: 无（服务端没有浏览器）
原理:   接收一个 request 对象，匹配路由，一次性渲染
```

- 没有"导航"概念，只做一次匹配渲染
- 用于 Node.js 服务端渲染（SSR）
- 配合 `renderToString` 将 React 组件输出为 HTML 字符串

## 历史栈行为示例

```
用户操作: / → /a → /b → 后退 → /c

Browser: 地址栏同步变化，浏览器后退按钮可用
Hash:    同上，但 URL 带 #
Memory:  地址栏不动，内部数组 ["/", "/a", "/c"]
Static:  不支持导航，只渲染请求对应的那个路由
```

## 选型建议

| 场景 | 推荐 |
|---|---|
| Vite / 普通前端项目 | `createBrowserRouter` |
| GitHub Pages / 纯静态托管 | `createHashRouter` |
| 单元测试 / Storybook | `createMemoryRouter` |
| SSR (Next.js / Remix) | 框架内置，或 `createStaticRouter` |
