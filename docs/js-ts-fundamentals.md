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
