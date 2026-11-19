// ============================================================
// useStore.js — 全局状态与逻辑 (独立 JS)
// 进度存储 / 详情页 / 笔记 全部逻辑在此，组件只做装配
// ============================================================
import { ref, computed } from 'vue'
import { weeksData } from '../data/weeks.js'

const STORE_KEY = 'fae_plan_progress_v1'
const NOTE_KEY = 'fae_note_'

// ---- 变更通知（云同步用）----
let changeHandler = null
export function onStoreChange(fn) { changeHandler = fn }
function notifyChange() { if (changeHandler) changeHandler() }

function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') } catch { return {} }
}

const store = ref(loadStore())
const currentDay = ref(null)   // 详情页当前天对象
const savedScroll = ref(0)
const noteText = ref('')
const noteMsg = ref('')

function saveStore() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store.value)) } catch { /* 存储失败忽略 */ }
}

// ---- 进度 ----
function key(dayId, idx) { return dayId + '-' + idx }
function isDone(dayId, idx) { return !!store.value[key(dayId, idx)] }
function toggleTask(d, idx) {
  const k = key(d.id, idx)
  store.value[k] = !store.value[k]
  saveStore()
  notifyChange()
}
const totalTasks = computed(() =>
  weeksData.reduce((a, w) => a + w.days.reduce((b, d) => b + d.tasks.length, 0), 0)
)
const doneTasks = computed(() =>
  weeksData.reduce((a, w) => a + w.days.reduce((b, d) =>
    b + d.tasks.filter((_, i) => store.value[key(d.id, i)]).length, 0), 0)
)
function weekDone(w) {
  let t = 0, done = 0
  w.days.forEach(d => d.tasks.forEach((_, i) => { t++; if (store.value[key(d.id, i)]) done++ }))
  return t ? Math.round(done / t * 100) : 0
}

// ---- 阶段统计（P1/P2/P3/M 各自总任务/已完成/百分比） ----
function phaseStats() {
  const phases = ['P1', 'P2', 'P3', 'M']
  return phases.map(p => {
    const ws = weeksData.filter(w => w.phase === p)
    let total = 0, done = 0
    ws.forEach(w => w.days.forEach(d => d.tasks.forEach((_, i) => {
      total++
      if (store.value[key(d.id, i)]) done++
    })))
    return {
      phase: p,
      name: { P1: '原理与规格', P2: '故障诊断', P3: '独立实战', M: '深化期' }[p] || p,
      icon: { P1: '🟦', P2: '🟨', P3: '🟩', M: '🟪' }[p] || '📌',
      color: { P1: '#2563eb', P2: '#d97706', P3: '#059669', M: '#7c3aed' }[p] || '#475569',
      total, done,
      pct: total ? Math.round(done / total * 100) : 0
    }
  })
}

// ---- 周辅助 ----
function weekOf(day) {
  return weeksData.find(w => w.days.some(d => d.id === day.id)) || weeksData[0]
}
function phaseName(w) {
  return { P1: '原理与规格', P2: '故障诊断', P3: '独立实战', M: '深化期' }[w.phase] || ''
}
function phaseIcon(w) {
  return { P1: '🟦', P2: '🟨', P3: '🟩', M: '🟪' }[w.phase] || '📌'
}
function phaseColor(phase) {
  return { P1: '#2563eb', P2: '#d97706', P3: '#059669', M: '#7c3aed' }[phase] || '#475569'
}
function weekShort(title) {
  // 取标题主段，去掉冒号后修饰
  const m = String(title).match(/^(.+?)[：:]/)
  return m ? m[1] : String(title).slice(0, 10)
}

// ---- 详情页 ----
function applyDetailState(day) {
  currentDay.value = day
  noteText.value = localStorage.getItem(NOTE_KEY + day.id) || ''
  noteMsg.value = ''
  document.body.style.overflow = 'hidden'
}
function openDetail(day) {
  savedScroll.value = window.scrollY
  applyDetailState(day)
  // 用 pushState 产生历史条目，使浏览器后退键可返回总览
  if (location.hash !== '#' + day.id) {
    history.pushState(null, '', '#' + day.id)
  }
}
function closeDetail() {
  if (!currentDay.value) return
  const scroll = savedScroll.value
  currentDay.value = null
  document.body.style.overflow = ''
  if (location.hash) {
    // 有 hash 时用 replaceState 清掉（不新增历史，避免死循环），并触发渲染
    history.replaceState(null, '', location.pathname + location.search)
  }
  requestAnimationFrame(() => window.scrollTo(0, scroll))
}
function openDetailFromHash(h) {
  if (!h) { closeDetail(); return }
  const day = weeksData.flatMap(w => w.days).find(x => x.id === h)
  if (day) applyDetailState(day)
}
function initHash() {
  // URL 直挂 hash（如 #d3）时打开对应天
  const h = location.hash.replace('#', '')
  if (h) openDetailFromHash(h)
  // 浏览器前进/后退、手动改 hash 都走这里
  window.addEventListener('popstate', () => {
    openDetailFromHash(location.hash.replace('#', ''))
  })
}

