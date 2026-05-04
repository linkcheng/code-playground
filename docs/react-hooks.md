# React 学习笔记

## Props & State — 核心概念

| 概念            | 本质                       | 代码体现                                    |
| --------------- | -------------------------- | ------------------------------------------- |
| **Props** | 外部传入的数据（只读）     | `<MyButton label="Hello" onClick={fn} />` |
| **State** | 组件内部管理的数据（可变） | `const [num, setNum] = useState(0)`       |

> **一句话区分**：Props 是"别人给我的"，State 是"我自己管的"。

### 组件结构

```
App (根组件)
  ├─ state: count
  └─ <MyCom label="点我+1" render={(num) => <p>{num}</p>} />
       ├─ state: num (自管理)
       ├─ props: label, render (来自 App)
       └─ <MyButton label onClick disabled />
            └─ props: label, onClick, disabled? (来自 MyCom)
```

### Interface 定义 Props 合约

```tsx
interface MyButtonProps {
  label: string;           // 必传
  onClick: () => void;     // 必传函数
  disabled?: boolean;      // 可选（?标记）
}

function MyButton({ label, onClick, disabled = false }: MyButtonProps) {
  // 解构赋值 + 默认值，直接用 label, onClick, disabled
}
```

### static propTypes & defaultProps（类组件）

类组件中的静态属性，用于声明 props 的**运行时类型检查**和**默认值**。

#### propTypes — 运行时类型检查

```jsx
import PropTypes from 'prop-types';

class Button extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,   // 必传字符串
    count: PropTypes.number,              // 可选数字
    onClick: PropTypes.func,              // 可选函数
    items: PropTypes.arrayOf(PropTypes.string),   // 字符串数组
    user: PropTypes.shape({                        // 对象形状
      name: PropTypes.string,
      age: PropTypes.number,
    }),
  };
}
```

- 仅在**开发模式**下生效，生产构建被移除
- 类型不匹配时控制台打印 warning（不阻断渲染）

#### defaultProps — 默认值

```jsx
class Button extends React.Component {
  static defaultProps = {
    count: 0,
    label: 'Click me',
  };
  // 父组件没传 count 或 label 时，使用这里的默认值
}
```

#### 类组件 vs 函数组件对比

```tsx
// 类组件写法（旧）
class Button extends React.Component {
  static propTypes = { label: PropTypes.string.isRequired };
  static defaultProps = { count: 0 };
}

// 函数组件写法（推荐）
interface ButtonProps {
  label: string;
  count?: number;
}
function Button({ label, count = 0 }: ButtonProps) { /* ... */ }
```

|                    | propTypes（类组件）         | TypeScript（函数组件） |
| ------------------ | --------------------------- | ---------------------- |
| **检查时机** | 运行时                     | 编译时                |
| **开销**     | 有运行时开销               | 零运行时开销          |
| **效果**     | warning，不阻断            | 编译报错，直接拦住    |

> `static` 关键字表示属性挂在类本身上（`Button.propTypes`），而非实例上。React 18.3+ 函数组件的 `Button.defaultProps` 已弃用，推荐解构默认值。

### Render Props（控制反转）

```tsx
interface MyComProps {
  label: string;
  render?: (num: number) => React.ReactNode;  // 父组件提供渲染函数
}

// 子组件在适当时机调用
{render?.(num)}  // 可选链：不传 render 也不会报错
```

Render Props 本质是**回调思想的延伸**：

- `onClick` → "事件发生了通知你"
- `render` → "需要渲染了通知你"
- 都是**父组件提供函数，子组件在适当时机调用**

### 状态封装 vs 状态提升

- **封装**：组件用 `useState` 自管理状态，独立可复用，但父组件无法直接控制
- **提升**：状态放在父组件，通过 props 传入子组件，父组件拥有完全控制权
- 选择依据：**谁需要这个数据，状态就放在谁那里**

---

## Hooks

### 调用规则 — 为什么 Hook 必须在顶层调用

**核心原因**：React 依赖调用顺序来匹配 Hook 和状态。

