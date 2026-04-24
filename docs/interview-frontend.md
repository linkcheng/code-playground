# 前端面试题笔记

## 目录

1. [Event Loop — 宏任务与微任务](#1-event-loop--宏任务与微任务)
2. [闭包 — 原理、应用与 React Hook 关联](#2-闭包--原理应用与-react-hook-关联)
3. [原型链 — prototype、__proto__、constructor](#3-原型链--prototypeprotoconstructor)
4. [React Fiber 架构](#4-react-fiber-架构)
5. [虚拟 DOM](#5-虚拟-dom)
6. [响应式原理 — Vue Proxy vs React](#6-响应式原理--vue-proxy-vs-react)
7. [构建工具 — Webpack 核心流程 vs Vite](#7-构建工具--webpack-核心流程-vs-vite)
8. [构建优化 — Webpack/Vite 构建速度优化手段](#8-构建优化--webpackvite-构建速度优化手段)

---

## 1. Event Loop — 宏任务与微任务

### 1.1 为什么需要 Event Loop

JavaScript 是**单线程**语言 —— 一次只能执行一个任务。但浏览器需要同时处理：用户交互、网络请求、定时器、UI 渲染等。

Event Loop 是**调度机制**，让单线程能够处理异步操作而不阻塞主线程。

### 1.2 核心组件

```
┌───────────────────────┐
│      Call Stack        │  ← 同步代码执行栈（LIFO）
└───────────┬───────────┘
            │ 同步执行完毕
            ▼
┌───────────────────────┐
│    Microtask Queue     │  ← 微任务队列（FIFO），每次清空
└───────────┬───────────┘
            │ 全部清空后
            ▼
┌───────────────────────┐
│    Macrotask Queue     │  ← 宏任务队列（FIFO），每次取一个
└───────────┬───────────┘
            │ 执行完一个宏任务后
            ▼
     回到微任务队列...循环
```

### 1.3 宏任务 vs 微任务

| 分类 | 包含的 API |
|------|-----------|
| **宏任务** | `setTimeout`、`setInterval`、`I/O`、UI 渲染、`requestAnimationFrame`、`setImmediate`（Node） |
| **微任务** | `Promise.then/catch/finally`、`MutationObserver`、`queueMicrotask()`、`process.nextTick`（Node，优先级最高） |

### 1.4 执行顺序（核心规则）

```
1. 执行全局同步代码（算作第一个宏任务）
2. 同步代码执行完后，检查微任务队列
3. 清空所有微任务（包括执行过程中新产生的微任务）
4. 浏览器决定是否渲染 UI
5. 取下一个宏任务执行
6. 回到步骤 2（循环）
```

**经典面试题：**

```js
console.log('1')                        // 同步

setTimeout(() => console.log('2'), 0)   // 宏任务

Promise.resolve()
  .then(() => console.log('3'))         // 微任务
  .then(() => console.log('4'))         // 微任务（链式）

console.log('5')                        // 同步

// 输出顺序: 1 → 5 → 3 → 4 → 2
```

**执行分析：**
1. 同步：`1`、`5` 先输出
2. 微任务队列清空：`3`、`4`（then 链按顺序排入）
3. 下一个宏任务：`2`

### 1.5 为什么微任务优先级更高

这不是"谁更重要"的设计选择，而是**语义上的必然**：

1. **微任务代表"当前任务的后半部分"**：`Promise` 的 `.then` 回调是当前异步操作的延续，应该在同一轮 Event Loop 中完成，保证 Promise 状态的一致性
2. **宏任务代表"独立的、新的一项工作"**：`setTimeout` 是"过一会儿再做件事"，语义上是新的任务
3. **保证异步操作的可预测性**：如果宏任务插队在微任务前面，Promise 的链式调用可能被其他任务打断，产生不可预期的中间状态

```js
// 如果微任务不优先，可能出现：
Promise.resolve().then(() => {
  // 期望立即执行，但被 setTimeout 插队
  // 导致状态不一致
})
```

> **一句话总结：** 微任务是当前宏任务的"收尾工作"，必须在本轮清空；宏任务是下一轮的"新工作"，自然排在后面。

### 1.6 Node.js 中的差异

Node.js 的 Event Loop 分阶段（phases）：

```
   ┌──────────────────────────┐
   │        timers             │ ← setTimeout / setInterval
   ├──────────────────────────┤
   │     pending callbacks     │ ← 系统级回调（TCP 错误等）
   ├──────────────────────────┤
   │       idle, prepare       │ ← 内部使用
   ├──────────────────────────┤
   │         poll              │ ← I/O 回调（文件读取、网络等）
   ├──────────────────────────┤
   │         check             │ ← setImmediate
   ├──────────────────────────┤
   │     close callbacks       │ ← socket.on('close')
   └──────────────────────────┘
```

- `process.nextTick` 优先于所有微任务（Promise.then 之前）
- `setImmediate` 在 `check` 阶段执行，与 `setTimeout(fn, 0)` 的顺序在非 I/O 上下文中不确定

---

## 2. 闭包 — 原理、应用与 React Hook 关联

### 2.1 什么是闭包

**闭包 = 函数 + 其创建时的词法作用域（Lexical Environment）**

当一个函数引用了外部作用域的变量，即使外部函数已经执行完毕，这些变量也不会被回收 —— 因为被闭包"捕获"了。

```js
function createCounter() {
  let count = 0           // 被闭包捕获的变量
  return {
    increment: () => ++count,
    getCount: () => count,
  }
}

const counter = createCounter()
counter.increment()  // 1
counter.increment()  // 2
counter.getCount()   // 2
// createCounter 已执行完，但 count 仍被内部函数持有
```

### 2.2 应用场景

| 场景 | 说明 |
|------|------|
| **数据私有化** | 模块模式，隐藏内部状态（如上例的 `count`） |
| **柯里化 / 偏应用** | 分步传参，生成特定配置的函数 |
| **防抖 / 节流** | 利用闭包持有 timer 引用 |
| **回调函数** | 事件监听、数组方法中保留上下文 |

```js
// 柯里化
const multiply = (a) => (b) => a * b
const double = multiply(2)
double(5)  // 10

// 防抖
function debounce(fn, delay) {
  let timer = null             // 闭包持有 timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
```

### 2.3 闭包导致的内存泄露

闭包本身**不是**内存泄露。它只是延长了变量的生命周期。真正的问题是：

1. **意外的引用持有**：闭包引用了大对象，但不真正需要它
2. **未清理的引用**：如未移除的事件监听器、定时器

```js
// 有问题的写法：闭包持有整个 element
function setup(element) {
  const hugeData = element.dataset.huge // 大量数据
  element.addEventListener('click', () => {
    console.log(hugeData.id) // 只用了 id，但 hugeData 整体被持有
  })
}

// 改进：只保留需要的值
function setup(element) {
  const id = element.dataset.huge.id // 只捕获需要的
  element.addEventListener('click', () => console.log(id))
}
```

### 2.4 React Hook 中的闭包

React Hook 的设计深度依赖闭包，但也带来了经典的 **Stale Closure（过期闭包）** 问题：

```jsx
function Counter() {
  const [count, setCount] = useState(0)

  // ❌ 闭包陷阱：handleClick 捕获的是渲染时的 count
  // 快速点击 3 次，可能只 +1（每次闭包里的 count 都是同一个旧值）
  const handleClick = () => {
    setTimeout(() => {
      setCount(count + 1)  // count 是创建时的快照，不是最新值
    }, 1000)
  }

  // ✅ 使用函数式更新，避免依赖闭包中的旧值
  const handleClickFixed = () => {
    setTimeout(() => {
      setCount(prev => prev + 1)  // prev 总是最新的
    }, 1000)
  }

  // ✅ useEffect 中也常见此问题
  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1)       // ❌ 永远是初始闭包中的 0
    }, 1000)
    return () => clearInterval(id)
  }, []) // 空依赖 → 闭包永远捕获初始 count

  return <button onClick={handleClick}>{count}</button>
}
```

**根本原因：** 每次渲染创建新的闭包，但 `useEffect` 如果依赖数组为空，回调函数只创建一次，内部闭包永远指向第一次渲染时的变量值。

**解决方案：**
- 使用函数式更新 `setState(prev => newValue)`
- 正确设置依赖数组 `useEffect(() => {...}, [count])`
- 使用 `useRef` 持有可变引用

---

## 3. 原型链 — prototype、__proto__、constructor

### 3.1 三角关系

```
┌─────────────────────────────────┐
│  构造函数 Person                 │
│  ┌─────────────────────────┐    │
│  │ prototype ──────────────────→ │ Person.prototype
│  └─────────────────────────┘    │ ┌───────────────────────┐
│                                 │ │ constructor ──→ Person │
│                                 │ │ __proto__ ──→ Object.prototype
│                                 │ └───────────────────────┘
└─────────────────────────────────┘
          │ new Person()
          ▼
┌─────────────────────┐
│  实例 person         │
│  __proto__ ───────────→ Person.prototype
└─────────────────────┘
```

**三条规则：**

| 关系 | 说明 |
|------|------|
| `构造函数.prototype` | 函数的 `prototype` 属性指向原型对象 |
| `实例.__proto__` | 实例的 `__proto__` 指向构造函数的 `prototype` |
| `原型对象.constructor` | 原型对象的 `constructor` 指回构造函数 |

```js
function Person(name) {
  this.name = name
}

const person = new Person('Alice')

person.__proto__ === Person.prototype           // true
Person.prototype.constructor === Person          // true
person.__proto__.__proto__ === Object.prototype  // true
Object.prototype.__proto__ === null              // true（链的终点）
```

### 3.2 原型链查找机制

当访问对象的属性时，JS 引擎按以下顺序查找：

```
对象自身 → 对象.__proto__ → 对象.__proto__.__proto__ → ... → null
```

```js
person.name                          // 'Alice'（自身属性）
person.toString()                    // 来自 Object.prototype（链末端）
person.hasOwnProperty('name')        // true（来自 Object.prototype）
```

### 3.3 继承的实现

```js
// 原型链继承
function Animal(type) {
  this.type = type
}
Animal.prototype.speak = function() {
  console.log(`${this.type} makes a sound`)
}

function Dog(name) {
  Animal.call(this, 'Dog')  // 借用构造函数（继承实例属性）
  this.name = name
}

// 关键：让 Dog.prototype 指向 Animal 的实例
Dog.prototype = Object.create(Animal.prototype)
Dog.prototype.constructor = Dog  // 修复 constructor 指向

Dog.prototype.bark = function() {
  console.log(`${this.name}: Woof!`)
}

const dog = new Dog('Rex')
dog.speak()  // 'Dog makes a sound'（继承自 Animal.prototype）
dog.bark()   // 'Rex: Woof!'（自身原型方法）

dog instanceof Dog     // true
dog instanceof Animal  // true
```

**现代方式（ES6 class）：**

```js
class Animal {
  constructor(type) { this.type = type }
  speak() { console.log(`${this.type} makes a sound`) }
}

class Dog extends Animal {
  constructor(name) {
    super('Dog')
    this.name = name
  }
  bark() { console.log(`${this.name}: Woof!`) }
}
```

> `class` 本质是语法糖，底层仍基于原型链。`extends` 内部做的事等价于 `Dog.prototype = Object.create(Animal.prototype)`。

### 3.4 常见面试陷阱

```js
function Foo() {}
Foo.prototype = { a: 1 }  // 重写 prototype

const foo = new Foo()

Foo.prototype.constructor === Foo  // false！constructor 丢失了
// 因为 { a: 1 } 的 constructor 是 Object，不是 Foo

// 修复
Foo.prototype = Object.create(Object.prototype, {
  constructor: { value: Foo, enumerable: false }
})
```

---

## 4. React Fiber 架构

### 4.1 旧架构的问题（Stack Reconciler）

React 15 及之前使用**递归**遍历组件树（Virtual DOM 树），称为 **Stack Reconciler**：

```
更新触发
  → 递归遍历整棵树
    → 找出所有差异（Diff）
      → 一次性提交 DOM 更新
```

**核心问题：递归不可中断**

- 一旦开始 Reconciliation，必须一次性完成整棵树的 Diff
- 如果组件树很大（如 1000+ 节点），会长时间占据主线程
- 导致：动画卡顿、用户输入无响应、掉帧

```
用户交互    → 无响应（主线程被递归占用）
动画帧      → 跳过（无法在 16ms 内完成）
```

### 4.2 Fiber 是什么

Fiber 是 React 16 引入的**新 Reconciliation 引擎**。

**本质上：Fiber 是一个链表结构的"虚拟栈帧"**

每个 Fiber 节点对应一个组件/DOM 元素，包含：

```ts
interface FiberNode {
  // 静态结构（树形）
  return: FiberNode | null   // 父节点
  child: FiberNode | null    // 第一个子节点
  sibling: FiberNode | null  // 下一个兄弟节点

  // 工作单元
  pendingProps: any          // 待处理的新 props
  memoizedProps: any         // 上一次的 props
  memoizedState: any         // 上一次的 state（Hook 链表）
  updateQueue: UpdateQueue   // 更新队列

  // 副作用
  flags: Flags               // 需要执行的操作（插入、更新、删除）
  alternate: FiberNode       // 指向另一棵树的对应节点（双缓冲）
}
```

### 4.3 链表遍历 vs 递归遍历

```
递归（旧）—— 调用栈控制，不可中断：

  A
  ├── B
  │   ├── D
  │   └── E
  └── C
  入栈 A → B → D → E → C → ... 无法暂停

链表（Fiber）—— 手动控制遍历，可随时中断：

  A → child → B → child → D → sibling → E → return → B → sibling → C
  随时可以暂停，保存当前节点，稍后继续
```

### 4.4 时间切片（Time Slicing）

Fiber 的工作分为两个阶段：

| 阶段 | 特点 | 可中断 |
|------|------|--------|
| **Render（协调）** | 遍历 Fiber 树，计算 Diff，标记 flags | ✅ 可中断、可恢复 |
| **Commit（提交）** | 将变更同步应用到真实 DOM | ❌ 不可中断（必须一次完成） |

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Fiber    │    │ Fiber    │    │ Fiber    │    │ Commit   │
│ Work(5ms)│ → │ Work(5ms)│ → │ Work(5ms)│ → │ (同步)    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     ↑               ↑               ↑
   可中断           可中断           可中断
   可让出主线程     可让出主线程      可让出主线程
   处理用户输入     处理用户输入      处理用户输入
```

React 使用 `MessageChannel`（而非 `setTimeout`）调度这些工作片，确保在浏览器空闲时执行。

### 4.5 双缓冲（Double Buffering）

React 维护两棵 Fiber 树：

- **current 树**：当前屏幕上显示的 UI 对应的 Fiber 树
- **workInProgress 树**：正在构建的新 Fiber 树

```
  current 树          workInProgress 树
  ┌──────┐            ┌──────┐
  │  A   │ ←alternate→ │  A'  │
  │  B   │ ←alternate→ │  B'  │
  │  C   │ ←alternate→ │  C'  │
  └──────┘            └──────┘
  （当前屏幕）          （正在构建）
```

当 workInProgress 树构建完成 → Commit 阶段 → 交换指针 → workInProgress 变为 current。这个过程类似显卡的"双缓冲"机制。

### 4.6 优先级调度（Lane 模型）

React 18 引入 **Lane**（车道）模型替代旧的 expirationTime：

```ts
// 不同类型的更新有不同的优先级
const SyncLane         = 0b0000000000000000000000000000001    // 同步（最高）
const InputContinuousLane = 0b0000000000000000000000000000100 // 连续输入
const DefaultLane      = 0b0000000000000000000000000010000   // 默认
const IdleLane         = 0b0100000000000000000000000000000   // 空闲（最低）
```

- 用户输入（点击、输入）> 默认更新（数据加载）> 空闲任务
- 高优先级更新可以**中断**低优先级更新
- 被中断的低优先级更新会被**重做**（复用已完成的计算）

---

## 5. 虚拟 DOM

### 5.1 虚拟 DOM 的本质

**虚拟 DOM = 用 JavaScript 对象描述真实 DOM 结构**

```js
// 这段 JSX
<div className="container">
  <h1>Hello</h1>
  <p>World</p>
</div>

// 编译后等价于
React.createElement('div', { className: 'container' },
  React.createElement('h1', null, 'Hello'),
  React.createElement('p', null, 'World'),
)

// 运行时就是一个普通 JS 对象
{
  type: 'div',
  props: {
    className: 'container',
    children: [
      { type: 'h1', props: { children: 'Hello' } },
      { type: 'p', props: { children: 'World' } },
    ]
  }
}
```

### 5.2 为什么需要虚拟 DOM

| 优势 | 说明 |
|------|------|
| **批量更新** | 先在内存中 Diff，最小化 DOM 操作次数 |
| **跨平台** | 虚拟 DOM 是 JS 对象，不依赖浏览器 → React Native、SSR |
| **声明式编程** | 开发者描述"UI 应该长什么样"，框架负责高效更新 |

> **常见误解：** 虚拟 DOM **不是**为了比手动操作 DOM 更快。它的目标是提供"足够好的性能"同时让开发体验更好。在极端场景下，精准的命令式 DOM 操作永远更快。

### 5.3 Diff 算法（Reconciliation 规则）

React 的 Diff 基于三个假设（将 O(n³) 降到 O(n)）：

**规则 1：只做同层比较，不跨层级**

```
  A              A'
  ├── B    →    ├── B'   只比较 A→A'、B→B'、C→C'
  └── C        └── C'    不会拿 B 和 C' 比较
```

**规则 2：类型不同，直接替换（不尝试复用子树）**

```js
// 旧
<div><Counter /></div>
// 新
<span><Counter /></span>
// → div 整棵子树销毁，span 重建（即使 Counter 没变）
```

**规则 3：通过 `key` 标识列表元素的稳定性**

```jsx
// ❌ 没有 key → 按索引比较，插入/删除时全量更新
<ul>
  {items.map(item => <li>{item.name}</li>)}
</ul>

// ✅ 有 key → 通过 key 匹配，只移动/新增/删除变化的节点
<ul>
  {items.map(item => <li key={item.id}>{item.name}</li>)}
</ul>
```

```
旧列表: [A, B, C]
新列表: [B, C, D]（头部插入 D）

无 key（按索引对比）:
  索引 0: A → B（更新）
  索引 1: B → C（更新）
  索引 2: C → D（更新）→ 3 次 DOM 操作

有 key:
  A 被删除，D 被新增，B 和 C 不动 → 2 次 DOM 操作
```

### 5.4 更新流程总结

```
State/Props 变化
      │
      ▼
  Render 阶段（可中断）
  ├── 构建 Fiber 树
  ├── 与旧树 Diff
  └── 标记副作用（flags）
      │
      ▼
  Commit 阶段（不可中断）
  ├── Before Mutation（读取 DOM 快照）
  ├── Mutation（执行 DOM 操作）
  └── Layout（执行 useLayoutEffect、ref 回调）
```

---

## 6. 响应式原理 — Vue Proxy vs React

### 6.1 响应式的本质

**响应式 = 数据变化自动触发 UI 更新（或其他副作用）**

核心需要解决两个问题：
1. **追踪**：知道数据什么时候变了
2. **通知**：数据变了之后通知谁

### 6.2 Vue 的 Proxy 响应式

Vue 3 使用 `Proxy` 实现细粒度响应式：

```js
// 简化版原理
const targetMap = new WeakMap() // 存储依赖关系

function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)  // 收集依赖：谁在读取这个属性
      return Reflect.get(obj, key, receiver)
    },
    set(obj, key, value, receiver) {
      const result = Reflect.set(obj, key, value, receiver)
      trigger(obj, key)  // 触发更新：通知依赖这个属性的 effect
      return result
    }
  })
}
```

**工作流程：**

```
1. 组件渲染时读取 state.count → Proxy.get 拦截 → track() 记录"该组件依赖 count"
2. 用户操作修改 state.count = 5 → Proxy.set 拦截 → trigger() 找到依赖的组件
3. 只重新渲染依赖 count 的组件（精确到属性级别）
```

**Vue 2 的局限（`Object.defineProperty`）：**
- 无法检测属性的新增/删除（必须用 `Vue.set`）
- 无法检测数组索引直接赋值（`arr[0] = newVal`）
- Vue 3 的 Proxy 完美解决以上问题

### 6.3 React 的响应式（单向数据流 + 重新渲染）

React **没有**细粒度响应式，采用的是不同的哲学：

```jsx
const [count, setCount] = useState(0)

// setCount 调用 → 触发组件函数重新执行 → 生成新 Virtual DOM → Diff → 更新 DOM
setCount(1)
```

**React 的响应式模型：**

```
setState(newValue)
      │
      ▼
  调度更新（Scheduler）
      │
      ▼
  组件函数重新执行（整个组件）
      │
      ▼
  生成新的 Virtual DOM
      │
      ▼
  与旧 Virtual DOM Diff
      │
      ▼
  最小化 DOM 更新
```

### 6.4 架构模式对比（MVC vs MVVM）

React 和 Vue 选择了不同的架构模式，决定了它们数据流的方向和开发者的心智模型。

**React — 单向数据流（类似 MVC）**

```
              用户操作（onClick / onChange）
                  │
                  ▼
View (JSX) ──→ setState / dispatch ──→ 新 State ──→ 重新渲染 ──→ View 更新
   ▲                                                               │
   └──────────────────── 状态驱动视图 ◄─────────────────────────────┘

数据流方向: State → View → 用户操作 → setState → 新 State → View
                   └─────────── 单向流动 ───────────┘
```

核心特点：
- View 层变化**不会**自动更新数据层
- 开发者必须**手动**调用 `setState` / `useState` 触发更新
- 数据流方向单一，易于追踪和调试

```jsx
// React: 手动连接 View 和 State
function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      {/*  ↑ 点击 → 手动调用 setter → 触发重新渲染 */}
    </div>
  )
}
```

**Vue — 双向数据绑定（MVVM）**

```
View (Template) ◄──── 自动同步 ────→ ViewModel (Proxy 响应式数据)
       │                                    ▲
       │ v-model                            │
       ▼                                    │
   用户输入 ──→ 自动更新数据 ──→ 自动触发视图更新

数据流方向: Data ←→ View（双向自动同步）
```

核心特点：
- 通过 `v-model` 实现**双向数据绑定**
- View 层变化会**自动**同步到数据层，反之亦然
- 框架内部通过 Proxy / Object.defineProperty 自动追踪

```vue
<!-- Vue: 直接修改数据，自动触发视图更新 -->
<template>
  <div>
    <p>{{ count }}</p>
    <button v-on:click="count++">+1</button>
    <!-- ↑ 直接修改数据 → Proxy 拦截 → 自动触发视图更新 -->
  </div>
</template>

<script>
export default {
  data() { return { count: 0 } }  // 可变数据，Proxy 自动追踪
}
</script>
```

**架构差异总结**

| 维度 | React（单向流） | Vue（双向绑定） |
|------|---------------|---------------|
| **架构模式** | 类 MVC | MVVM |
| **数据流方向** | 单向（State → View） | 双向（Data ↔ View） |
| **View → Data** | 需手动调用 setter | `v-model` 自动同步 |
| **表单处理** | 受控组件：`value` + `onChange` | `v-model` 一行搞定 |
| **心智模型** | "状态是唯一数据源，UI 是状态的投影" | "数据与视图自动同步" |

> **注意**：Vue 的双向绑定本质上是单向数据流 + 语法糖。`v-model` 是 `:value` + `@input` 的简写，框架帮你自动完成了 View → Data 的同步。React 则把这个控制权交给了开发者。

### 6.5 核心对比：响应式机制

| 维度 | Vue (Proxy) | React |
|------|------------|-------|
| **追踪方式** | 自动追踪（Proxy 拦截 get/set） | 手动触发（setState） |
| **更新粒度** | 属性级别（精确到哪个数据变了） | 组件级别（整个组件函数重新执行） |
| **开发者心智** | "数据驱动"：改数据 → 自动更新 | "状态机"：新状态 → 重新渲染 |
| **性能优化** | 框架自动完成（依赖收集） | 开发者手动控制（memo、useMemo、useCallback） |
| **可变性** | 可变（直接修改 `state.count++`） | 不可变（必须 `setState(newState)`） |

```jsx
// Vue: 可变 + 自动追踪
this.count++           // 直接修改，自动触发更新

// React: 不可变 + 手动触发
const [count, setCount] = useState(0)
count++                // ❌ 不会触发更新
setCount(count + 1)    // ✅ 必须用 setter
```

### 6.6 为什么 React 选择组件级更新

1. **简洁性**：不需要复杂的依赖收集系统，组件函数就是"渲染函数"
2. **可预测性**：每次渲染都是纯函数 `f(state) = UI`，没有隐藏的依赖追踪
3. **并发能力**：因为不依赖细粒度追踪，React 可以中断/恢复渲染（Fiber 架构的基础）
4. **JSX 灵活性**：`useMemo`、条件渲染等在任何位置都可以，不受模板限制

> Vue 的细粒度追踪在模板编译体系中效率极高（编译时就知道哪些是动态绑定），但与 React 的"渲染就是纯函数"哲学不兼容。

---

## 7. 构建工具 — Webpack 核心流程 vs Vite

### 7.1 Webpack 核心工作流程

Webpack 是**打包器（Bundler）**：从入口出发，递归构建依赖图，将所有模块打包成 bundle。

```
入口(entry)
    │
    ▼
┌─────────────────────────────────────────┐
│  1. 构建依赖图                           │
│     entry → import → import → ...       │
│     递归解析所有模块的依赖关系             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  2. Loader 转换                          │
│     .js → babel-loader → ES5            │
│     .css → css-loader → style-loader    │
│     .ts → ts-loader → JS                │
│     每种文件类型经过匹配的 Loader 链处理    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  3. Plugin 钩子                          │
│     在整个流程的各个阶段插入自定义逻辑      │
│     emit → 插入 HTML、拷贝静态资源等       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  4. 输出(Output)                         │
│     bundle.js、chunk.js、vendor.js...    │
│     Code Splitting、Tree Shaking         │
└─────────────────────────────────────────┘
```

**核心概念：**

```js
// webpack.config.js
module.exports = {
  entry: './src/index.js',       // 入口
  output: {                       // 输出
    path: '/dist',
    filename: '[name].[contenthash].js'
  },
  module: {
    rules: [                      // Loader：处理非 JS 文件
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.ts$/, use: 'ts-loader' },
    ]
  },
  plugins: [                      // Plugin：扩展功能
    new HtmlWebpackPlugin(),
    new MiniCssExtractPlugin(),
  ]
}
```

### 7.2 Webpack 的开发模式瓶颈

开发环境下，Webpack 也需要先**完整打包**再启动 dev server：

```
修改一个文件
    │
    ▼
