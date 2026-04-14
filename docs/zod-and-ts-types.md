# Zod 与 TypeScript 类型系统学习笔记

> 学习时间: 2026-04-14

---

## 一、TypeScript 内置 Utility Types

TS 提供了一组**全局工具类型**，用于从已有类型派生新类型。这些工具类型在 Zod 的 schema 操作中有对应的 API。

### 1.1 Partial<Type> — 所有属性变可选

```typescript
interface User {
    id: string
    name: string
    age: number
}

type PartialUser = Partial<User>
// 等价于: { id?: string; name?: string; age?: number }
```

**典型场景：** 更新函数的参数，只传需要修改的字段。

```typescript
function updateUser(id: string, updates: Partial<User>) {
    // updates 可以只包含 { name: "新名字" }，不必传完整对象
}
```

### 1.2 Required<Type> — 所有属性变必填（Partial 的反操作）

```typescript
interface Config {
    host?: string
    port?: number
}

type StrictConfig = Required<Config>
// 等价于: { host: string; port: number }
```

### 1.3 Pick<Type, Keys> — 从类型中选取部分属性

```typescript
type UserBasic = Pick<User, "id" | "name">
// 等价于: { id: string; name: string }
```

### 1.4 Omit<Type, Keys> — 从类型中排除部分属性

```typescript
type UserWithoutId = Omit<User, "id">
// 等价于: { name: string; age: number }
```

### 1.5 对比总结

| Utility Type | 作用 | 示例 |
|--------------|------|------|
| `Partial<T>` | 所有属性变可选 | `{ a: string }` → `{ a?: string }` |
| `Required<T>` | 所有属性变必填 | `{ a?: string }` → `{ a: string }` |
| `Pick<T, K>` | 只保留指定属性 | 从 `{a, b, c}` 取 `{a, b}` |
| `Omit<T, K>` | 排除指定属性 | 从 `{a, b, c}` 去掉 `c` |

> Pick 和 Omit 互为反向操作：`Pick<User, "id">` 等价于 `Omit<User, "name" | "age">`

### 1.6 其他常用 Utility Types

```typescript
// Readonly — 所有属性变只读
type ReadonlyUser = Readonly<User>
// 等价于: { readonly id: string; readonly name: string; readonly age: number }

// Record<Keys, Type> — 构建键值对类型
type UserMap = Record<string, User>
// 等价于: { [key: string]: User }

// ReturnType — 获取函数返回值类型
function getUser() { return { id: "1", name: "zod" } }
type UserType = ReturnType<typeof getUser>
// 等价于: { id: string; name: string }
```

---

## 二、Zod — Schema 验证与类型推导

### 2.1 Zod 是什么？

**Zod** = TypeScript-first 的 schema 声明与验证库。

核心思想：**用同一个 schema 同时完成运行时验证和类型推导**。

```typescript
// 传统方式：类型和验证分离，容易不一致
interface User { id: string; name: string }  // 编译时类型
function validate(data: unknown): User { ... }  // 运行时验证（手写）

// Zod 方式：一个 schema 搞定两件事
const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
})
type User = z.infer<typeof UserSchema>  // 自动推导，永远同步
```

### 2.2 Schema 定义

```typescript
import z from "zod"

// 基础类型
z.string()
z.number()
z.boolean()
z.date()

// 带约束
z.string().min(3).max(20)
z.string().email("请输入有效邮箱")
z.number().int().positive()

// 组合类型
z.object({ name: z.string(), age: z.number() })
z.array(z.string())               // string[]
z.tuple([z.string(), z.number()]) // [string, number]
z.union([z.string(), z.number()]) // string | number
z.enum(["a", "b", "c"])           // "a" | "b" | "c"

// 可选与默认值
z.string().optional()       // string | undefined
z.string().nullable()       // string | null
z.string().default("hello") // 缺省时填 "hello"
```

### 2.3 验证方式

```typescript
// parse — 验证失败抛异常
const user = UserSchema.parse(data)

// safeParse — 不抛异常，返回结果对象（推荐）
const result = UserSchema.safeParse(data)
if (result.success) {
    console.log(result.data)   // 类型安全的 User
} else {
    console.log(result.error.issues)  // 详细错误信息
}
```

