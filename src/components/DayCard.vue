<script setup>
// ============================================================
// DayCard.vue — 单个学习日卡片（列表页使用）
// ============================================================
defineProps({
  day: Object,
  phase: String,
  weekId: String,
  isDone: Function,
  isOpen: Boolean
})
defineEmits(['toggle', 'open'])
</script>

<template>
  <div class="day" :id="day.id" :class="{ active: isOpen }" @click="$emit('open', day)">
    <div class="day-head">
      <div class="day-dot" :style="{ background: { P1: '#2563eb', P2: '#d97706', P3: '#059669', M: '#7c3aed' }[phase] || '#475569' }">{{ day.dot }}</div>
      <div>
        <div class="day-title">{{ day.title }}</div>
        <div class="day-date">{{ day.date }}</div>
      </div>
    </div>
    <ul>
      <li v-for="(t, i) in day.tasks" :key="i" :class="{ done: isDone(day.id, i) }">
        <input type="checkbox" :checked="isDone(day.id, i)" @click.stop @change="$emit('toggle', day, i)" />
        <span>{{ t }}</span>
      </li>
    </ul>
    <div v-if="day.tools" class="tools"><b>工具/资料：</b>{{ day.tools }}</div>
    <div v-if="day.resources && day.resources.length" class="res">
      <span class="res-title">📚 今日学习资源</span>
      <div class="res-row">
        <a v-for="(r, ri) in day.resources" :key="ri" :class="r.type" :href="r.url" target="_blank" rel="noopener" @click.stop>{{ r.label }}</a>
      </div>
    </div>
    <div v-if="day.out" class="out"><b>当日产出：</b>{{ day.out }}</div>
    <div class="day-entry"><span>📖 进入学习页 →</span></div>
  </div>
</template>