重新打包整个依赖图（即使只改了一行）
    │
    ▼
HMR（Hot Module Replacement）计算增量更新
    │
    ▼
浏览器接收更新

问题：项目越大 → 依赖图越大 → 启动越慢、HMR 越慢
```

### 7.3 Vite 的思路

Vite 的核心理念：**开发时不打包，利用浏览器原生 ESM（ES Modules）**

```
浏览器请求页面
    │
    ▼
Vite Dev Server（按需编译）
    │
    ├── 请求 /src/main.js → 直接返回（原生 ESM）
    │       import { App } from './App.vue'
    │
    ├── 请求 /src/App.vue → 即时编译 → 返回 JS 模块
    │
    └── 请求 /src/utils.js → 即时编译 → 返回 JS 模块

没有打包步骤！浏览器需要什么才编译什么
```

**生产构建：** 使用 Rollup 打包（不是 Webpack），因为 Rollup 的 ESM 输出更优。

### 7.4 Webpack vs Vite 对比

| 维度 | Webpack | Vite |
|------|---------|------|
| **开发启动** | 先完整打包，再启动 dev server | 不打包，按需即时编译 |
| **启动速度** | 随项目增大而变慢（O(项目大小)） | 几乎恒定（只编译当前请求） |
| **HMR 速度** | 需要重新构建受影响的模块图 | 精确到单个模块，毫秒级 |
| **生态成熟度** | 极其丰富（Loader、Plugin 海量） | 快速增长，部分场景需兼容处理 |
| **生产打包** | 自身完成 | 使用 Rollup |
| **配置复杂度** | 较高（需要理解 Loader/Plugin 链） | 开箱即用，配置少 |
| **适用场景** | 复杂企业项目、需要精细控制 | 新项目、追求开发体验 |

### 7.5 为什么 Vite 开发时这么快

1. **原生 ESM**：浏览器自己负责模块解析，Vite 只需当"编译代理"
2. **esbuild 预构建**：用 Go 编写的 esbuild 处理依赖预构建，比 JS 工具快 10-100x
3. **按需编译**：只编译浏览器请求的文件，不处理未使用的代码
4. **强缓存**：依赖预构建结果缓存，二次启动几乎瞬间

```
Webpack 启动（无论项目大小）:
  解析全部模块 → 构建 bundle → 启动 server
  [████████████████████████████████████] 30s+