---

## 三、Zod 与 TS Utility Types 的对应关系

这是理解 Zod schema 操作的关键 — **每个 Zod 方法都对应一个 TS 工具类型**。

### 3.1 对照表

| TS Utility Type | Zod 方法 | 效果 |
|-----------------|----------|------|
| `Partial<T>` | `.partial()` | 所有字段变可选 |
| `Required<T>` | `.required()` | 所有字段变必填 |
| `Pick<T, K>` | `.pick({ key: true })` | 只保留指定字段 |
| `Omit<T, K>` | `.omit({ key: true })` | 排除指定字段 |
| — | `.extend({})` | 添加新字段（类似交叉类型 `&`） |
| — | `.merge(otherSchema)` | 合并两个 schema |
| — | `.transform()` | 验证后转换数据 |

### 3.2 代码对比

```typescript
const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    age: z.number(),
})

// ── Partial ──
// TS:  type PartialUser = Partial<User>
// Zod: const PartialUserSchema = UserSchema.partial()
// 结果: { id?: string; name?: string; age?: number }

// ── Pick ──
// TS:  type UserBasic = Pick<User, "id" | "name">
// Zod: const UserBasicSchema = UserSchema.pick({ id: true, name: true })
// 结果: { id: string; name: string }

// ── Omit ──
// TS:  type UserWithoutId = Omit<User, "id">
// Zod: const UserWithoutIdSchema = UserSchema.omit({ id: true })
// 结果: { name: string; age: number }

// ── 类型推导始终同步 ──
type FromTS = Partial<{ id: string; name: string; age: number }>
type FromZod = z.infer<typeof PartialUserSchema>
// 两者结构完全相同！
```

### 3.3 为什么用 Zod 而不是只用 TS？

| 维度 | TS Utility Types | Zod |
|------|-----------------|-----|
| 存在时机 | 仅编译时 | 编译时 + 运行时 |
| 验证外部数据 | ❌ 不能 | ✅ `parse()` / `safeParse()` |
| 错误信息 | 类型报错 | 详细的 `issues` 数组 |
| 使用场景 | 类型变换 | 数据验证 + 类型推导 |

> **结论：** TS 处理编译时类型变换，Zod 处理运行时数据验证。两者配合使用。

---

## 四、实用场景

### 4.1 API 响应验证

```typescript
const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
})

async function fetchUser(id: string) {
    const res = await fetch(`/api/users/${id}`)
    const result = UserSchema.safeParse(await res.json())
    if (!result.success) {
        throw new Error("API 返回数据格式异常")
    }
    return result.data  // 类型安全的 User
}
```

### 4.2 表单验证

```typescript
const FormSchema = z.object({
    email: z.string().email("请输入有效邮箱"),
    password: z.string().min(8, "密码至少 8 位"),
    age: z.coerce.number().min(0).max(150),
})

// z.coerce 自动把字符串表单值转为 number
// <input value="25" /> → age: 25 (number)
```

### 4.3 环境变量

```typescript
const EnvSchema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "production", "test"]),
})

const env = EnvSchema.parse(import.meta.env)
// 启动时就校验，缺少必要配置直接报错
```

---

## 五、ZodError 错误结构

```typescript
try {
    UserSchema.parse({ id: 1, name: 123 })  // 类型全部不对
} catch (error) {
    if (error instanceof z.ZodError) {
        error.issues.forEach((issue) => {
            console.log(issue.path)     // ["id"] 错误路径
            console.log(issue.message)  // "Expected string, received number"
            console.log(issue.code)     // "invalid_type"
        })
    }
}
```

---

## 六、学习洞察

- **单一数据源** — 一个 schema 定义同时产出类型 + 验证逻辑，消除类型与验证不一致的风险
- **z.infer 是桥梁** — 让 Zod schema 成为 TS 类型的唯一来源，不再手写 interface
- **safeParse 优于 parse** — 生产代码避免用 try/catch 处理预期内的验证失败
- **z.coerce** — 自动类型转换，处理表单/环境变量时非常实用
- **TS 工具类型 vs Zod** — TS 处理编译时变换，Zod 处理运行时验证，各自擅长不同层面
