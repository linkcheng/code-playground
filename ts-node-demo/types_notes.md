# TypeScript 类型系统笔记

## 1. TS 编译期 vs JS 运行时

**核心判断：代码编译成 JS 后还存不存在？**

| 层面 | 编译后 | 关键字/语法 |
|------|--------|------------|
| TS 编译期 | **擦除消失** | `interface`、`type`、`keyof`、`as`、泛型、`infer`、`enum`(const) |
| JS 运行时 | **保留** | `const`、`function`、`class`、`instanceof`、`Object.keys()` |
| 特殊 | 编译成 JS 对象 | `enum`（非 const） |

```
TS 代码
├── 类型层（编译期）→ 擦除，不进 JS
│     type / interface / keyof / as / 泛型约束 / infer
└── 值层（运行时）→ 保留，编译成 JS
      const / let / function / class / typeof / instanceof
```

### typeof 的双重身份

`typeof` 是唯一同时存在于 TS 编译期和 JS 运行时的关键字，根据**上下文**区分：

```ts
// TS 类型上下文 —— 编译时获取变量的 TS 类型
type Sem = typeof sem  // → Person

// JS 值上下文 —— 运行时返回 JS 类型字符串
console.log(typeof sem)  // → "object"
```

### 运行时判断对象类型的方法

```ts
// 1. instanceof —— 适用于 class 实例
d instanceof Dog  // true

// 2. in 操作符 —— 检查属性是否存在
'name' in sem  // true

// 3. 类型谓词（Type Predicate）—— 自定义类型守卫
function isPerson(val: unknown): val is Person {
  return typeof val === 'object' && val !== null && 'name' in val
}

// 4. Object.prototype.toString.call() —— 精确判断内建类型
Object.prototype.toString.call([])  // "[object Array]"

// 5. Zod 库 —— 复杂场景的运行时 schema 校验
import { z } from 'zod'
const PersonSchema = z.object({ name: z.string(), age: z.number() })
```

---

## 2. 类型操作符

### typeof —— 类型查询

在类型位置使用，获取变量的 TS 类型：

```ts
const sem: Person = { name: 'semlinker', age: 30 }
type Sem = typeof sem  // → Person（等价于 interface Person）

function toArray(x: number): number[] { return [x] }
type Func = typeof toArray  // → (x: number) => number[]
```

### keyof —— 获取类型的所有 key 的联合类型

```ts
type K1 = keyof Person          // "name" | "age"
type K2 = keyof Person[]        // "length" | "toString" | "pop" | ...
type K3 = keyof { [x: string]: Person }  // string | number
```

> `keyof` 是纯 TS 编译期操作符，运行时请用 `Object.keys()`

### infer —— 条件类型中提取子类型

类比 JS 的解构赋值，但作用在**类型层面**：

```ts
// 提取函数返回值类型
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never
type A = GetReturnType<() => string>  // string

// 提取数组元素类型
type UnpackedArray<T> = T extends (infer U)[] ? U : T
type U0 = UnpackedArray<number[]>  // number
```

**规则：** `infer` 只能在 `extends` 条件类型内部使用。

### 映射类型 —— 从联合类型生成对象类型

```ts
type Keys = "a" | "b" | "c"
type Obj = { [p in Keys]: any }  // → { a: any, b: any, c: any }
```

---

## 3. type vs interface

| 特性 | `type` | `interface` |
|------|--------|-------------|
| 定义对象类型 | ✅ | ✅ |
| 定义联合类型 (`A \| B`) | ✅ | ❌ |
| 定义基本类型别名 | ✅ | ❌ |
| 声明合并（自动合并同名） | ❌ | ✅ |
| 使用 `extends`/`implements` | 间接（通过交叉类型） | ✅ |

> 两者都是纯 TS 编译期语法，运行时全部擦除。选择原则：需要声明合并用 `interface`，否则用 `type`。
