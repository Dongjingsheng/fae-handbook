<script setup>
// ============================================================
// SidebarNav.vue — 左侧导航（周跳转 + 阶段分组 + 数据备份）
// ============================================================
defineProps({
  weeksData: Array,
  weekShort: Function,
  weekDone: Function,
  phaseName: Function,
  phaseIcon: Function,
  totalTasks: Number,
  doneTasks: Number,
  backupMsg: String
})
defineEmits(['scrollTo', 'export', 'import'])
</script>

<template>
  <aside id="sidebar">
    <div class="sb-title">📘 内存FAE成长手册</div>
    <div class="sb-sub">汇钜存储 · 12周训练 + 深化期<br>Vue3 版 · 每日可勾选</div>

    <div class="sb-group-title">📌 总览</div>
    <a class="sb-link" href="#overview" @click.prevent="$emit('scrollTo', 'overview')">
      <span class="sb-week" style="background:rgba(148,163,184,.2);color:#e2e8f0;">总览</span>
      全局进度
      <span class="sb-prog">{{ totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0 }}%</span>
    </a>

    <template v-for="w in weeksData" :key="w.id">
      <div class="sb-group-title" :class="'gt-' + w.phase">{{ phaseIcon(w.phase) }} {{ phaseName(w) }}（{{ w.badge }}）</div>
      <a class="sb-link" :href="'#' + w.id" @click.prevent="$emit('scrollTo', w.id)">
        <span class="sb-week" :class="'b-' + w.phase">{{ w.badge }}</span>
        {{ weekShort(w.title) }}
        <span class="sb-prog">{{ weekDone(w) }}%</span>
      </a>
    </template>

    <div class="sb-backup">
      <div class="sb-group-title">💾 数据备份</div>
      <button class="backup-btn export" @click="$emit('export')">⬇ 导出进度/笔记</button>
      <button class="backup-btn" @click="$refs.backupFile.click()">⬆ 导入备份</button>
      <input ref="backupFile" type="file" accept=".json" style="display:none" @change="$emit('import', $event)" />
      <div v-if="backupMsg" class="backup-msg">{{ backupMsg }}</div>
    </div>
  </aside>
</template>