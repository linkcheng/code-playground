# React 进阶笔记

基础 Hook 用法见 [react-hooks.md](react-hooks.md)

## Hooks 执行阶段横向对比

useMemo / useCallback / useRef / useState / useContext 都发生在 Render 阶段，用来"算"。

callback ref / useLayoutEffect 发生在 Commit 阶段附近，用来"拿 DOM / 读布局 / 同步修正"。

useEffect 发生在浏览器绘制之后，用来"做副作用"。

> **一句话记忆**：Render 算 UI → Commit 改 DOM → LayoutEffect 绘制前处理 → Effect 绘制后处理。

```
1️⃣ 触发更新
   setState / dispatch / context value 变化 / 父组件重渲染 / 外部 store 更新
↓
2️⃣ Render 阶段：执行组件函数，计算新的 UI
   特点：纯计算，可被中断，可被重复执行，可被丢弃

   useState      → 返回本次 render 的 state 快照
   useReducer    → 返回本次 render 的 reducer state
   useContext    → 读取当前 context value
   useMemo       → 依赖不变返回缓存值，依赖变化重新计算
   useCallback   → 依赖不变返回缓存函数，依赖变化生成新函数
   useRef        → 返回稳定的 ref 对象，修改 current 不触发 render
↓
3️⃣ Commit 阶段：同步更新真实 DOM，不可中断

   useInsertionEffect → DOM mutation 前，主要给 CSS-in-JS 使用

   React mutation     → 写入、更新、删除真实 DOM

   Callback ref       → DOM 节点挂载/卸载时调用 ref(node) / ref(null)

   useLayoutEffect    → DOM 更新后，浏览器绘制前同步执行
                         可读取布局，可同步修改，会阻塞绘制
↓
4️⃣ 浏览器绘制 Browser Paint
   浏览器绘制页面，用户看到结果
↓
5️⃣ 绘制完成后（异步）Passive Effects
   useEffect          → 绘制后异步执行
                         适合请求、订阅、定时器、日志等副作用
```

**示例代码**——用 `console.log` 验证各阶段执行顺序：

