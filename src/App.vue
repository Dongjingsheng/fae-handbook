<script setup>
// ============================================================
// App.vue — 应用装配层
// 布局：SidebarNav + 主区域(Hero+WeekSection) + DetailPage
// 逻辑：全部来自 useStore.js
// ============================================================
import { onMounted, ref } from 'vue'
import { useStore, onStoreChange } from './composables/useStore.js'
import { useSync } from './composables/useSync.js'
import ErrorBoundary from './components/ErrorBoundary.vue'
import SidebarNav from './components/SidebarNav.vue'
import WeekSection from './components/WeekSection.vue'
import DetailPage from './components/DetailPage.vue'

const {
  weeksData,
  store,
  currentDay, noteText, noteMsg,
  totalTasks, doneTasks,
  isDone, toggleTask, weekDone,
  weekOf, phaseName, phaseIcon, phaseColor, weekShort,
  openDetail, closeDetail, initHash,
  saveNote, clearNote, importNote, scrollToSection,
  exportData, importData, collectNotes
} = useStore()

const {
  syncState,
  saveSyncToken, clearSyncToken,
  pullFromCloud, pushToCloud, mergeCloudIntoLocal,
  verifyToken, markSynced, isSyncConfigured
} = useSync()

const backupMsg = ref('')
const syncMsg = ref('')
let pushTimer = null

async function onImportBackup(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  try {
    const r = await importData(file)
    backupMsg.value = `✅ 导入成功：进度 ${r.progress} 项，笔记 ${r.notes} 条`
    if (currentDay.value) {
      noteText.value = localStorage.getItem('fae_note_' + currentDay.value.id) || ''
    }
  } catch (err) {
    backupMsg.value = '❌ 导入失败：' + (err.message || '未知错误')
  }
  setTimeout(() => { backupMsg.value = ''; e.target.value = '' }, 5000)
}

// ---------- 云同步 ----------
async function doPull() {
  syncState.value.syncing = true
  syncState.value.error = ''
  try {
    const cloud = await pullFromCloud()
    if (!cloud) { syncMsg.value = '☁️ 云端还没有数据（首次将从本机推送）'; return false }
    // 合并云端到本地
    const merged = mergeCloudIntoLocal(cloud, { ...store.value }, collectNotes())
    // 写回进度
    Object.keys(merged.progress).forEach(k => { store.value[k] = merged.progress[k] })
    try { localStorage.setItem('fae_plan_progress_v1', JSON.stringify(store.value)) } catch { /* 忽略写入失败 */ }
    // 写回笔记
    Object.keys(merged.notes).forEach(k => { localStorage.setItem('fae_note_' + k, merged.notes[k]) })
    if (currentDay.value) {
      noteText.value = localStorage.getItem('fae_note_' + currentDay.value.id) || ''
    }
    markSynced()
    syncMsg.value = '☁️ 已从云端同步（进度 ' + Object.keys(merged.progress).length + ' 项，笔记 ' + Object.keys(merged.notes).length + ' 条）'
    return true
  } catch (e) {
    syncState.value.error = e.message || String(e)
    syncMsg.value = '❌ 拉取失败：' + syncState.value.error
    return false
  } finally {
    syncState.value.syncing = false
  }
}

async function doPush() {
  if (!isSyncConfigured()) return
  syncState.value.syncing = true
  syncState.value.error = ''
  try {
    await pushToCloud({ ...store.value }, collectNotes())
    markSynced()
    syncMsg.value = '☁️ 已同步到云端 ' + new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } catch (e) {
    syncState.value.error = e.message || String(e)
    syncMsg.value = '❌ 推送失败：' + syncState.value.error
  } finally {
    syncState.value.syncing = false
  }
}

// 本地变更后 3 秒自动推送（防抖）
function schedulePush() {
  if (!isSyncConfigured()) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(doPush, 3000)
}
onStoreChange(schedulePush)

async function onSyncNow(mode) {
  if (mode === 'pull') { await doPull(); return }
  if (mode === 'push') { await doPush(); return }
  // 自动：先拉再推（保证拿到最新再合并上传）
  const ok = await doPull()
  if (ok !== false) await doPush()
}

async function onSaveSyncToken(token) {
  if (!token || !token.trim()) { syncMsg.value = '请输入 Token'; return }
  saveSyncToken(token)
  syncMsg.value = '⏳ 正在验证 Token & 拉取云端数据...'
  try {
    const login = await verifyToken()
    syncState.value.syncing = false
    if (!login) { syncMsg.value = '❌ Token 无效，请重新生成'; saveSyncToken(''); return }
    // 成功：拉取云端（合并）并推送本地
    await onSyncNow('auto')
    syncMsg.value = '☁️ 已连接（账号：' + login + '）' + (syncMsg.value.includes('云端') ? '，' + syncMsg.value : '')
  } catch (e) {
    syncState.value.error = e.message || String(e)
    syncMsg.value = '❌ 连接失败：' + syncState.value.error
    saveSyncToken('')
  }
}