React 内部用**链表**存储每个组件的 Hook 集合，靠**位置索引**（第 0 个、第 1 个……）匹配状态，而不是名字或 key：

```
渲染 #1:  useState(0)  →  useEffect(...)  →  useState(null)
            ↓                ↓                  ↓
Hook 链表:  [hook#0]   →   [hook#1]    →    [hook#2]

渲染 #2:  useState(0)  →  useEffect(...)  →  useState(null)
            ↓                ↓                  ↓
         复用 hook#0     复用 hook#1       复用 hook#2
```

如果 Hook 放在条件语句或循环中，数量或顺序可能变化，导致索引错位、状态混乱：

```tsx
// ❌ 条件渲染导致 Hook 数量不一致
if (someCondition) {
  const [count, setCount] = useState(0);  // 有时 hook#0，有时不存在
}
const [name, setName] = useState('');      // 有时 hook#0，有时 hook#1 → 错位！
```

**禁止放在这些位置**：

| 不能放在      | 原因                 |
| ------------- | -------------------- |
| `if/else`   | 条件分支导致数量变化 |
| `for/while` | 循环次数可能不同     |
| 嵌套函数      | 不在组件渲染路径上   |

> **本质**：React 没用”命名 key”区分 Hook，选择了最简单的顺序索引方案——省去 key 匹配开销，但牺牲了条件调用的灵活性。自定义 Hook 不创建新的 Hook 节点，其内部的 `useState`/`useEffect` 仍按顺序挂载到宿主组件的链表上。

> Hooks 执行阶段的深入分析（Render vs Commit）见 [react-hooks-advanced.md](react-hooks-advanced.md)

### useState — 组件内状态

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

### 函数式更新的参数来源

```tsx
setCount((c) => c + 1);
//         ↑ c 是什么？
```

- **类型**：`number`（由 `useState(0)` 初始值推断）
- **值的来源**：React 内部传入，保证是最新状态值
- **过程**：你传入一个函数 → React 暂存它 → 从内部取出最新 state 作为参数调用 → 用返回值替换旧状态

```tsx
// setCount 有两种调用方式：
setCount(5)              // 直接传值
setCount((c) => c + 1)   // 传函数，React 传入最新值
```

### 惰性初始化

```tsx
// 两种写法等价（简单值时没区别）：
const [count, setCount] = useState(0)          // 直接传值
const [count, setCount] = useState(() => 0)    // 传函数，返回初始值
```

当初始值计算有开销时，函数形式避免每次渲染都执行：

```tsx
// ❌ 每次渲染都执行 expensiveCalc()，结果被丢弃
const [data, setData] = useState(expensiveCalc())

// ✅ 只在首次渲染时执行一次
const [data, setData] = useState(() => expensiveCalc())
```

> **注意**：`useState(fn)` 是把 `fn` 的**返回值**当初始值，`setCount(fn)` 是把 `fn` 当更新函数接收上一个状态。同样传函数，语义完全不同。

## useReducer — 复杂状态管理

`useReducer` 是 `useState` 的升级版，适合管理**复杂或关联状态**。

### 数据流

```
用户操作 → dispatch(action) → reducer(state, action) → 新 state → UI 更新
```

### 基本结构

```tsx
// 1. 初始状态
const initialState = { name: "hello", age: 18 }

// 2. reducer 纯函数 — 根据 action.type 决定如何更新
const reducer = (state: typeof initialState, action: { type: string, payload: string }) => {
    switch (action.type) {
        case "changeName":
            return { ...state, name: action.payload }
        case "changeAge":
            return { ...state, age: Number(action.payload) }
        default:
            return state
    }
}

// 3. 使用 Hook
const [info, dispatch] = useReducer(reducer, initialState)

// 4. 触发更新
dispatch({ type: "changeName", payload: "新名字" })
```

### 事件对象 ev

```tsx
<input onChange={(ev) => dispatch({ type: "changeName", payload: ev.target.value })} />
//       ↑ ev 类型: React.ChangeEvent<HTMLInputElement>
//                                                    ↑ ev.target: 触发事件的 DOM 元素
//                                               ↑ ev.target.value: 输框当前文字
```

