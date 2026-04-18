# Zustand 学习笔记

> 版本: zustand v5 | 项目: kanban

## 为什么选 Zustand

- **极简 API**：`create()` 一个 store，直接 `useStore()` 使用，无 Provider 包裹
- **TS 友好**：类型推导开箱即用
- **体积小**：~1KB gzipped，对比 Redux Toolkit ~11KB
- **灵活中间件**：persist（持久化）、devtools（调试）、immer（不可变更新）

## 基本结构

```
create<类型>((set) => ({ 状态 + 操作 }))
```

- `set` 接收旧 state，返回新 state 的**部分**（自动合并，无需展开所有字段）
- 返回值是一个 Hook，组件中直接调用

## 项目实例（kanban）

### 定义 Store

```ts
// stores/useKanban.tsx
import { create } from "zustand"

interface Board { id: string; name: string }

export const useKanban = create<{
    boards: Board[]
    addBoard: (board: Board) => void
}>((set) => ({
    boards: [],
    addBoard: (board) => set((state) => ({ boards: [...state.boards, board] })),
}))
```

### 组件中使用

```ts
// pages/Board/index.tsx
import { useKanban } from "@/stores/useKanban"

export const Board = () => {
    const { boards, addBoard } = useKanban()  // 解构取值，和 useState 体验一致
    return (
        <div>
            {boards.map((board) => <div key={board.id}>{board.name}</div>)}
            <button onClick={() => addBoard({ id: "1", name: "New Board" })}>
                Add Board
            </button>
        </div>
    )
}
```

## 选择器（Selector）— 性能优化

默认解构取整个 store，任何字段变化都会触发 re-render。用选择器只订阅需要的字段：

```ts
// 只在 boards 变化时 re-render（其他字段变化不触发）
const boards = useKanban((state) => state.boards)

// 用 shallow 比较多字段（避免引用不同导致误触发）
import { shallow } from 'zustand/shallow'
const { boards, addBoard } = useKanban(
  (state) => ({ boards: state.boards, addBoard: state.addBoard }),
  shallow
)
```

## 异步操作

`set` 不要求同步，直接在 async 函数中调用：

```ts
const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  loading: false,
  fetchTodos: async () => {
    set({ loading: true })
    const res = await fetch('/api/todos')
    const todos = await res.json()
    set({ todos, loading: false })
  },
}))
```

## 中间件

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

const useStore = create(
  persist(
    immer<StoreState>((set) => ({
      count: 0,
      // immer 中可以直接 mutate，无需手动展开
      increment: () => set((draft) => { draft.count++ }),
    })),
    { name: 'my-storage' }  // localStorage key
  )
)
```

| 中间件 | 作用 |
|---|---|
| `persist` | 自动持久化到 localStorage/sessionStorage |
| `devtools` | 接入 Redux DevTools 调试 |
| `immer` | 允许直接 mutate（写法更直觉） |

## 在 React 外部使用

```ts
// 非组件文件中直接读写
useKanban.getState().boards          // 读取
useKanban.setState({ boards: [...] }) // 写入
useKanban.subscribe((state) => {      // 监听变化
  console.log('boards changed', state.boards)
})
```

## Zustand vs Redux

| 维度 | Zustand | Redux Toolkit |
|---|---|---|
| 学习曲线 | 低 | 中 |
| 样板代码 | 极少 | 有规范模板 |
| Provider | 不需要 | 需要 `<Provider>` |
| 适用场景 | 中小型项目、简单状态 | 大型项目、复杂状态流 |
