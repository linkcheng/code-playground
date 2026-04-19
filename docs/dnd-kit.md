# dnd-kit 学习笔记

> 基于 @dnd-kit/core 的 React 拖拽交互库，kanban 项目实践

## 核心概念

### 架构概览

```
DndContext（协调层）
├── useDraggable（拖拽源）  → 产生 "可拖" 元素
├── useDroppable（放置目标） → 产生 "可放" 元素
└── onDragEnd 回调          → 处理数据变更
```

**dnd-kit 不修改你的数据**，它只负责 UI 层的拖拽交互，通过回调告诉你"谁拖到了谁上面"，数据变更由你手动处理。

### 四个核心 API

| API | 来源包 | 作用 |
|---|---|---|
| `DndContext` | `@dnd-kit/core` | 最外层容器，管理拖拽状态和事件 |
| `useDraggable` | `@dnd-kit/core` | 让元素可以被拖拽 |
| `useDroppable` | `@dnd-kit/core` | 让元素可以接收放下 |
| `useSortable` | `@dnd-kit/sortable` | 排序场景的合体（= draggable + droppable） |

---

## DndContext — 拖拽作用域

`DndContext` 用 React Context 在子树中共享拖拽状态。只有在同一个 `DndContext` 内的 draggable 和 droppable 才能互相感知。

```tsx
import { DndContext, type DragEndEvent } from '@dnd-kit/core'

function Board() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return  // 拖到空白区域

    const { task, cardId: fromCardId } = active.data.current!
    const toCardId = over.id as string
    moveTask(task, fromCardId, toCardId)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* 所有可拖/可放的组件必须在这个子树中 */}
    </DndContext>
  )
}
```

### 关键 Props

| Prop | 作用 |
|---|---|
| `sensors` | 配置拖拽触发方式（鼠标/触摸/键盘） |
| `collisionDetection` | 判断"拖到了哪里"的算法 |
| `onDragStart` | 拖拽开始回调 |
| `onDragOver` | 拖拽经过其他 droppable 时触发（实时预览） |
| `onDragEnd` | 拖拽结束回调，执行数据变更 |

### 作用域图示

```
┌── DndContext ──────────────────┐
│  ┌─ Card A ─┐  ┌─ Card B ─┐   │
│  │ Task 1   │  │ Task 3   │   │  ← Task 1 可以拖到 Card B ✅
│  │ Task 2   │  │ Task 4   │   │
│  └──────────┘  └──────────┘   │
└────────────────────────────────┘

vs 错误写法（多个独立 Context）：

┌─ DndContext ─┐  ┌─ DndContext ─┐
│ ┌─ Card A ─┐ │  │ ┌─ Card B ─┐ │
│ │ Task 1   │ │  │ │ Task 3   │ │  ← Task 1 无法拖到 Card B ❌
│ └──────────┘ │  │ └──────────┘ │
└──────────────┘  └──────────────┘
```

---

## useDraggable — 可拖拽元素

```tsx
import { useDraggable } from '@dnd-kit/core'

const BoardTask = ({ task, cardId }: { task: TaskProps; cardId: string }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { type: 'task', task, cardId }  // 自定义数据，事件中可读取
  })

  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}     // 注册到 dnd-kit
      style={style}         // 应用拖拽位移
      {...attributes}       // 无障碍属性（role、tabIndex）
      {...listeners}        // 拖拽事件监听（mousedown、touchstart）
    >
      {task.title}
    </div>
  )
}
```

### 返回值

| 返回值 | 作用 |
|---|---|
| `setNodeRef` | 回调 ref，绑定到 DOM 节点 |
| `transform` | 拖拽时的位移对象 `{ x, y }` |
| `listeners` | 事件监听器，启动拖拽 |
| `attributes` | 无障碍属性 |

### 关键点

- **`data` 字段**：通过 `active.data.current` 在 `onDragEnd` 中取回，用于携带上下文信息
- **`translate3d` 而非 `translate`**：强制 GPU 加速，拖拽帧率更稳定
- **标准绑定模式**：一个 `ref` + 三个 `spread`，把普通元素"激活"为可拖拽项

---

## useDroppable — 放置目标

```tsx
import { useDroppable } from '@dnd-kit/core'

const BoardCard = ({ card }: { card: CardProps }) => {
  const { setNodeRef, isOver } = useDroppable({ id: card.id })

  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'bg-green-100' : 'bg-blue-50'}
    >
      {/* tasks... */}
    </div>
  )
}
```

### 返回值

| 返回值 | 作用 |
|---|---|
| `setNodeRef` | 回调 ref，绑定到 DOM 节点 |
| `isOver` | 布尔值，有元素拖到它上方时为 `true` |

`isOver` 常用于添加视觉反馈，如高亮背景色。

---

## useSortable — 排序合体

来自 `@dnd-kit/sortable`，等于 `useDraggable + useDroppable` 的组合，专门用于列表内排序。需要额外安装：

```bash
pnpm add @dnd-kit/sortable @dnd-kit/utilities
```

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SortableItem = ({ id }) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),  // 自动处理 translate + scale
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>...</div>
}
```

与 `useDraggable` 的区别：
- 多了 `transition`（过渡动画）和 `isDragging`（拖拽中状态）
- `transform` 需用 `CSS.Transform.toString()` 处理（包含 scale 变换）
- 需要外层 `<SortableContext items={ids}>` 包裹

---

## 完整数据流

```
useDraggable(data)        ← 拖拽源携带上下文
       ↓
dnd-kit 管理 UI 动画      ← translate3d 位移
       ↓
onDragEnd(active, over)   ← 回调获取源和目标
       ↓
store.moveTask(...)       ← 更新数据（不可变方式）
       ↓
React 重渲染              ← 新的 state 触发 UI 更新
```

### onDragEnd 事件对象

```ts
interface DragEndEvent {
  active: {
    id: string                // useDraggable 的 id
    data: { current: ... }    // useDraggable 的 data 字段
  }
  over: {
    id: string                // useDroppable 的 id
  } | null                    // null 表示拖到空白区域
}
```

---

## kanban 项目中的实践

### 文件职责

| 文件 | dnd-kit 职责 |
|---|---|
| `Board/index.tsx` | `DndContext` + `onDragEnd` 回调 |
| `Board/Card.tsx` | `useDroppable` — 作为跨列放置目标 |
| `Board/Task.tsx` | `useDraggable` — 作为拖拽源 |

### moveTask 实现（不可变方式）

```ts
moveTask: (task, fromCardId, toCardId) =>
  set((state) => {
    if (fromCardId === toCardId) return state  // 拖回原处，跳过
    return {
      cards: state.cards.map((card) => {
        if (card.id === fromCardId) {
          return { ...card, tasks: card.tasks.filter((t) => t.id !== task.id) }
        }
        if (card.id === toCardId) {
          return { ...card, tasks: [...card.tasks, task] }
        }
        return card
      }),
    }
  }),
```

**关键原则**：Zustand 的 `set` 默认不支持直接修改 state。必须返回新对象（`{ ...card, tasks: [...] }`），React 才能检测变化并重渲染。直接 `card.tasks.push()` 或 `card.tasks = ...` 是错误的。