> reducer 必须是**纯函数**：不能直接修改 state，用 `{...state, key: newVal }` 返回新对象。React 通过引用比较判断状态是否变化。

## createContext & useContext — 跨层级传递数据

Context 解决**跨层级组件传递数据**的问题，避免 props 逐层传递（prop drilling）。

### 三个角色

| 角色           | API                  | 作用                               |
| -------------- | -------------------- | ---------------------------------- |
| **创建** | `createContext`    | 定义共享数据的容器和默认值         |
| **提供** | `Context.Provider` | 注入实际数据，子树内所有组件可访问 |
| **消费** | `useContext`       | 在后代组件中直接取值               |

### 数据流

```
Parent (Provider 注入数据)
  └─ Child (中间层，不需要知道 theme)
       └─ GrandChild (useContext 消费数据)
```

### 代码结构

```tsx
// 1. 创建 Context（设默认值）
export const ThemeContext = createContext({
    theme: "light",
    toggleTheme: () => {}
})

// 2. Provider 注入实际值
<ThemeContext.Provider value={{ theme, toggleTheme }}>
    <Child />
</ThemeContext.Provider>

// React 18 及之前：必须写 .Provider
<ThemeContext.Provider value={{ theme, toggleTheme }}>
  <Child />
</ThemeContext.Provider>

// React 19+：直接用 Context 作为组件 ✅
<ThemeContext value={{ theme, toggleTheme }}>
  <Child />
</ThemeContext>

// 3. 消费 — 三种写法（效果相同）

// 写法1：直接 useContext
const { theme } = useContext(ThemeContext)

// 写法2：Consumer（旧写法，已不推荐）
<ThemeContext.Consumer>{({theme}) => <div>{theme}</div>}</ThemeContext.Consumer>

// 写法3：封装自定义 Hook（推荐）
const theme = useTheme()  // useTheme 内部调用 useContext
```

> **自定义 Hook 封装是最佳实践**：消费方不用知道用哪个 Context，换实现方案时只改 Hook 文件。没有 Provider 时，`useContext` 会拿到 `createContext` 的默认值。

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

> 命令式 vs 声明式的深入对比（用视频播放器示例）见 [react-hooks-advanced.md](react-hooks-advanced.md)

## useEffectEvent — Effect 内的"最新值读取器"（React 19.2）

### 解决什么问题

`useEffect` 的依赖数组确保 Effect 看到最新值，但**任何依赖变化都会重新执行整个 Effect**。有时 Effect 内只是"读取"某个值做回调，并不需要因为它的变化而重新同步。

```tsx
// ❌ theme 变化导致重连（不需要的副作用）
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => {
      showNotification('Connected!', theme); // 只是用 theme 做通知样式
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, theme]); // theme 变了 → 断开重连
}
```

### API 签名

```tsx
const onEvent = useEffectEvent(callback);
// callback 中的 props/state 总是最新值，不需要放进依赖数组
```

### 修正后的写法

```tsx
// ✅ theme 变化不会触发重连，但通知始终用最新样式
function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme); // 总是读最新 theme
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', () => onConnected());
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // 只在 roomId 变化时重连
}
```

### 典型场景：自定义 useInterval

```tsx
// 不用 useEffectEvent：callback 变化会导致 interval 重置
// 用 useEffectEvent：callback 始终最新，interval 只由 delay 控制
function useInterval(callback, delay) {
  const onTick = useEffectEvent(callback);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => onTick(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

### 约束规则

- 只能在组件/自定义 Hook **顶层**调用（和其他 Hook 一样）
- 只能在 **Effect 内部**调用，不能在渲染期间或传给子组件
- **不需要放进依赖数组**，ESLint 插件会自动排除
- Effect Event 函数的 identity 每次渲染都变（有意为之，防止误用）

> 本质：把"响应式"（依赖数组，变了就重同步）和"非响应式"（Effect Event，变了不触发但能读最新值）显式区分开。之前用 `useRef` 保存最新回调的模式（`ref.current = callback`）就是它的前身。

## useMemo & useCallback — 缓存（记忆化）

两者都是**缓存 Hook**，避免每次渲染重复计算或创建新引用。

### useMemo — 缓存计算结果

```tsx
const doubleInfo = useMemo(() => ({ info: count * 2 }), [count])
//                   ↑ 工厂函数，返回要缓存的值       ↑ 依赖项
```

- 只有依赖项变化时才重新执行工厂函数
- 其他 state 变化导致重新渲染时，返回缓存的值

### useCallback — 缓存函数引用

```tsx
// 每次渲染都创建新函数
const handleAdd = () => { setCount((c) => c + 1) }

