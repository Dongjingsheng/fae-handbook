<script setup>
// ============================================================
// SidebarNav.vue — 左侧导航（周跳转 + 阶段分组 + 数据备份 + 云同步）
// ============================================================
import { ref } from 'vue'
defineProps({
  weeksData: Array,
  weekShort: Function,
  weekDone: Function,
  phaseName: Function,
  phaseIcon: Function,
  totalTasks: Number,
  doneTasks: Number,
  backupMsg: String,
  syncState: Object,
  syncMsg: String
})
defineEmits(['scrollTo', 'export', 'import', 'sync-now', 'save-sync-token', 'clear-sync-token'])

const tokenInput = ref('')
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

    <!-- ================= 云同步（跨设备） ================= -->
    <div class="sb-backup">
      <div class="sb-group-title">☁️ 云同步 <span class="sync-dot" :class="{ on: syncState.configured }" :title="syncState.configured ? '已开' : '未开'"></span></div>
      <div v-if="!syncState.configured" class="sync-setup">
        <p class="sync-hint">配置后：本机进度/笔记自动同步到你的 GitHub 私有仓库存档，换设备再配置一次即可取回。</p>
        <input v-model="tokenInput" class="sync-token" type="password" placeholder="粘贴 GitHub Token (ghp_...)" autocomplete="off" />
        <button class="backup-btn export" style="width:100%;margin-top:6px;" :disabled="syncState.syncing" @click="$emit('save-sync-token', tokenInput)">
          {{ syncState.syncing ? '⏳ 连接中...' : '🔗 连接同步' }}
        </button>
      </div>
      <div v-else class="sync-setup">
        <p class="sync-hint">已连接私有仓库 fae-handbook-data</p>
        <div class="sync-row">
          <button class="backup-btn export" :disabled="syncState.syncing" @click="$emit('sync-now', 'auto')">{{ syncState.syncing ? '⏳ 同步中...' : '🔄 立即同步' }}</button>
          <button class="backup-btn" @click="$emit('clear-sync-token')">🔌 断开</button>
        </div>
        <p v-if="syncState.lastSync" class="sync-last">上次同步：{{ syncState.lastSync }}</p>
      </div>
      <div v-if="syncMsg" class="sync-msg" :class="{ err: syncState.error }">{{ syncMsg }}</div>
      <div v-if="syncState.error" class="sync-msg err">{{ syncState.error }}</div>
    </div>
  </aside>
</template>