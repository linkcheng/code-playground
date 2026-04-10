# React Hooks 学习笔记

## useState — 组件内状态

- **执行时机**：渲染过程中，参与 JSX 生成
- **作用**：在单个组件内声明可变状态

```tsx
const [count, setCount] = useState(0);
// setCount(1) → 触发重新渲染 → 新值用于生成 JSX
```

## useState 对象类型的注意事项

当 state 是对象时，有三个核心陷阱：

### 1. 不可变性 — 必须创建新对象

```tsx
const [user, setUser] = useState({ name: 'Tom', age: 20 });

// ❌ 直接修改，引用没变，React 检测不到变化，不触发渲染
user.name = 'Jerry';
setUser(user);

// ✅ 展开运算符创建新对象，新引用 → 触发渲染
setUser({ ...user, name: 'Jerry' });
```

React 用 `Object.is()` 比较新旧 state，引用相同则跳过渲染。

### 2. setState 是替换，不是合并

```tsx
// ⚠️ 这样写 name 会丢失！state 变成 { age: 25 }
setUser({ age: 25 });

// ✅ 保留不需要修改的字段
setUser(prev => ({ ...prev, age: 25 }));
```

### 3. 函数式更新避免闭包陷阱

当新 state 依赖旧 state 时，优先用函数式更新：

```tsx
// ❌ 闭包中 num 可能是旧值
setNum(num + 1);

// ✅ prev 始终是最新的
setNum(prev => prev + 1);
```

> **经验法则**：对象 state 用 `prev => ({ ...prev, key: newVal })`，嵌套深时考虑 `useReducer` 或 immer。

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

## useRef — 跨渲染的可变引用

`useRef` 返回 `{ current: 值 }`，在组件整个生命周期内**引用不变**，修改 `.current` **不会触发渲染**。

### 基本用法

```tsx
const inputRef = useRef<HTMLInputElement>(null);
//                   ^^^^^^^^^^^^^^^^^ 泛型：告诉 TS 这个 ref 指向 input DOM 元素
//                                      ^^^^ 初始值（挂载前为 null）
```

### 绑定 DOM 元素

```tsx
<input ref={inputRef} type="text" />
// React 挂载时自动执行 inputRef.current = <input DOM元素>
// 卸载时自动设回 null

// 读取值（?. 防止挂载前访问 null 报错）
inputRef.current?.value
```

### ref vs state

| | useRef | useState |
|---|---|---|
| **修改后** | 不触发渲染 | 触发渲染 |
| **适用场景** | DOM 引用、定时器 ID、标记位 | 需要显示在界面上的数据 |

```tsx
// ref 存标记位 — 改它不会额外渲染
const isMounted = useRef(false);
useEffect(() => { isMounted.current = true; }, []);
```

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