// 依赖不变，返回同一个函数引用
const handleClick = useCallback(() => {
    setCount((c) => c + 1)
}, [])
//  ↑ 空依赖 + 函数式更新 = 函数永远不需要重建
```

### 对比

|                    | 普通写法      | useMemo                                                 | useCallback    |
| ------------------ | ------------- | ------------------------------------------------------- | -------------- |
| **每次渲染** | 重新执行/创建 | 依赖不变就缓存                                          | 依赖不变就缓存 |
| **缓存的是** | —            | 计算结果（值）                                          | 函数引用       |
| **等价关系** | —            | `useCallback(fn, deps)` = `useMemo(() => fn, deps)` |                |

> **核心问题是"引用相等"**：每次渲染 `() => {}` 都是新函数、`{}` 都是新对象，即使内容一样引用也不同。传给子组件或放入 `useEffect` 依赖时会导致不必要的更新。

### 使用场景

**useMemo**：

```tsx
// 1. 计算开销大时（排序、过滤大量数据）
const sortedList = useMemo(() => heavySort(rawList), [rawList])

// 2. 引用类型传给子组件（配合 React.memo 跳过子组件渲染）
const style = useMemo(() => ({ color: "red" }), [])
<Child style={style} />
```

**useCallback**：

```tsx
// 1. 函数传给子组件（最常见，配合 React.memo）
const handleDelete = useCallback(() => {
    setList(prev => prev.filter(...))
}, [])
<Child onDelete={handleDelete} />

// 2. 函数放进 useEffect 依赖
const fetchData = useCallback(() => { fetch(`/api?id=${id}`) }, [id])
useEffect(() => { fetchData() }, [fetchData])

// 3. 自定义 Hook 返回函数
export const useTimer = () => {
    const start = useCallback(() => { ... }, [])
    return { start }
}
```

### 判断口诀

| 场景                                              | 用不用                   |
| ------------------------------------------------- | ------------------------ |
| 函数/对象**不传给子组件**，也不放进依赖数组 | **不用**           |
| 函数传给子组件 + 子组件用了 `React.memo`        | **用 useCallback** |
| 对象/数组传给子组件                               | **用 useMemo**     |
| 函数放进 `useEffect` 依赖                       | **用 useCallback** |
| 计算量很小（简单运算）                            | **不用**           |

> **搭配 `React.memo` 才有意义**：单纯 `useCallback` 不能阻止子组件重渲染。子组件必须用 `React.memo(Child)` 包裹，React 才会比较 props 引用，发现没变才跳过渲染。

### 与 React.memo 的协作

React 默认行为：**父组件重渲染，所有子组件无条件跟着重渲染**，不管 props 变没变。

#### 第一层：React.memo 浅比较 props

```tsx
const MemoChild = React.memo(function Child({ text }: { text: string }) {
  return <div>{text}</div>
})

// props.text 没变 → Object.is 比较 → 跳过渲染 ✅
<MemoChild text={text} />
```

#### 第二层：引用类型陷阱 — memo 失效

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  // ❌ 每次渲染创建新引用 → {} !== {}，() => {} !== () => {}
  const style = { color: 'red' }
  const handleClick = () => { console.log('clicked') }

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <MemoChild style={style} onClick={handleClick} />
      {/* count 变 → Parent 重渲染 → 新 style/new handleClick */}
      {/* React.memo：旧引用 !== 新引用 → 重新渲染 ❌ */}
    </>
  )
}
```