```tsx
function Demo() {
  const [count, setCount] = useState(0);
  const divRef = useRef(null);

  console.log("render", count);                         // ② Render 阶段

  useLayoutEffect(() => {
    console.log("useLayoutEffect", divRef.current.textContent); // ④ Commit（DOM 后）
  });

  useEffect(() => {
    console.log("useEffect", count);                    // ⑥ 绘制后（异步）
  });

  return (
    <div>
      <div
        ref={(node) => {
          console.log("callback ref", node);            // ③ Commit（DOM 写入时）
          divRef.current = node;
        }}
      >
        count: {count}
      </div>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

首次挂载时控制台输出（验证上方的时序图）：

```
render 0                                  ← ② Render 阶段执行
callback ref <div>count: 0</div>          ← ③ React 写入 DOM 后触发 ref 回调
useLayoutEffect count: 0                  ← ④ DOM 更新完成，可读取 textContent
useEffect 0                               ← ⑥ 浏览器绘制后才执行
```

点击 "+1" 按钮后输出（更新流程）：

```
render 1                                  ← 重新执行组件函数体
callback ref <div>count: 1</div>          ← 旧节点卸载(null) + 新节点挂载
useLayoutEffect count: 1                  ← 读取到更新后的 DOM
useEffect 1                               ← 绘制后异步执行
```

> 注意：内联 ref 回调在每次渲染都会执行（旧节点 `null` → 新节点 `node`）。用 `useCallback` 包裹或改用 `useRef` 对象可避免重复触发。

| Hook | 执行阶段 | 阻塞绘制? | 典型用途 |
|---|---|---|---|
| `useState` / `useReducer` | Render | — | 声明状态，参与 JSX 生成 |
| `useContext` | Render | — | 读取跨层级数据 |
| `useMemo` / `useCallback` | Render | — | 缓存值/函数引用 |
| `useRef` | Render | — | 获取可变引用 |
| `useInsertionEffect` | Commit（DOM 前） | 是 | CSS-in-JS 注入样式 |
| Callback ref | Commit（DOM 写入时） | 是 | 测量 DOM、初始化第三方库 |
| `useLayoutEffect` | Commit（DOM 后，绘制前） | **是** | 读取布局、同步修改 DOM |
| `useEffect` | 绘制后（异步） | **否** | 数据请求、事件监听、日志 |

> **经验法则**：99% 场景用 `useEffect`。只有需要同步读取/修改 DOM 布局（tooltip 定位、动画初始值）时才用 `useLayoutEffect`——它阻塞绘制会影响性能。Render 阶段可被 Concurrent Mode 中断，Commit 阶段不可中断。

## Commit 阶段三个同步方法详解

Commit 阶段是 React 将虚拟 DOM 写入真实 DOM 的过程，**不可中断**。该阶段按严格顺序执行三个方法：

### useInsertionEffect — DOM 变更前注入样式

```tsx
useInsertionEffect(() => {
  // 在 React 写入真实 DOM 之前执行
  // 适用于 CSS-in-JS 库注入 <style> 标签
  const style = document.createElement('style')
  style.textContent = `.dynamic-class { color: red; }`
  document.head.appendChild(style)
  return () => document.head.removeChild(style)
}, [])
```

- **执行时机**：DOM 变更之前
- **用途**：CSS-in-JS 库（styled-components、Emotion）注入样式规则
- **为什么比 useLayoutEffect 更早**：确保样式在 DOM 写入时已就绪，避免无样式闪烁（FOUC）
- **99% 的应用不需要直接使用**——由 CSS-in-JS 库内部调用

### Callback ref — DOM 节点绑定通知

```tsx
function Measure() {
  const [height, setHeight] = useState(0)

  // ref 回调：当 DOM 节点挂载/卸载时调用
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setHeight(node.getBoundingClientRect().height)
    }
  }, [])

  return <div ref={measureRef}>内容高度：{height}px</div>
}
```

- **执行时机**：React 写入真实 DOM 时，节点被绑定/解绑的瞬间
- **用途**：测量 DOM 尺寸、初始化第三方库（图表、地图等）、聚焦输入框
- **优势**：比 `useEffect` + ref.current 更早拿到节点；在并发特性下，callback ref 保证在 DOM 挂载时同步调用，而 `useEffect` 可能因中断而延迟

### useLayoutEffect — DOM 变更后、绘制前同步执行

```tsx
function Tooltip({ children }) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    // DOM 已更新，但浏览器还没绘制
    const rect = ref.current!.getBoundingClientRect()
    // 同步修改 DOM，避免视觉闪烁
    setPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    })
  }, [/* 依赖 */])

  return <div ref={ref}>{children}</div>
}
```

- **执行时机**：DOM 变更完成后、浏览器绘制（Paint）之前
- **用途**：读取布局信息（尺寸、位置）并同步修改 DOM，避免视觉闪烁
- **注意**：同步执行，会阻塞绘制，过度使用会导致页面卡顿

### 三者对比

| 特性 | useInsertionEffect | Callback ref | useLayoutEffect |
|---|---|---|---|
| **执行顺序** | ① DOM 前 | ② DOM 写入时 | ③ DOM 后、绘制前 |
| **能读 DOM?** | 否 | 是（当前节点） | 是（所有更新） |
| **能改 DOM?** | 不建议 | 可以 | 可以 |
| **阻塞绘制?** | 是 | 是 | 是 |
| **典型场景** | CSS-in-JS 注入 | DOM 测量、初始化 | 布局修正、防闪烁 |
| **日常使用频率** | 极低 | 中等 | 偶尔 |

```
Commit 阶段完整时序：

  useInsertionEffect 回调执行
          ↓
  React 将虚拟 DOM 写入真实 DOM
          ↓
  Callback ref(node) 被调用        ← 节点刚挂载
          ↓
  useLayoutEffect 回调执行         ← DOM 已更新，可读取布局
          ↓
  ── 浏览器绘制（Paint）──         ← 用户看到画面
          ↓
  useEffect 回调执行（异步）       ← 不阻塞绘制
```

> **选型原则**：默认用 `useEffect`（异步不阻塞）；需要读取 DOM 布局并同步修改用 `useLayoutEffect`；CSS-in-JS 库开发用 `useInsertionEffect`；只需在节点挂载时执行一次操作用 callback ref。

## flushSync — 强制同步刷新

React 默认**批量处理** state 更新——同一个事件循环内的多个 `setState` 只触发一次渲染。`flushSync` 打破批量机制，强制立即同步执行所有待处理的更新。

```tsx
import { flushSync } from 'react-dom'

