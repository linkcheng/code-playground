# React + TypeScript + Vite

## 项目创建

通过 Vite 官方脚手架创建，使用 `react-ts` 模板：

```bash
pnpm create vite react-ts-demo --template react-ts
cd react-ts-demo
pnpm install
```

创建后手动添加了路径别名配置（`@` → `./src`），见 `vite.config.ts`。

---

此模板提供了在 Vite 中运行 React 的最小化配置，包含 HMR 和一些 ESLint 规则。

目前有两个官方插件可用：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) 使用 [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) 使用 [SWC](https://swc.rs/)

## React 编译器

此模板未启用 React 编译器，因为它会影响开发和构建性能。如需启用，请参阅[此文档](https://react.dev/learn/react-compiler/installation)。

## 扩展 ESLint 配置

如果你正在开发生产级应用，建议更新配置以启用类型感知的 lint 规则：

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // 其他配置...

      // 移除 tseslint.configs.recommended，替换为以下配置
      tseslint.configs.recommendedTypeChecked,
      // 或者使用更严格的规则
      tseslint.configs.strictTypeChecked,
      // 可选：添加风格相关的规则
      tseslint.configs.stylisticTypeChecked,

      // 其他配置...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // 其他选项...
    },
  },
])
```

你还可以安装 [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) 和 [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) 以获取 React 专用的 lint 规则：

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // 其他配置...
      // 启用 React 的 lint 规则
      reactX.configs['recommended-typescript'],
      // 启用 React DOM 的 lint 规则
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // 其他选项...
    },
  },
])
```