// ---- 笔记 ----
function saveNote() {
  if (!currentDay.value) return
  localStorage.setItem(NOTE_KEY + currentDay.value.id, noteText.value)
  noteMsg.value = '✓ 笔记已保存'
  notifyChange()
  setTimeout(() => { noteMsg.value = '' }, 3000)
}
function clearNote() {
  if (!confirm('确定清空当前笔记吗？此操作不可恢复。')) return
  noteText.value = ''
  if (currentDay.value) localStorage.removeItem(NOTE_KEY + currentDay.value.id)
  noteMsg.value = '已清空笔记'
  notifyChange()
  setTimeout(() => { noteMsg.value = '' }, 3000)
}
function importNote(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    noteText.value = ev.target.result
    noteMsg.value = '✓ 已导入「' + file.name + '」，记得点保存'
    setTimeout(() => { noteMsg.value = '' }, 4000)
    e.target.value = ''
  }
  reader.readAsText(file, 'utf-8')
}

// ---- 滚动 ----
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ---- 收集所有笔记（导出/云同步共用） ----
function collectNotes() {
  const notes = {}
  weeksData.forEach(w => w.days.forEach(d => {
    const n = localStorage.getItem(NOTE_KEY + d.id)
    if (n) notes[d.id] = n
  }))
  return notes
}

// ---- 进度/笔记 导出与导入（跨设备迁移，数据备份） ----
function exportData() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: store.value,
    notes: collectNotes()
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'FAE手册数据备份-' + new Date().toISOString().slice(0, 10) + '.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importData(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('未选择文件'))
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data || typeof data !== 'object') throw new Error('JSON 格式不对')
        // 导入进度（只接受合法 day-key）
        const validKeys = new Set()
        weeksData.forEach(w => w.days.forEach(d => d.tasks.forEach((_, i) => validKeys.add(d.id + '-' + i))))
        if (data.progress && typeof data.progress === 'object') {
          const next = {}
          Object.keys(data.progress).forEach(k => { if (validKeys.has(k) && data.progress[k]) next[k] = 1 })
          store.value = next
          saveStore()
        }
        // 导入笔记
        if (data.notes && typeof data.notes === 'object') {
          Object.keys(data.notes).forEach(k => {
            if (weeksData.some(w => w.days.some(d => d.id === k))) {
              localStorage.setItem(NOTE_KEY + k, String(data.notes[k]))
            }
          })
        }
        resolve({ progress: Object.keys(store.value).length, notes: data.notes ? Object.keys(data.notes).length : 0 })
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file, 'utf-8')
  })
}

// ---- 搜索（全站内容检索：天标题/任务/讲义/资源/产出） ----
function searchAll(query, limit = 60) {
  const q = String(query || '').trim().toLowerCase()
  if (q.length < 1) return []
  const results = []
  const push = (day, type, text, where) => {
    if (results.length >= limit) return
    results.push({
      dayId: day.id, dayTitle: day.title, dayDate: day.date, dot: day.dot,
      type, text: String(text), where: String(where || '').slice(0, 80)
    })
  }
  function hit(day, field) {
    return field !== undefined && field !== null && String(field).toLowerCase().includes(q)
  }
  weeksData.forEach(w => w.days.forEach(d => {
    const tasks = d.tasks || []
    const lectures = d.lectures || []
    const resources = d.resources || []
    // 标题
    if (hit(d, d.title)) push(d, 'title', d.title, '第' + d.dot + '天')
    // 任务
    tasks.forEach((t, i) => { if (String(t).toLowerCase().includes(q)) push(d, 'task', t, '任务' + (i + 1)) })
    // 讲义（标题 + 正文去掉标签）
    lectures.forEach((lec, li) => {
      if (String(lec.title).toLowerCase().includes(q)) push(d, 'lecture', lec.title, '讲义' + (li + 1))
      else if (lec.html && String(lec.html).toLowerCase().includes(q)) {
        const plain = String(lec.html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)
        push(d, 'lecture', lec.title, plain)
      }
    })
    // 资源
    resources.forEach((r) => { if (String(r.label).toLowerCase().includes(q)) push(d, 'resource', r.label, '资源') })
    // 工具/产出
    if (hit(d, d.tools)) push(d, 'tool', d.tools, '工具')
    if (hit(d, d.out)) push(d, 'out', d.out, '产出')
  }))
  return results
}

export function useStore() {
  return {
    weeksData,
    store, currentDay, noteText, noteMsg,
    totalTasks, doneTasks,
    isDone, toggleTask, weekDone, phaseStats,
    weekOf, phaseName, phaseIcon, phaseColor, weekShort,
    openDetail, closeDetail, initHash,
    saveNote, clearNote, importNote, scrollToSection,
    exportData, importData, collectNotes, searchAll
  }
}