Vite 启动（无论项目大小）:
  启动 server → 等待浏览器请求 → 按需编译
  [█] 300ms
```

### 7.6 趋势

- **Webpack 5** 引入了 Module Federation（微前端）和持久缓存，仍在积极发展
- **Vite** 已成为 Vue、React、Svelte 等新项目的默认构建工具
- **Turbopack**（Vercel 出品）是 Webpack 团队的新一代方案，兼容 Webpack 生态，目前在 Next.js 中可用
- **Rspack**（字节跳动出品）是 Webpack 的 Rust 重写版，API 兼容 Webpack 但速度快 5-10x

---

> **面试技巧：** 回答构建工具类问题时，先说核心原理（Webpack 是"先打包再服务"，Vite 是"先服务再按需编译"），再对比具体差异，最后结合自己的项目经验说明选择理由。

---

## 8. 构建优化 — Webpack/Vite 构建速度优化手段

### 8.1 优化思路总览

构建优化可以从**两个方向**切入：

```
构建优化
├── 缩小构建范围（少做事）
│   ├── 减少处理的文件数量
│   ├── 排除不需要的模块
│   └── 缩小 Loader/Plugin 的作用域
│
└── 提升处理速度（快做事）
    ├── 缓存（避免重复计算）
    ├── 多线程（并行处理）
    └── 更快的工具（替换慢的实现）
