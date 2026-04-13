# JavaScript/TypeScript 语言基础

## Promise — 异步操作

`resolve` 是 Promise 的"完成开关"，调用它表示异步操作结束并交付结果：

```tsx
new Promise((resolve) => {
    setTimeout(() => resolve("结果"), 2000)  // 2秒后调用 resolve，交付 "结果"
})
```

Promise 三状态：`pending`（等待中）→ `resolve(值)` → `fulfilled`（已完成）

### 函数引用 vs 函数调用

setTimeout 传参的常见陷阱：

```tsx
// resolve 本身就是函数，不需要参数时直接传引用
setTimeout(resolve, 2000)                    // ✅ 2秒后调用 resolve()

// 需要传参时必须用箭头函数包裹
setTimeout(() => resolve("Hello"), 2000)     // ✅ 2秒后调用 resolve("Hello")

// ❌ 直接调用 — resolve 立即执行，传给 setTimeout 的是 undefined
setTimeout(resolve("Hello"), 2000)
```

> **规则**：`fn` 是函数引用，`fn()` 是函数调用结果。延迟调用且带参数时必须 `() => fn(args)`。

### 包装 setTimeout 为 Promise

```tsx
function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// 使用 — 配合 async/await 模拟网络延迟
await delay(1000)
```

## TypeScript 实用技巧

### as const — 锁定字面量类型

```tsx
// ❌ TypeScript 把 "fixed" 推断为 string，不匹配 React 的 Position 类型
const style = { position: "fixed", right: "10px" }

// ✅ as const 锁定为字面量类型
const style = { position: "fixed", right: "10px" } as const
//    ↑ JS 的 const：变量不能重新赋值
//                           ↑ TS 的 as const：把所有值锁定为字面量类型
```

TypeScript 的**类型拓宽（widening）**：对象中的 `"fixed"` 默认被推断为 `string`，因为 TS 认为变量可能被重新赋值。`as const` 告诉 TS "这些值不会变"，于是 `"fixed"` 变成字面量类型 `"fixed"`。

> 内联 `style={{ position: "fixed" }}` 不会拓宽，天然正确。提取成变量时才需要 `as const`。

### 泛型关联类型

```tsx
// <T> 让 asyncFunction 的返回类型和 data 的类型自动关联
export const useAsync = <T>(asyncFunction: () => Promise<T>) => {
    const [data, setData] = useState<T | null>(null)
    // ...
}

// 使用时 T 自动推断为 User，不需要手动标注 <User>
const { data } = useAsync(() => fetchUser(1))
// data 类型: User | null
```

## 浏览器 API 笔记

### 获取滚动位置

```tsx
// ✅ 推荐：两种渲染模式都能正确获取
window.scrollX   // 水平滚动距离（像素）
window.scrollY   // 垂直滚动距离（像素）

// ⚠️ 受渲染模式影响
document.body.scrollTop            // 标准模式下始终为 0
document.documentElement.scrollTop // 怪异模式下始终为 0
```

HTML 文件开头有没有 `<!DOCTYPE html>` 决定浏览器渲染模式：

| 渲染模式 | 有 DOCTYPE（标准模式） | 无 DOCTYPE（怪异模式） |
|---|---|---|
| 滚动容器 | `<html>` (documentElement) | `<body>` |
| `document.body.scrollTop` | 始终 0 | 正常值 |
| `document.documentElement.scrollTop` | 正常值 | 始终 0 |
| `window.scrollY` | 正常值 | 正常值 |

### 回到顶部

```tsx
// ✅ 推荐：跨浏览器兼容
window.scrollTo(0, 0)

// ⚠️ 同样受渲染模式影响
document.body.scrollTop = 0            // 标准模式下无效
document.documentElement.scrollTop = 0 // 怪异模式下无效
```

### 事件监听与清理

```tsx
// 注册：告诉浏览器"某事件发生时调用这个函数"
element.addEventListener("event", handler)
// 注销：停止监听
element.removeEventListener("event", handler)
```

关键要点：

- `addEventListener` 和 `removeEventListener` 必须传**同一个函数引用**，匿名函数每次都是新引用，remove 无效
- 不注销的后果：组件销毁后 handler 还在监听 → 事件触发操作已销毁的组件 → 内存泄漏
- React 中配合 `useEffect` 清理函数使用：

```tsx
useEffect(() => {
    const handler = () => { /* ... */ }
    window.addEventListener("scroll", handler)
    return () => { window.removeEventListener("scroll", handler) }
}, [])
```
