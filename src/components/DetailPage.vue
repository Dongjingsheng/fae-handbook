<script setup>
// ============================================================
// DetailPage.vue — 单个学习日详情页（讲义全文 + 任务 + 资源 + 笔记）
// ============================================================
import { ref, computed, watch } from 'vue'
import { renderMarkdown } from '../utils/md.js'

const props = defineProps({
  day: Object,
  isDone: Function,
  weekOf: Function,
  phaseColor: Function,
  noteText: String,
  noteMsg: String
})
const emit = defineEmits(['close', 'toggle', 'update:noteText', 'saveNote', 'clearNote', 'importNote'])

// 笔记视图模式：'edit' 编辑 / 'preview' 预览
const noteMode = ref('edit')
const noteSavedAt = ref('')
const noteRows = ref(10)

watch(() => props.day, () => {
  noteMode.value = 'edit'
  noteRows.value = Math.max(10, Math.min(24, String(props.noteText || '').split('\n').length + 2))
})

const notePreviewHtml = computed(() => renderMarkdown(props.noteText || ''))

function onNoteInput(e) {
  noteRows.value = Math.max(10, Math.min(24, e.target.value.split('\n').length + 2))
  emit('update:noteText', e.target.value)
}
function onSaveNote() {
  emit('saveNote')
  noteSavedAt.value = new Date().toLocaleString('zh-CN', { hour12: false })
  noteMode.value = 'preview' // 保存后自动切到预览看渲染效果
}
function onImportNote(e) {
  emit('importNote', e)
  noteMode.value = 'preview' // 导入后自动预览
  noteSavedAt.value = ''
}
function onClearNote() {
  if (!confirm('确定清空当前笔记吗？此操作不可恢复。')) return
  emit('clearNote')
  noteSavedAt.value = ''
  noteMode.value = 'edit'
}
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
          <div class="note-head">
            <span class="nb-title">📝 学习笔记</span>
            <span class="nb-tip">自动保存到浏览器 · 支持 Markdown 语法</span>
          </div>
          <div class="note-tabs">
            <button :class="{ active: noteMode === 'edit' }" @click="noteMode = 'edit'">✏️ 编辑</button>
            <button :class="{ active: noteMode === 'preview' }" @click="noteMode = 'preview'">👁 预览</button>
            <span v-if="noteSavedAt" class="note-saved-at">上次保存：{{ noteSavedAt }}</span>
          </div>
          <textarea
            v-if="noteMode === 'edit'"
            :value="noteText"
            :rows="noteRows"
            @input="onNoteInput"
            placeholder="在这里记录今天学到的要点、疑问、案例。。。&#10;支持 Markdown：&#10;# 大标题   ## 小标题&#10;**加粗**   *斜体*   `代码`&#10;- 列表项&#10;1. 有序项&#10;&gt; 引用&#10;```代码块```&#10;|---| 表格&#10;点「预览」查看渲染效果，或「导入笔记」读取 txt/md 文件。"
          ></textarea>
          <div v-else class="note-preview" v-html="notePreviewHtml"></div>
          <div class="note-tools">
            <button class="save" @click="onSaveNote">💾 保存笔记</button>
            <button @click="noteMode === 'preview' ? noteMode = 'edit' : $refs.noteFile.click()">📥 导入笔记(txt/md)</button>
            <button @click="onClearNote">🗑 清空</button>
            <input ref="noteFile" type="file" accept=".txt,.md,.markdown" style="display:none" @change="onImportNote" />
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