```

### 8.2 Webpack 优化手段

#### 一、缩小构建范围

**1. 合理配置 `include/exclude`**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,   // 排除第三方库（已编译过）
        // 或更精确：
        include: path.resolve('src'),  // 只处理 src 目录
        use: 'babel-loader',
      }
    ]
  }
}
```

**2. 优化 `resolve.modules` 和 `resolve.extensions`**

```js
resolve: {
  modules: [path.resolve('node_modules')],  // 限定查找路径，避免逐层向上搜索
  extensions: ['.js', '.jsx', '.ts'],       // 按使用频率排列，减少尝试次数
  alias: {
    '@': path.resolve('src'),               // 别名减少路径解析开销
  }
}
```

**3. `noParse` 跳过大型库的解析**

```js
module.exports = {
  module: {
    // 这些库已经是打包好的，不需要解析 import/require
    noParse: /lodash|jquery/
  }
}
```

#### 二、缓存

**4. 持久化缓存（Webpack 5 内置）**

```js
module.exports = {
  cache: {
    type: 'filesystem',        // 磁盘缓存（非内存）
    buildDependencies: {
      config: [__filename],    // 配置文件变化时失效
    }
  }
}
```

**效果：** 二次构建速度提升 60-80%，Webpack 5 最重要的优化之一。

