// ============================================================
// validate-data.mjs — weeks.js 内容健壮性校验器
// 用法：npm run validate
// 在手动编辑 src/data/weeks.js 后运行，防止结构被改坏
// ============================================================
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wkPath = path.resolve(__dirname, 'src/data/weeks.js')

let errors = []
let warnings = []

try {
  const raw = readFileSync(wkPath, 'utf-8')
  if (!raw.includes('export const weeksData =')) {
    errors.push('weeks.js 缺少导出语句 <export const weeksData =>，文件结构异常')
    process.exit(1)
  }
  const jsonStr = raw.slice(raw.indexOf('= ') + 2).trim().replace(/;\s*$/, '')
  let weeks
  try {
    weeks = JSON.parse(jsonStr)
  } catch (e) {
    errors.push(`JSON 解析失败: ${e.message}`)
    process.exit(1)
  }

  if (!Array.isArray(weeks) || weeks.length === 0) errors.push('weeks 必须是数组且非空')
  else {
    const seenDays = new Set()
    const seenIds = new Set()
    weeks.forEach((w, wi) => {
      if (!w.id) errors.push(`weeks[${wi}] 缺 id`)
      if (!w.badge) errors.push(`weeks[${wi}] 缺 badge`)
      if (!w.title) errors.push(`weeks[${wi}](${w.id}) 缺 title`)
      if (!Array.isArray(w.days)) errors.push(`weeks[${wi}](${w.id}) days 必须为数组`)
      else w.days.forEach((d, di) => {
        if (seenIds.has(d.id)) errors.push(`day id 重复: ${d.id}`)
        seenIds.add(d.id)
        if (!d.id || !/^d\d+$/.test(d.id)) errors.push(`${w.id}-day${di} id 格式异常: ${d.id}`)
        if (!d.title) errors.push(`${w.id}-${d.dot} 缺 title`)
        if (!Array.isArray(d.tasks) || d.tasks.length === 0) errors.push(`${w.id}-${d.dot} tasks 不能为空`)
        if (d.tasks.some(t => typeof t !== 'string' || !t.trim())) errors.push(`${w.id}-${d.dot} 存在空任务`)
        if (!Array.isArray(d.lectures)) errors.push(`${w.id}-${d.dot} lectures 必须为数组`)
        else d.lectures.forEach((l, li) => {
          if (!l.title || !l.title.trim()) errors.push(`${w.id}-${d.dot} lecture[${li}] 缺标题`)
          if (!l.html || l.html.trim().length < 30) warnings.push(`${w.id}-${d.dot} lecture「${l.title || '?'}」内容过短(<30字符)`)
        })
        if (d.resources !== undefined && !Array.isArray(d.resources)) errors.push(`${w.id}-${d.dot} resources 必须为数组`)
        if (Array.isArray(d.resources)) d.resources.forEach((r, ri) => {
          if (!r.url || !/^https?:\/\//.test(r.url)) errors.push(`${w.id}-${d.dot} 资源[${ri}] url 非法: ${r?.url}`)
          if (!r.label) warnings.push(`${w.id}-${d.dot} 资源[${ri}] 缺 label`)
        })
      })
    })
  }

  // 统计
  const dayCount = weeks.reduce((a, w) => a + (w.days?.length || 0), 0)
  const lecCount = weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + (d.lectures?.length || 0), 0), 0)
  const taskCount = weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + (d.tasks?.length || 0), 0), 0)
  console.log('📊 数据统计: 周=%d 天=%d 任务=%d 讲义=%d', weeks.length, dayCount, taskCount, lecCount)

  if (errors.length) {
    console.error('\n❌ 校验失败，存在 %d 个错误:', errors.length)
    errors.slice(0, 20).forEach(e => console.error('  ✗', e))
    process.exit(1)
  }
  if (warnings.length) {
    console.log('\n⚠️ %d 个警告（不阻止构建）:', warnings.length)
    warnings.slice(0, 10).forEach(w => console.log('  ⚠', w))
  }
  console.log('\n✅ 数据校验通过')
} catch (e) {
  console.error('❌ 校验脚本异常:', e.message)
  process.exit(1)
}