function handleClick() {
  // 默认：两次 setState 合并为一次渲染
  setCount(1)
  setFlag(true)
  // → React 批量处理，只渲染 1 次

  // flushSync：强制立即刷新
  flushSync(() => {
    setCount(1)
  })
  // → DOM 已更新完毕，可以同步读取
  document.querySelector('.count')?.textContent  // "1"

  setFlag(true)  // 这次的更新留到下一批
}
```

执行时序对比：

```
普通批量更新：setState(A) → setState(B) → setState(C) → 一次性渲染
flushSync：   flushSync(() => setState(A)) → 立即渲染 → DOM 已更新 → setState(B) 等下一批
```

典型场景：

```tsx
// 第三方库需要读取更新后的 DOM
flushSync(() => { setSelectedId(id) })
document.getElementById(`item-${id}`)?.scrollIntoView({ behavior: 'smooth' })
```

| 要点 | 说明 |
|---|---|
| **慎用** | 绕过批量更新 = 可能多渲染，影响性能 |
| **同步执行 layout effect** | `flushSync` 内的更新完成后，会同步执行 `useLayoutEffect` |
| **主要用途** | 与第三方库（动画、滚动、测量）的 DOM 互操作 |
| **99% 场景不需要** | React 18 的自动批量更新已解决大部分性能问题 |

> React 18 通过 `createRoot` 实现了**所有场景自动批量更新**（包括 setTimeout、Promise、原生事件），`flushSync` 是退出批量更新的"紧急出口"。

## 命令式 vs 声明式 — 用视频播放器对比

"谁负责同步 DOM"是 React 开发中的核心决策。下面用同一个视频播放器功能，对比两种风格：

### 命令式（Imperative）— 事件处理器手动操控 DOM

在事件处理器中**直接调用** DOM API，手动维护状态与 DOM 的一致性。

```tsx
import { useState, useRef } from 'react';

export default function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const ref = useRef(null);

  function handleClick() {
    const nextIsPlaying = !isPlaying;
    setIsPlaying(nextIsPlaying);
    // 直接操控 DOM — "你告诉我做什么"
    if (nextIsPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  }

  return (
    <>
      <button onClick={handleClick}>
        {isPlaying ? '暂停' : '播放'}
      </button>
      <video
        width="250"
        ref={ref}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source
          src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          type="video/mp4"
        />
      </video>
    </>
  );
}
```

- 在 `handleClick` 里手动 `ref.current.play()` / `pause()`
- 需要额外用 `onPlay` / `onPause` 事件兜底（浏览器右键菜单、键盘快捷键等场景）
- **问题**：状态与 DOM 的同步路径分散在多处，容易遗漏

### 声明式（Declarative）— Effect 自动同步外部系统

把"状态 → DOM"的同步逻辑收进 `useEffect`，让 React 负责"状态变了就去同步"。

```tsx
import { useState, useRef, useEffect } from 'react';

function VideoPlayer({ src, isPlaying }) {
  const ref = useRef(null);

  useEffect(() => {
    // Effect 负责"状态变了就同步 DOM" — 只有一条同步路径
    if (isPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  }, [isPlaying]);

  return <video ref={ref} src={src} loop playsInline />;
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? '暂停' : '播放'}
      </button>
      <VideoPlayer
        isPlaying={isPlaying}
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
    </>
  );
}
```

- `useEffect` 成为唯一的同步通道，无论 `isPlaying` 怎么变、从哪里变都会触发
- 状态提升到父组件，`VideoPlayer` 变为受控组件，可复用性更强
- 依赖数组 `[isPlaying]` 确保只在 `isPlaying` 变化时同步

### 两种风格对比

| 维度 | 命令式 | 声明式 |
| --- | --- | --- |
| **DOM 操作位置** | 事件处理器里直接调用 | `useEffect` 里统一同步 |
| **同步路径** | 分散（事件 + DOM 事件兜底） | 集中（只有 Effect 一条路） |
| **组件模式** | 非受控（状态在组件内） | 受控（状态由外部 prop 控制） |
| **可复用性** | 低（状态与逻辑耦合） | 高（纯展示 + prop 驱动） |
| **遗漏风险** | 高（新场景需要补新的同步点） | 低（状态变了 Effect 自动跑） |

> **React 推荐模式**：事件处理器负责"响应交互"，Effect 负责"同步外部系统"。当你发现自己在多个地方写相同的 DOM 操作时，就该把它收进 `useEffect`。

## Form Action — 表单提交新模式（React 19）

`action` 替代 `onSubmit`，直接接收函数处理表单提交：

```tsx
<form action={handleAction} method="POST">
    <input name="username" />
    <button type="submit">Submit</button>