**5. Loader 级别缓存**

```js
use: ['cache-loader', 'babel-loader']  // Webpack 4 方案
// 或 babel-loader 自带
use: {
  loader: 'babel-loader',
  options: { cacheDirectory: true }     // 缓存到 node_modules/.cache
}
```

#### 三、多线程

**6. `thread-loader` 并行编译**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'thread-loader',
            options: { workers: 4 }  // 开 4 个 worker
          },
          'babel-loader'
        ]
      }
    ]
  }
}
```

> **注意：** `thread-loader` 有启动开销（~600ms），只在项目大（模块数多）时才值得用。小项目反而更慢。

#### 四、替换更快的工具

**7. 用 `swc-loader` 或 `esbuild-loader` 替代 `babel-loader`**

```js
// swc（Rust 编写，比 Babel 快 20x）
use: 'swc-loader'

// esbuild（Go 编写，比 Babel 快 100x）
use: 'esbuild-loader'
```

**8. 用更快的工具替代 `ts-loader`**

```js
// ❌ ts-loader：全量类型检查 + 转译，慢
use: 'ts-loader'

// ✅ 方案一：fork-ts-checker-webpack-plugin + babel-loader
//   转译用 babel（快），类型检查放独立线程
use: 'babel-loader',
plugins: [new ForkTsCheckerWebpackPlugin()]