function onClearSyncToken() {
  clearSyncToken()
  syncMsg.value = '☁️ 已断开云同步（本地数据不受影响）'
}

onMounted(() => { initHash() })
</script>

<template>
  <ErrorBoundary>
    <SidebarNav
      :weeks-data="weeksData"
      :week-short="weekShort"
      :week-done="weekDone"
      :phase-name="phaseName"
      :phase-icon="phaseIcon"
      :total-tasks="totalTasks"
      :done-tasks="doneTasks"
      :backup-msg="backupMsg"
      :sync-state="syncState"
      :sync-msg="syncMsg"
      @scroll-to="scrollToSection"
      @export="exportData"
      @import="onImportBackup"
      @sync-now="onSyncNow"
      @save-sync-token="onSaveSyncToken"
      @clear-sync-token="onClearSyncToken"
    />

  <div id="main">
    <div class="wrap">
      <!-- ================= Hero ================= -->
      <div class="hero" id="overview">
        <h1>🛡️ 内存FAE助理工程师 · 成长手册</h1>
        <p>汇钜存储科技（东莞）有限公司 · 12周每日训练 + M4-M6深化期 + 1-3年职业路径<br>
        每个工作日都有具体任务、讲义、资源和笔记，完成后勾选自动保存进度。</p>
        <div class="tags">
          <span class="tag">DDR4 / DDR5 内存模组</span>
          <span class="tag">客诉诊断 · FA报告</span>
          <span class="tag">信创测试</span>
          <span class="tag">QVL / 案例库</span>
        </div>
        <div id="global-progress"><div id="global-bar" :style="{ width: (totalTasks ? (doneTasks / totalTasks * 100) : 0) + '%' }"></div></div>
        <div id="global-text">总体进度：{{ doneTasks }} / {{ totalTasks }} 任务完成（{{ totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0 }}%）</div>
      </div>

      <!-- ================= 周区块列表 ================= -->
      <WeekSection
        v-for="w in weeksData"
        :key="w.id"
        :week="w"
        :is-done="isDone"
        :week-done="weekDone"
        :open-day-id="currentDay?.id || ''"
        @toggle="toggleTask"
        @open="openDetail"
      />

      <!-- ================= 职业路径 ================= -->
      <div class="career" id="career-path">
        <div class="career-head">
          <div style="font-size:24px;">🚀</div>
          <h2>1-3 年职业成长路径</h2>
        </div>
        <div class="career-body">
          <p style="font-size:14px;color:var(--muted);margin-bottom:8px;">从"会处理"到"能预见"，再到"能引领"。每个阶段都有明确的资产沉淀目标。</p>
          <div class="milestones">
            <div class="mstone"><h4>🟦 第 1 阶段 · 成长期（0-12个月）</h4><ul><li>身份：从助理到独立 FAE</li><li>12周上岗验收通过 + M4-M6 深化达标</li><li>独立处理常规客诉与 1 个以上 NTF</li><li>资产：案例库≥20例、排查手册V1、FAQ</li></ul></div>
            <div class="mstone"><h4>🟨 第 2 阶段 · 专家期（12-24个月）</h4><ul><li>身份：资深FAE / 细分领域专家</li><li>深耕方向：信创平台 / DDR5 / 失效分析</li><li>主导疑难客诉与项目导入，内部分享≥2次</li><li>资产：专业白皮书、行业案例影响力</li></ul></div>
            <div class="mstone"><h4>🟩 第 3 阶段 · 引领期（24-36个月）</h4><ul><li>身份：FAE主管 / 高级技术专家</li><li>管理线：带团队、建流程、定标准</li><li>技术线：公司级技术方向输入、行业发声</li><li>资产：团队能力、流程制度、行业口碑</li></ul></div>
          </div>
        </div>
      </div>

      <!-- ================= 页脚 ================= -->
      <footer>汇钜存储 · 内存FAE成长手册 · Vue3 版 v3.0 · 进度可导出备份 · 建议使用 Chrome/Edge</footer>
    </div>
  </div>

  <!-- ================= 详情学习页 ================= -->
    <DetailPage
      :day="currentDay"
      :is-done="isDone"
      :week-of="weekOf"
      :phase-color="phaseColor"
      :note-text="noteText"
      :note-msg="noteMsg"
      @close="closeDetail"
      @toggle="toggleTask"
      @update:note-text="noteText = $event"
      @save-note="saveNote"
      @clear-note="clearNote"
      @import-note="importNote"
    />
  </ErrorBoundary>
</template>