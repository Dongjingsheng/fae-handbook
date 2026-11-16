// ESLint 配置 — Vue3 项目轻量规则 (flat config)
// 用法：npm run lint
// 策略：只保留"语义类"检查（未用变量/未捕获错误/空块），
//      关闭缩进、属性顺序等纯风格噪音——对个人项目收益低、干扰大。
import vue from 'eslint-plugin-vue'
import js from '@eslint/js'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'dev.log', '*.log']
  },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        history: 'readonly',
        location: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        FileReader: 'readonly',
        confirm: 'readonly',
        requestAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      // 语义类（保留）
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-empty': 'error',
      // 风格噪音（关闭）
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/attributes-order': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'off',
      // 允许 $refs 这类模板用法
      'vue/no-refs-attributes': 'off'
    }
  }
]