<script setup>
// ============================================================
// DetailPage.vue — 单个学习日详情页（讲义全文 + 任务 + 资源 + 笔记）
// ============================================================
defineProps({
  day: Object,
  isDone: Function,
  weekOf: Function,
  phaseColor: Function,
  noteText: String,
  noteMsg: String
})
defineEmits(['close', 'toggle', 'update:noteText', 'saveNote', 'clearNote', 'importNote'])
</script>

<template>
  <div id="detail-page" :class="{ open: !!day }">
    <template v-if="day">
      <div class="detail-top">
        <button class="detail-back" @click="$emit('close')">← 返回总览</button>
        <div class="detail-top-info">
          <span class="dt-badge">{{ weekOf(day).badge }}</span>
          <span class="dt-date">{{ day.date }}</span>
          <h1>{{ day.title }}</h1>
        </div>
      </div>

      <div class="detail-body">
        <div class="day detail-clone">
          <div class="day-head">
            <div class="day-dot" :style="{ background: phaseColor(weekOf(day).phase) }">{{ day.dot }}</div>
            <div>
              <div class="day-title">{{ day.title }}</div>
              <div class="day-date">{{ day.date }}</div>
            </div>
          </div>
          <ul>
            <li v-for="(t, i) in day.tasks" :key="i" :class="{ done: isDone(day.id, i) }">
              <input type="checkbox" :checked="isDone(day.id, i)" @change="$emit('toggle', day, i)" />
              <span>{{ t }}</span>
            </li>
          </ul>
          <div v-if="day.tools" class="tools"><b>工具/资料：</b>{{ day.tools }}</div>

          <details v-for="(lec, li) in day.lectures" :key="li" class="lecture" open>
            <summary>{{ lec.title }}</summary>
            <div class="lec-body" v-html="lec.html"></div>
          </details>

          <div v-if="day.resources && day.resources.length" class="res">
            <span class="res-title">📚 今日学习资源</span>
            <div class="res-row">
              <a v-for="(r, ri) in day.resources" :key="ri" :class="r.type" :href="r.url" target="_blank" rel="noopener">{{ r.label }}</a>
            </div>
          </div>
          <div v-if="day.out" class="out"><b>当日产出：</b>{{ day.out }}</div>
        </div>

        <!-- 笔记板块 -->
        <div class="note-box" id="note-box">
          <div class="note-head"><span class="nb-title">📝 学习笔记</span><span class="nb-tip">本页笔记只属于当前学习日，自动保存到浏览器</span></div>
          <textarea
            :value="noteText"
            @input="$emit('update:noteText', $event.target.value)"
            placeholder="在这里记录今天学到的要点、疑问、案例。。。&#10;支持：直接打字 → 点「保存笔记」；或「导入笔记」读取 txt/md 文件。"
          ></textarea>
          <div class="note-tools">
            <button class="save" @click="$emit('saveNote')">💾 保存笔记</button>
            <button @click="$refs.noteFile.click()">📥 导入笔记(txt/md)</button>
            <button @click="$emit('clearNote')">🗑 清空</button>
            <input ref="noteFile" type="file" accept=".txt,.md,.markdown" style="display:none" @change="$emit('importNote', $event)" />
            <span class="note-msg">{{ noteMsg }}</span>
          </div>
        </div>

        <div class="detail-bottom-nav">
          <button class="detail-back" @click="$emit('close')">← 返回总览</button>
        </div>
      </div>
    </template>
  </div>
</template>