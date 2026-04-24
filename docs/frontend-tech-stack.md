# 前端技术栈学习笔记

> 基于 React 生态的现代前端技术栈全景

## 技术栈概览

| 层级 | 技术 | 核心职责 |
|---|---|---|
| 语言 | TypeScript | 静态类型安全，贯穿全栈 |
| 构建工具 | Vite | 极速冷启动 + HMR |
| UI 框架 | React | 组件化 UI 构建 |
| 路由 | React Router v6 | 客户端路由管理 |
| 客户端状态 | Zustand | 轻量全局状态管理 |
| 服务端状态 | TanStack Query | 数据获取、缓存、同步 |
| 表单 | React Hook Form | 高性能表单管理 |
| 校验 | Zod | 运行时 Schema 验证 |
| 样式 | Tailwind CSS | 原子化 CSS 框架 |
| 组件库 | shadcn/ui (Radix UI) | 可定制 UI 组件 |
| 拖拽 | dnd-kit | 无障碍拖放交互 |

---

## 构建工具 — Vite

- **冷启动快**：利用浏览器原生 ES Module，跳过打包直接加载源码
- **HMR 快**：基于 ESM 的 HMR，修改即刷新，不需要重新打包整个应用
- **生产构建**：使用 Rollup 打包，支持 code splitting、tree shaking

```bash
# 创建项目
npm create vite@latest my-app -- --template react-ts
```

> 详细笔记见 [vite.md](./vite.md)

---

## UI 框架 — React

- **声明式 UI**：描述"UI 应该长什么样"，React 负责高效更新 DOM
- **组件化**：UI 拆分为独立、可复用的组件，组合成页面
- **虚拟 DOM**：通过 diff 算法最小化真实 DOM 操作

> 详细笔记见 [react-hooks.md](./react-hooks.md)

---

## 路由 — React Router v6

- **声明式路由**：用 JSX 描述 URL 与组件的映射关系
- **嵌套路由**：支持 `<Outlet />` 实现布局嵌套
- **v6 变化**：全部 API 改为 Hook 形式，`<Switch>` → `<Routes>`，`component` → `element`

> 详细笔记见 [react-router.md](./react-router.md)

---

## 客户端状态管理 — Zustand

- **极简 API**：`create()` 一个 store，无 Provider 包裹，~1KB gzipped
- **核心模式**：`set` 自动合并状态，返回自定义 Hook，组件中直接解构使用
- **进阶能力**：选择器优化渲染、中间件（persist/devtools/immer）、React 外部读写

> 详细笔记见 [zustand.md](./zustand.md)

---

## 服务端状态管理 — TanStack Query (React Query)

### 核心概念

- **Query**：数据获取，`useQuery` 发起请求
- **Mutation**：数据修改，`useMutation` 发起 POST/PUT/DELETE
- **Query Key**：缓存键，类似 `['todos', { status: 'done' }]`
- **缓存策略**：`staleTime`（何时标记为旧）、`gcTime`（何时清除缓存）

### 基本用法

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 查询数据
function TodoList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(res => res.json()),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>
  return <ul>{data.map(todo => <li key={todo.id}>{todo.title}</li>)}</ul>
}

// 修改数据
function AddTodo() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (newTodo) => fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
  return <button onClick={() => mutation.mutate({ title: 'New' })}>Add</button>
}
```

### 客户端状态 vs 服务端状态

| 维度 | 客户端状态 (Zustand) | 服务端状态 (TanStack Query) |
|---|---|---|
| 来源 | 浏览器本地 | 远程 API |
| 时效性 | 永远最新（自己控制） | 可能过时（需要同步） |
| 持有者 | 前端 | 后端 |
| 工具 | Zustand / useReducer | TanStack Query / SWR |

---

## 表单管理 — React Hook Form

### 核心优势

- **非受控优先**：通过 `register` 注册字段，减少不必要的 re-render
- **高性能**：只在提交或错误时触发渲染，输入过程不渲染
- **体积小**：~8KB gzipped

### 基本用法

```tsx
import { useForm } from 'react-hook-form'

interface FormData {
  username: string
  email: string
}

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = (data: FormData) => console.log(data)

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('username', { required: '用户名必填' })}
        placeholder="用户名"
      />
      {errors.username && <span>{errors.username.message}</span>}
      <button type="submit">提交</button>
    </form>
  )
}
```

---

## 运行时校验 — Zod

- **Schema → Type**：定义 Schema 自动推导 TypeScript 类型
- **运行时校验**：不仅是编译时，运行时也能拦截非法数据
- **与 React Hook Form 集成**：用 `zodResolver` 桥接

```ts
import { z } from 'zod'

const UserSchema = z.object({
  username: z.string().min(3, '至少 3 个字符'),
  email: z.string().email('邮箱格式不正确'),
})

type User = z.infer<typeof UserSchema>

// 与 React Hook Form 集成
import { zodResolver } from '@hookform/resolvers/zod'

const { register, handleSubmit } = useForm<User>({
  resolver: zodResolver(UserSchema),
})
```

> 详细笔记见 [zod-and-ts-types.md](./zod-and-ts-types.md)

---

## 样式方案 — Tailwind CSS

- **原子化 CSS**：每个 class 对应一条 CSS 规则，按需生成，生产包极小
- **v4 变化**：不再需要 `tailwind.config.js`，通过 CSS `@theme` 块配置主题
- **核心模式**：布局 (`flex`/`grid`)、间距 (`p-4`/`mt-2`)、响应式 (`md:`/`lg:`)、状态变体 (`hover:`/`focus:`)

## 组件库 — shadcn/ui (Radix UI)

- **Copy-Paste 哲学**：CLI 复制源码到项目，完全可控，不是 npm 依赖
- **核心工具**：`cn()` 函数合并 class，CVA 模式定义组件变体
- **基于 Radix UI**：内置无障碍支持，与 Tailwind 深度集成

> Tailwind CSS + shadcn/ui 详细笔记见 [tailwind-shadcn.md](./tailwind-shadcn.md)

---

## 拖拽交互 — dnd-kit

- **DndContext**：最外层容器，用 React Context 共享拖拽状态，管理事件
- **useDraggable**：让元素可拖，返回 ref + listeners + transform
- **useDroppable**：让元素可放，返回 ref + isOver（悬停状态）
- **useSortable**：排序场景合体（= draggable + droppable），需额外安装 `@dnd-kit/sortable`
- **核心原则**：dnd-kit 只管 UI 动画，数据变更在 `onDragEnd` 回调中手动处理

> 详细笔记见 [dnd-kit.md](./dnd-kit.md)

---

## 技术选型总结

```
┌─────────────────────────────────────────────┐
│              TypeScript（类型层）              │
├──────────┬──────────┬───────────────────────┤
│  Vite    │  React   │  React Router v6      │
│ (构建)    │ (渲染)    │  (路由)                │
├──────────┴──────────┼───────────────────────┤
│  Zustand            │  TanStack Query       │
│  (客户端状态)        │  (服务端状态)           │
├─────────────────────┼───────────────────────┤
│  React Hook Form    │  Zod                  │
│  (表单)              │  (校验)                │
├─────────────────────┴───────────────────────┤
│  Tailwind CSS + shadcn/ui (样式 + 组件)       │
├─────────────────────────────────────────────┤
│  dnd-kit (拖拽交互)                           │
└─────────────────────────────────────────────┘
```