#### 第三层：useMemo + useCallback 稳定引用

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const style = useMemo(() => ({ color: 'red' }), [])    // ✅ 引用稳定
  const handleClick = useCallback(() => {                 // ✅ 引用稳定
    console.log('clicked')
  }, [])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <MemoChild style={style} onClick={handleClick} />
      {/* count 变 → Parent 重渲染，但 style/handleClick 引用没变 */}
      {/* React.memo：旧 === 新 → 跳过渲染 ✅ */}
    </>
  )
}
```

#### 三个角色的关系

| 角色 | 作用 | 缺少会怎样 |
|---|---|---|
| `React.memo(Child)` | 浅比较 props，相同则跳过渲染 | 父渲染子必渲染，无优化 |
| `useCallback` | 稳定函数 props 引用 | 新函数引用 → memo 比较失败 → 无效渲染 |
| `useMemo` | 稳定对象/数组 props 引用 | 新对象引用 → memo 比较失败 → 无效渲染 |

> 三者缺一不可：只用 `useCallback` 不用 `React.memo` → 子组件照样渲染；只用 `React.memo` 不用 `useCallback` → 内联函数导致引用变化，memo 失效。原始类型 props（string、number）天然稳定，只需要 `React.memo` 就够了。

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

|                    | useRef                      | useState               |
| ------------------ | --------------------------- | ---------------------- |
| **修改后**   | 不触发渲染                  | 触发渲染               |
| **适用场景** | DOM 引用、定时器 ID、标记位 | 需要显示在界面上的数据 |

```tsx
// ref 存标记位 — 改它不会额外渲染
const isMounted = useRef(false);
useEffect(() => { isMounted.current = true; }, []);
```

### Callback Ref — 感知 DOM 绑定时机

`ref` 属性不只接受 `useRef()` 返回的对象，还接受**函数**（callback ref）。React 在绑定/解绑 DOM 时主动调用这个函数。

#### 对象 ref vs Callback ref

|                    | 对象 ref (`useRef`)                  | Callback ref                              |
| ------------------ | ------------------------------------ | ----------------------------------------- |
| **写法**     | `const ref = useRef(null)`           | `ref={(node) => {...}}`                 |
| **获取时机** | 被动，自己去读 `ref.current`         | 主动，React 调用时立刻拿到 node           |
| **能做的事** | 存引用、命令式操作                   | 测量、初始化第三方库、注册观察器         |
| **触发渲染** | 修改 `.current` 不会渲染             | 回调内 `setState` 可以触发渲染           |

> **一句话**：需要"知道 ref 什么时候绑上 DOM"就用 callback ref，只是存个引用就用对象 ref。

#### 执行时机

```
挂载时 → 调用 callback(node)     // node 是真实 DOM 元素
卸载时 → 调用 callback(null)     // 通知你清理
```

#### 典型场景：测量 DOM 元素

```tsx
function MeasureExample() {
  const [height, setHeight] = useState(0)

  return (
    <div ref={(node) => {
      if (node) {
        setHeight(node.getBoundingClientRect().height)
      }
    }}>
      内容区域，高度: {height}px
    </div>
  )
}
```

对象 ref 做不到这件事——你不知道 `ref.current` 什么时候被赋值，没法在赋值那一刻去测量。

#### 封装成自定义 Hook（推荐）

```tsx
function useElementSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, size };
}
```

#### 内联函数的陷阱

```tsx
// ❌ 内联函数：每次渲染都是新引用 → React 检测到 ref 函数变了 → 先 callback(null) 再 callback(node)
<div ref={(node) => { /* 每次渲染都执行两次 */ }} />

// ✅ 用 useCallback 稳定引用，避免重复调用
const refCallback = useCallback((node: HTMLElement | null) => {
  if (node) { /* 只在挂载时执行 */ }
}, [])

<div ref={refCallback} />
```

> React 19 对内联函数 ref 的处理更智能，减少了不必要的 null→node 循环。

> useState 与 useEffect 的关系、React 19 新 API（Form Action、Suspense）、zustand 对比、自定义 Hook 实践见 [react-hooks-advanced.md](react-hooks-advanced.md)
