// ============================================================
// md.js — 零依赖迷你 Markdown 渲染器（用于笔记预览）
// 支持：# 标题 / **加粗** / *斜体* / ~~删除~~ / `行内代码`
//       - 无序列表 / 1. 有序列表 / > 引用 / ``` 代码块
//       --- 分隔线 / | 表格 | / [链接](url) / ![图片](url)
// 安全：先转义全部 HTML，再渲染 Markdown，防脚本注入
// ============================================================

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inline(text) {
  let s = escapeHtml(text)
  // 行内代码（先处理，避免代码里的 * 被加粗）
  s = s.replace(/`([^`]+)`/g, (m, c) => '<code>' + c + '</code>')
  // 图片 ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (m, alt, url) => '<img src="' + url + '" alt="' + alt + '" loading="lazy" />')
  // 链接 [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (m, txt, url) => '<a href="' + url + '" target="_blank" rel="noopener">' + txt + '</a>')
  // 加粗 **text**（不能跨空格）
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  // 删除线 ~~text~~
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
  // 斜体 *text*（单一星号）
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  return s
}

function renderTable(rows) {
  // rows: 每行是分隔后的单元格数组
  const head = rows[0] || []
  const body = rows.slice(1)
  let out = '<table><thead><tr>'
  head.forEach(c => { out += '<th>' + inline(c.trim()) + '</th>' })
  out += '</tr></thead><tbody>'
  body.forEach(r => {
    out += '<tr>'
    r.forEach(c => { out += '<td>' + inline(c.trim()) + '</td>' })
    out += '</tr>'
  })
  out += '</tbody></table>'
  return out
}

export function renderMarkdown(src) {
  if (!src) return '<p class="md-empty">（暂无笔记内容）</p>'
  const lines = String(src).replace(/\r\n/g, '\n').split('\n')
  const out = []
  let i = 0
  let listType = null      // 'ul' | 'ol'
  let inCode = false
  let codeBuf = []
  let inQuote = false
  let quoteBuf = []
  let inTable = false
  let tableRows = []
  let paraBuf = []

  const flushPara = () => {
    if (paraBuf.length) {
      out.push('<p>' + inline(paraBuf.join('\n')) + '</p>')
      paraBuf = []
    }
  }
  const flushList = () => {
    if (listType) { out.push('</' + listType + '>'); listType = null }
  }
  const flushQuote = () => {
    if (inQuote) { out.push('<blockquote>' + quoteBuf.join('') + '</blockquote>'); inQuote = false; quoteBuf = [] }
  }
  const flushTable = () => {
    if (inTable) { out.push(renderTable(tableRows)); inTable = false; tableRows = [] }
  }

  for (; i < lines.length; i++) {
    const line = lines[i]

    // 代码块
    if (/^```/.test(line.trim())) {
      flushPara(); flushList(); flushQuote(); flushTable()
      if (!inCode) { inCode = true; codeBuf = []; continue }
      out.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>')
      inCode = false; codeBuf = []
      continue
    }
    if (inCode) { codeBuf.push(line); continue }

    // 空行 → 结束所有块
    if (line.trim() === '') {
      flushPara(); flushList(); flushQuote(); flushTable()
      continue
    }

    // 表格：检测表头行 + 分隔行（|---|）
    if (!inTable && line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushPara(); flushList(); flushQuote()
      inTable = true
      tableRows = [line.trim().replace(/^\||\|$/g, '').split('|')]
      i++ // 跳过分隔行
      continue
    }
    if (inTable) {
      if (line.trim().startsWith('|')) {
        tableRows.push(line.trim().replace(/^\||\|$/g, '').split('|'))
        continue
      }
      flushTable()
    }

    // 标题
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flushPara(); flushList(); flushQuote()
      out.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>')
      continue
    }

    // 分隔线
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      flushPara(); flushList(); flushQuote(); flushTable()
      out.push('<hr />')
      continue
    }

    // 引用
    const q = line.match(/^>\s?(.*)$/)
    if (q) {
      flushPara(); flushList(); flushTable()
      if (!inQuote) { inQuote = true }
      quoteBuf.push('<p>' + inline(q[1]) + '</p>')
      continue
    }
    flushQuote()

    // 无序列表
    const ul = line.match(/^\s*[-*+]\s+(.*)$/)
    if (ul) {
      flushPara()
      if (listType !== 'ul') { flushList(); out.push('<ul>'); listType = 'ul' }
      out.push('<li>' + inline(ul[1]) + '</li>')
      continue
    }
    // 有序列表
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (ol) {
      flushPara()
      if (listType !== 'ol') { flushList(); out.push('<ol>'); listType = 'ol' }
      out.push('<li>' + inline(ol[1]) + '</li>')
      continue
    }
    flushList()

    // 普通段落文本（连续行合并为一个段落）
    paraBuf.push(line.trim())
    // 如果下一行是标题/列表/表格等，立即冲刷防止粘连
    const next = lines[i + 1]
    if (next !== undefined && (
      /^#{1,6}\s/.test(next) || /^\s*[-*+]\s+/.test(next) || /^\s*\d+[.)]\s+/.test(next) ||
      /^```/.test(next.trim()) || /^\s*([-*_])\1{2,}\s*$/.test(next) || next.trim() === ''
    )) {
      flushPara()
    }
  }

  flushPara(); flushList(); flushQuote(); flushTable()
  if (inCode) out.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>')
  return out.join('\n')
}