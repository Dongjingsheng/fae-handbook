<script setup>
// ============================================================
// App.vue — 应用装配层
// 布局：SidebarNav + 主区域(Hero+WeekSection) + DetailPage
// 逻辑：全部来自 useStore.js
// ============================================================
import { onMounted, ref } from 'vue'
import { useStore } from './composables/useStore.js'
import ErrorBoundary from './components/ErrorBoundary.vue'
import SidebarNav from './components/SidebarNav.vue'
import WeekSection from './components/WeekSection.vue'
import DetailPage from './components/DetailPage.vue'

const {
  weeksData,
  currentDay, noteText, noteMsg,
  totalTasks, doneTasks,
  isDone, toggleTask, weekDone,
  weekOf, phaseName, phaseIcon, phaseColor, weekShort,
  openDetail, closeDetail, initHash,
  saveNote, clearNote, importNote, scrollToSection,
  exportData, importData
} = useStore()

const backupMsg = ref('')

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
      @scroll-to="scrollToSection"
      @export="exportData"
      @import="onImportBackup"
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