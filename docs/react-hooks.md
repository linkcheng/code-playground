# React Hooks 学习笔记

## useState — 组件内状态

- **执行时机**：渲染过程中，参与 JSX 生成
- **作用**：在单个组件内声明可变状态

```tsx
const [count, setCount] = useState(0);
// setCount(1) → 触发重新渲染 → 新值用于生成 JSX
```

## useEffect — 副作用 Hook

- **执行时机**：渲染完成、浏览器绘制画面**之后**执行
- **作用**：处理渲染之外的操作（API 请求、WebSocket、定时器等）

### 三种写法

```tsx
// 1. 无依赖 — 每次渲染后都执行
useEffect(() => { ... });

// 2. 空数组 — 只在挂载时执行一次
useEffect(() => { ... }, []);

// 3. 有依赖 — 依赖变化时执行
useEffect(() => { ... }, [count]);
```

### 依赖变化机制

React 用 `Object.is()` 对比依赖项前后值，不同则重新执行 effect。

### 清理函数（return 的函数）

```tsx
useEffect(() => {
  const ws = new WebSocket(url);
  return () => ws.close(); // 清理函数，被 React 存起来
}, [url]);
```

- 不是定义时执行，而是被 React 保管
- 在**下次 effect 执行前**或**组件卸载时**调用

执行时间线：

```
第1次渲染后 → 执行函数体 → 清理函数存起来
第2次渲染后 → 先执行上次存的清理函数 → 执行新函数体 → 新清理函数存起来
...
卸载时     → 执行最后一次存的清理函数
```

### 组件卸载的时机

组件从 DOM 中移除 = 卸载 = 触发清理函数：

- 条件渲染：`{show ? <Chat /> : null}` — show 变为 false
- 路由切换：从 `/chat` 跳到 `/login` — Chat 组件卸载
- 列表项删除：删除列表中的某一项

## useState 与 useEffect 的关系

- `useState` — 管"存什么数据"（渲染中）
- `useEffect` — 管"数据变了之后做什么事"（渲染后）

```tsx
const [url, setUrl] = useState("ws://localhost:8080");

useEffect(() => {
  const ws = new WebSocket(url);
  return () => ws.close();
}, [url]); // url 变了 → 关闭旧连接 → 建立新连接
```

## zustand（全局状态管理）与 useState 的区别

| | useState | zustand (useAuthStore) |
|---|---|---|
| **作用域** | 单个组件内 | 全局，所有组件共享 |
| **跨组件** | 需要一层层 props 传递 | 直接用，无需传递 |
| **持久化** | 组件卸载就没了 | store 一直在 |
| **函数引用** | 每次渲染可能创建新引用 | store 中的函数引用始终不变 |

zustand store 中的函数引用不变，因为函数在 `create()` 时创建，存储在 store 对象上，不会重新创建：

```tsx
// 引用不变 → effect 只执行一次
const restore = useAuthStore((s) => s.restore);
useEffect(() => { restore(); }, [restore]);
```