// ✅ 方案二：swc-loader（原生支持 TypeScript 转译）
use: 'swc-loader'
```

#### 五、DLL 预编译（Webpack 4 常用，Webpack 5 已不推荐）

```js
// webpack.dll.config.js — 单独打包第三方库
module.exports = {
  entry: { vendor: ['react', 'react-dom', 'lodash'] },
  output: { filename: '[name].dll.js', path: 'dll' },
  plugins: [new webpack.DllPlugin({ name: '[name]', path: 'dll/[name].json' })]
}

// webpack.config.js — 引用预编译的 DLL
plugins: [
  new webpack.DllReferencePlugin({ manifest: require('./dll/vendor.json') })
]
```

> **Webpack 5 中**：`cache: { type: 'filesystem' }` 基本替代了 DLL 的作用，不再需要手动维护 DLL 配置。

#### 六、生产构建优化

**9. 代码分割（Code Splitting）**

```js
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /node_modules/,
        name: 'vendor',
        chunks: 'all',
      }
    }
  }
}
```

**10. Tree Shaking**

```js
// package.json
"sideEffects": false  // 告诉 Webpack 所有文件都没有副作用，可以安全移除未使用的 export

// 或指定有副作用的文件
"sideEffects": ["*.css", "*.scss"]
```

**11. 分析包体积**

```bash
# 生成可视化报告，找出体积大的模块
npx webpack --analyze
# 或使用 webpack-bundle-analyzer
```

### 8.3 Vite 优化手段

Vite 开发模式已经很快，优化主要集中在**生产构建**和**大型项目**场景：

**1. 依赖预构建优化**

```js
// vite.config.js
export default {
  optimizeDeps: {
    include: ['lodash-es', 'axios'],   // 强制预构建
    exclude: ['my-local-package'],     // 排除不需要预构建的包
  }
}
```

**2. 手动分包（Manual Chunks）**

```js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-utils': ['lodash-es', 'dayjs'],
      }
    }
  }
}
```

**3. 开启 gzip/brotli 压缩**

```js
// vite-plugin-compression
import compress from 'vite-plugin-compression'

