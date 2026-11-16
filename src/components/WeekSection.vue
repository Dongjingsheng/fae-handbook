<script setup>
// ============================================================
// WeekSection.vue — 周区块（含 DayCard 列表）
// ============================================================
import DayCard from './DayCard.vue'

defineProps({
  week: Object,
  isDone: Function,
  weekDone: Function,
  openDayId: String
})
defineEmits(['toggle', 'open'])
</script>

<template>
  <section class="week" :id="week.id">
    <div class="week-head">
      <div class="week-badge" :class="'wb-' + week.phase">{{ week.badge }}</div>
      <div class="week-info">
        <h2>{{ week.title }}</h2>
        <div class="sub">{{ week.sub }}</div>
      </div>
      <div class="week-meta">
        <b>本周掌握标准：</b>{{ week.accept }}<br>
        <b>工具：</b>{{ week.tools }}
      </div>
      <div style="min-width:130px;">
        <div class="week-progress"><div :class="'pg-' + week.phase" :style="{ width: weekDone(week) + '%' }"></div></div>
        <div class="week-progress-label">{{ weekDone(week) }}%</div>
      </div>
    </div>

    <div class="days">
      <DayCard
        v-for="d in week.days"
        :key="d.id"
        :day="d"
        :phase="week.phase"
        :week-id="week.id"
        :is-done="isDone"
        :is-open="d.id === openDayId"
        @toggle="(day, i) => $emit('toggle', day, i)"
        @open="day => $emit('open', day)"
      />
    </div>

    <div v-if="week.weekend" class="weekend"><b>周末加油站：</b>{{ week.weekend }}</div>
  </section>
</template>