</form>

// handleAction 自动接收 FormData，无需手动 e.preventDefault()
const handleAction = (formData: FormData) => {
    formData.get('username')  // 通过 name 属性获取值
}
```

### useActionState — 管理 action 的返回值

```tsx
const [state, submitAction, isPending] = useActionState(handleAction, null)
//      ^^^^^  action 的返回值（初始为 null）
//                ^^^^^^^^^^^  包装后的 action，传给 <form action={}>
//                              ^^^^^^^^^^ 是否正在执行

// action 函数签名多一个 prevState 参数
const handleAction = async (prevState, formData: FormData) => {
    await delay(1000)
    return { success: true }  // 返回值成为 state 和下次的 prevState
}
```

### useFormStatus — 在子组件中获取表单状态

```tsx
const { pending, data, method } = useFormStatus()
//      ^^^^^^^ 是否提交中
//               ^^^^ 提交的 FormData

// ⚠️ 必须用在 <form> 内部的子组件中（通过 Context 获取）
<form action={submitAction}>
    <MyButton />  {/* ✅ 子组件内可以用 */}
</form>
```

### 完整流程

```
点击提交 → submitAction 触发 → isPending=true → MyButton 显示 "Submitting..."
→ handleAction 执行（await delay 模拟请求）→ 返回结果 → state 更新 → isPending=false
```

## Suspense + use — 异步数据处理（React 19）

### use — 在组件中读取 Promise

```tsx
const Message = ({ messagePromise }) => {
    const message = use(messagePromise)  // Promise 未 resolve 时会"抛出异常"
    return <p>{message}</p>
}
```

### Suspense — 捕获异常，显示 loading

```tsx
<Suspense fallback={<p>loading...</p>}>
    <Message messagePromise={fetchMessage()} />
