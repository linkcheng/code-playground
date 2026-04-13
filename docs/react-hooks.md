# React 学习笔记

## Props & State — 核心概念

| 概念 | 本质 | 代码体现 |
|------|------|---------|
| **Props** | 外部传入的数据（只读） | `<MyButton label="Hello" onClick={fn} />` |
| **State** | 组件内部管理的数据（可变） | `const [num, setNum] = useState(0)` |

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

| 角色 | API | 作用 |
|------|-----|------|
| **创建** | `createContext` | 定义共享数据的容器和默认值 |
| **提供** | `Context.Provider` | 注入实际数据，子树内所有组件可访问 |
| **消费** | `useContext` | 在后代组件中直接取值 |

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

| | 普通写法 | useMemo | useCallback |
|---|---|---|---|
| **每次渲染** | 重新执行/创建 | 依赖不变就缓存 | 依赖不变就缓存 |
| **缓存的是** | — | 计算结果（值） | 函数引用 |
| **等价关系** | — | `useCallback(fn, deps)` = `useMemo(() => fn, deps)` |

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

| 场景 | 用不用 |
|------|--------|
| 函数/对象**不传给子组件**，也不放进依赖数组 | **不用** |
| 函数传给子组件 + 子组件用了 `React.memo` | **用 useCallback** |
| 对象/数组传给子组件 | **用 useMemo** |
| 函数放进 `useEffect` 依赖 | **用 useCallback** |
| 计算量很小（简单运算） | **不用** |

> **搭配 `React.memo` 才有意义**：单纯 `useCallback` 不能阻止子组件重渲染。子组件必须用 `React.memo(Child)` 包裹，React 才会比较 props 引用，发现没变才跳过渲染。

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

---

## 自定义 Hook 实践

自定义 Hook 是用基础 Hook（useState、useEffect、useCallback 等）**组合**出来的可复用逻辑。

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

| | useEffect 被动同步 | useCallback 主动同步 |
|---|---|---|
| **返回值** | 原生 `setState`，类型完整 | 自定义 `setValue`，需手动处理函数式更新 |
| **同步时机** | 渲染后才写 localStorage | 调用时立即写 |
| **防御性** | 强 — 任何方式改 state 都能同步 | 弱 — 绕过 setValue 直接改就不同步 |
| **多余写入** | 初始化也会触发 effect 写一次 | 只在主动调用时写 |

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
