// md.test.mjs — renderMarkdown 单元测试
import { renderMarkdown } from './src/utils/md.js'

const cases = [
  ['标题', '# 一级标题\n## 二级标题', ['<h1>', '<h2>']],
  ['加粗斜体', '**粗体** 和 *斜体*', ['<strong>粗体</strong>', '<em>斜体</em>']],
  ['列表', '- 苹果\n- 香蕉\n1. 第一\n2. 第二', ['<ul>', '<ol>', '<li>苹果</li>', '<li>第一</li>']],
  ['引用', '> 重要提醒', ['<blockquote>', '重要提醒']],
  ['表格', '| 项 | 值 |\n|---|---|\n| A | 1 |\n| B | 2 |', ['<table>', '<th>项</th>', '<td>1</td>']],
  ['代码块', '```js\nconst x = 1\n```', ['<pre><code>', 'const x = 1']],
  ['行内代码', '用 `npm run build` 构建', ['<code>npm run build</code>']],
  ['链接', '点[这里](https://example.com)看', ['<a href="https://example.com" target="_blank" rel="noopener">这里</a>']],
  ['分隔线', '---', ['<hr />']],
  ['空内容', '', ['暂无笔记内容']],
  ['XSS防护', '<script>alert(1)</script>', ['&lt;script&gt;']],
]

let pass = 0, fail = 0
for (const [name, input, expects] of cases) {
  const html = renderMarkdown(input)
  const ok = expects.every(e => html.includes(e))
  if (ok) { pass++; console.log(`✅ ${name}`) }
  else { fail++; console.log(`❌ ${name}\n   输入: ${JSON.stringify(input)}\n   输出: ${html.slice(0, 300)}`) }
}
console.log(`\n结果: ${pass} 通过 / ${fail} 失败 / 共 ${cases.length}`)
process.exit(fail ? 1 : 0)