</Suspense>
```

流程：`use()` 发现 Promise 未 resolve → throw → Suspense 捕获 → 显示 fallback → Promise resolve → 重新渲染 → `use()` 返回值。

> Promise 基础知识（resolve、函数引用 vs 函数调用）见 [js-ts-fundamentals.md](js-ts-fundamentals.md)

## zustand（全局状态管理）与 useState 的区别

|                    | useState               | zustand (useAuthStore)     |
| ------------------ | ---------------------- | -------------------------- |
| **作用域**   | 单个组件内             | 全局，所有组件共享         |
| **跨组件**   | 需要一层层 props 传递  | 直接用，无需传递           |
| **持久化**   | 组件卸载就没了         | store 一直在               |
| **函数引用** | 每次渲染可能创建新引用 | store 中的函数引用始终不变 |

zustand store 中的函数引用不变，因为函数在 `create()` 时创建，存储在 store 对象上，不会重新创建：

```tsx
// 引用不变 → effect 只执行一次
const restore = useAuthStore((s) => s.restore);
useEffect(() => { restore(); }, [restore]);
```

---

## useSyncExternalStore — 订阅外部数据源

React 18 引入的 Hook，用于**安全地订阅 React 外部的数据源**（浏览器 API、第三方状态库、全局变量），解决 Concurrent Mode 下的"撕裂"问题。

### 传统方式的问题

用 `useEffect` + `useState` 同步外部数据，在并发渲染中可能**同一次渲染读到不同值**：

```tsx
// ❌ 并发渲染中可能不一致
const [width, setWidth] = useState(window.innerWidth);
useEffect(() => {
  const handler = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

### API 签名

```tsx
const value = useSyncExternalStore(
  subscribe,         // (callback) => unsubscribe  — 注册变更回调
  getSnapshot,       // () => value                — 读取当前值
  getServerSnapshot? // () => value                — SSR 时的 fallback（可选）
);
```

### 示例：订阅 window.innerWidth

```tsx
function useWindowWidth() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerWidth,
    () => 0  // SSR fallback
  );
}
```

### 示例：订阅自定义外部 Store

```tsx
const store = {
  listeners: new Set<() => void>(),
  data: { count: 0 },
  subscribe(callback: () => void) {
    store.listeners.add(callback);
    return () => store.listeners.delete(callback);
  },
  getSnapshot() { return store.data; },
  increment() {
    store.data.count++;
    store.listeners.forEach(l => l()); // 通知所有订阅者
  }
};

function Counter() {
  const { count } = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return <button onClick={store.increment}>{count}</button>;
}
```

### 底层基石 — Zustand 内部原理

```tsx
// Zustand 的 useStore 简化原理
function useStore<T>(store, selector) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState())
  );
}
```

### 注意事项

- **`getSnapshot` 引用稳定性**：必须每次返回相同引用（`===` 比较），值没变但返回新对象会触发无限重渲染
- **`getServerSnapshot`**：SSR 时提供安全 fallback，避免 `window is not defined` 错误
- **适用场景**：同步 React 外部的值用 `useSyncExternalStore`；发起异步请求用 `useEffect` + 竞态处理

---

## 自定义 Hook 实践

自定义 Hook 是用基础 Hook（useState、useEffect、useCallback 等）**组合**出来的可复用逻辑。

### SSR 环境检测 — `typeof window !== 'undefined'`

浏览器有全局 `window` 对象，Node.js / SSR 环境没有。`typeof` 对不存在的变量安全返回 `'undefined'`（直接引用会抛 `ReferenceError`），所以用 `typeof` 检测：

```tsx
// ❌ 直接引用未声明变量 → ReferenceError
if (window) { ... }

// ✅ typeof 安全检测
if (typeof window !== 'undefined') { ... }
```

三种常见场景：

```tsx
// 场景一：模块顶层 — 避免 SSR 阶段直接崩溃
const isBrowser = typeof window !== 'undefined';
const initialTheme = isBrowser ? localStorage.getItem('theme') : 'light';

// 场景二：Hook 内部 — useState 初始化函数中访问浏览器 API
const [size, setSize] = useState(() =>
  typeof window !== 'undefined'
    ? { width: window.innerWidth, height: window.innerHeight }
    : { width: 0, height: 0 }
);

// 场景三：useLayoutEffect 替代 — SSR 下 useLayoutEffect 会报警告
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
```

> **注意**：`useEffect` 本身不会在 SSR 时执行（只在客户端挂载后运行），所以 `useEffect` 内部的浏览器 API 访问通常不需要额外检测。真正需要的是 **模块顶层**、**`useState` 初始化函数** 和 **`useLayoutEffect`** 这三个地方。

### useLocalStorage — 持久化状态

#### 方案一：useEffect 被动同步

```tsx
export const useLocalStorage = <T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        const storeValue = localStorage.getItem(key)
        return storeValue !== null ? JSON.parse(storeValue) : defaultValue
    })

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state))
    }, [key, state])

    return [state, setState]  // 返回原生 setState，任何方式修改都能同步
}
```

#### 方案二：useCallback 主动同步

```tsx
export const useLocalStorageWithCallback = <T>(key: string, defaultValue: T) => {
    const [state, setState] = useState<T>(() => {
        const storeValue = localStorage.getItem(key)
        return storeValue !== null ? JSON.parse(storeValue) : defaultValue
    })

    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            setState((prev) => {
                const newValue = value instanceof Function ? value(prev) : value
                localStorage.setItem(key, JSON.stringify(newValue))
                return newValue
            })
        },
        [key]
    )

    return [state, setValue] as const  // 调用即同步，无中间态
}
```

#### 两种方案对比

|                    | useEffect 被动同步              | useCallback 主动同步                      |
| ------------------ | ------------------------------- | ----------------------------------------- |
| **返回值**   | 原生 `setState`，类型完整     | 自定义 `setValue`，需手动处理函数式更新 |
| **同步时机** | 渲染后才写 localStorage         | 调用时立即写                              |
| **防御性**   | 强 — 任何方式改 state 都能同步 | 弱 — 绕过 setValue 直接改就不同步        |
| **多余写入** | 初始化也会触发 effect 写一次    | 只在主动调用时写                          |

> **实际项目推荐 useEffect 方案**：更简单、防御性更强，渲染延迟几乎感知不到。

### useAsync — 异步请求封装

```tsx
export const useAsync = <T>(asyncFunction: () => Promise<T>) => {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const execute = useCallback(() => {
        setLoading(true)
        setData(null)
        setError(null)

        return asyncFunction()
            .then((response) => { setData(response); setLoading(false) })
            .catch((error) => { setError(error); setLoading(false) })
    }, [asyncFunction])

    return { execute, loading, data, error }
}

// 使用：T 自动推断为 User
const { data, error } = useAsync(() => fetchUser(1))
// data: User | null,  error: Error | null
```

### 异步竞态 — 四种处理模式

当 `useEffect` 中的异步请求依赖会变化的值时，快速切换会导致"后到的旧响应覆盖新响应"：

```
时间线 →
─────────────────────────────────────────────────
  用户选择 Alice    fetchBio('Alice') 发出请求
  用户切换到 Bob    fetchBio('Bob')   发出请求
                    Bob 先返回 → setBio(bobResult)   ✓
                    Alice 后返回 → setBio(aliceResult) ✗ 竞态！
─────────────────────────────────────────────────
```

#### 模式一：ignore 标志

```tsx
useEffect(() => {
  let ignore = false;        // 每次 effect 执行，创建新的局部变量
  setBio(null);              // 立即清空，显示"加载中"
  fetchBio(person).then(result => {
    if (!ignore) {           // 仅当未被取消时才更新
      setBio(result);
    }
  });
  return () => {
    ignore = true;           // cleanup：标记旧 effect 为"已过期"
  }
}, [person]);
```

**执行流**（person 从 Alice → Bob）：

1. cleanup 先执行 → Alice 的 `ignore = true`
2. 新 effect 执行 → Bob 的 `ignore = false`
3. Alice 响应到达 → `ignore` 为 true → 跳过
4. Bob 响应到达 → `ignore` 为 false → 更新

#### 模式二：AbortController — 中断请求

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/bio?name=${person}`, { signal: controller.signal })
    .then(res => res.json())
    .then(data => setBio(data))
    .catch(err => {
      if (err.name !== 'AbortError') throw err; // 忽略取消错误
    });
  return () => controller.abort(); // 真正中断网络请求
}, [person]);
```

**优势**：请求被真正取消，不浪费带宽。适合大文件下载、流式响应。AbortController 是 Web 标准 API，任何支持 `signal` 的异步操作都能用（如 `ReadableStream`）。

#### 模式三：版本号/序列号

```tsx
const versionRef = useRef(0);

useEffect(() => {
  const ver = ++versionRef.current; // 每次递增
  fetchBio(person).then(result => {
    if (ver === versionRef.current) { // 只接受最新版本
      setBio(result);
    }
  });
}, [person]);
```

**优势**：不用 cleanup 函数，逻辑集中在回调内。适合单次触发的场景（如按钮点击）和非 React 场景（DOM 事件、Web Worker 通信）。

#### 模式四：库方案 — React Query / SWR

```tsx
// React Query 自动处理竞态 + 缓存 + 重试 + 过期
const { data: bio } = useQuery({
  queryKey: ['bio', person],
  queryFn: () => fetchBio(person),
});
```

**优势**：零样板代码，内置竞态处理、缓存去重、后台刷新。

#### 四种模式对比

| 模式 | 是否中断请求 | 复杂度 | 适用场景 |
|------|-------------|--------|---------|
| ignore 标志 | 否 | 低 | 简单组件、小请求 |
| AbortController | 是 | 中 | 大文件、流式响应、需节省带宽 |
| 版本号 | 否 | 低 | 非 effect 场景、事件回调 |
| React Query | 内置 | 低 | 生产项目、需要缓存和重试 |

### useScroll — 监听滚动位置

```tsx
const getPosition = () => ({
    x: window.scrollX,
    y: window.scrollY
})

export const useScroll = () => {
    const [position, setPosition] = useState(getPosition())
    useEffect(() => {
        const handler = () => { setPosition(getPosition()) }
        window.addEventListener("scroll", handler)
        return () => { window.removeEventListener("scroll", handler) }
    }, [])
    return position
}
```

> 事件监听的标准模式：`addEventListener` 注册 → `removeEventListener` 在清理函数中注销。必须传同一个函数引用，否则 remove 无效。
