# React Props & State 学习笔记

## 核心概念

| 概念 | 本质 | 代码体现 |
|------|------|---------|
| **Props** | 外部传入的数据（只读） | `<MyButton label="Hello" onClick={fn} />` |
| **State** | 组件内部管理的数据（可变） | `const [num, setNum] = useState(0)` |

> **一句话区分**：Props 是"别人给我的"，State 是"我自己管的"。

## 组件结构

```
App (根组件)
  ├─ state: count
  └─ <MyCom label="点我+1" render={(num) => <p>{num}</p>} />
       ├─ state: num (自管理)
       ├─ props: label, render (来自 App)
       └─ <MyButton label onClick disabled />
            └─ props: label, onClick, disabled? (来自 MyCom)
```

## 关键模式

### 1. Interface 定义 Props 合约

```tsx
interface MyButtonProps {
  label: string;           // 必传
  onClick: () => void;     // 必传函数
  disabled?: boolean;      // 可选（?标记）
}
```

### 2. 解构赋值 + 默认值

```tsx
function MyButton({ label, onClick, disabled = false }: MyButtonProps) {
  // 直接用 label, onClick, disabled，不需要 props.xxx
}
```

### 3. Render Props（控制反转）

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

### 4. 状态封装 vs 状态提升

- **封装（本例）**：MyCom 用 `useState` 自管理 `num`，独立可复用，但父组件无法直接控制
- **提升**：状态放在 App，通过 props 传入子组件，父组件拥有完全控制权
- 选择依据：**谁需要这个数据，状态就放在谁那里**

## 参考代码

- `src/components/MyCom.tsx` — Props 接口定义、Render Props、State 管理
- `src/App.tsx` — 父组件传值、render prop 使用