plugins: [
  compress({ algorithm: 'gzip' }),
  compress({ algorithm: 'brotliCompress' }),
]
```

**4. 图片/资源优化**

```js
build: {
  rollupOptions: {
    output: {
      assetFileNames: 'assets/[hash][extname]',  // 静态资源命名
    }
  },
  // 小于 4KB 的资源内联为 base64
  assetsInlineLimit: 4096,
}
```

### 8.4 通用优化策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **按需加载** | `import()` 动态导入，路由级代码分割 | SPA 所有页面 |
| **CDN 外置** | React/Vue 等用 CDN 引入，不打包 | 生产环境 |
| **SSR/SSG** | 服务端渲染，减少客户端构建压力 | SEO 敏感页面 |
| **Monorepo 优化** | 使用项目引用（Project References），避免全量构建 | 大型 monorepo |
| **升级工具链** | Webpack 4 → 5、Node.js 升到最新 LTS | 所有项目 |

### 8.5 面试回答框架

```
1. 先定性："构建慢要从两个方向分析 —— 缩范围和提速度"
2. 说具体手段（挑 3-4 个你实际用过的）：
   - "我用 cache: filesystem 解决了二次构建慢的问题，从 50s 降到 10s"
   - "把 babel-loader 换成 swc-loader 后，JS 编译快了 5 倍"
3. 提一下分析工具："用 webpack-bundle-analyzer 发现 moment.js 占了 300KB，
   换成 dayjs 后包体积减少了 280KB"
4. 总结："优化不是一次性的，应该在 CI 中加入构建时间监控"
```

> **关键原则：** 先量化（用工具测量哪里慢），再优化（对症下药），最后验证（对比优化前后的构建时间和包体积）。盲目优化是浪费时间。
