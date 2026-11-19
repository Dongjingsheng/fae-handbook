<script setup>
// ============================================================
// SearchPanel.vue — 全站内容搜索（天标题/任务/讲义/资源/产出）
// ============================================================
import { ref, computed } from 'vue'

const props = defineProps({
  searchAll: Function,
  weeksData: Array
})
const emit = defineEmits(['open-day'])

const q = ref('')
const results = ref([])
const searched = ref(false)

const resultCount = computed(() => results.value.length)

function doSearch() {
  if (!q.value.trim()) { results.value = []; searched.value = false; return }
  results.value = props.searchAll(q.value, 50)
  searched.value = true
}
function clearSearch() {
  q.value = ''
  results.value = []
  searched.value = false
}
function openResult(r) {
  const all = props.weeksData.flatMap(w => w.days)
  const day = all.find(d => d.id === r.dayId)
  if (day) emit('open-day', day)
}

// 键盘 Enter 触发搜索
function onKey(e) {
  if (e.key === 'Enter') doSearch()
}
</script>

<template>
  <div class="sb-search">
    <div class="sb-search-input">
      <input
        v-model="q"
        type="search"
        placeholder="🔍 搜索知识点（如：CL时序）"
        @input="doSearch"
        @keyup.enter="onKey"
      />
      <button v-if="q" class="sb-search-clear" @click="clearSearch" title="清空">✕</button>
    </div>
    <div v-if="searched" class="sb-search-res">
      <div v-if="results.length" class="sb-search-count">共 {{ resultCount }} 条结果，点结果进入该天</div>
      <div v-else class="sb-search-count none">没有找到相关内容，换个关键词试试</div>
      <div v-for="(r, i) in results" :key="i" class="sb-search-item" @click="openResult(r)">
        <span class="ssi-badge" :title="r.dayTitle">D{{ r.dot }}</span>
        <div class="ssi-body">
          <div class="ssi-type">{{ { title: '📌 标题', task: '✅ 任务', lecture: '📖 讲义', resource: '🔗 资源', tool: '🛠 工具', out: '📦 产出' }[r.type] || r.type }}</div>
          <div class="ssi-title">{{ r.text }}</div>
          <div class="ssi-where">{{ r.where }} · {{ r.dayDate }}</div>
        </div>
      </div>
    </div>
  </div>
</template>