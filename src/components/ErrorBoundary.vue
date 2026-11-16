<script setup>
// ============================================================
// ErrorBoundary.vue — 全局错误边界
// 任一子组件渲染出错时，显示可恢复的错误提示而不白屏
// ============================================================
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

// 正确注册 Vue 错误捕获钩子（<script setup> 必须用 onXxx 形式）
onErrorCaptured((err, _instance, info) => {
  error.value = {
    message: err && err.message ? err.message : String(err),
    info: info || ''
  }
  // 只捕获渲染错误，不放回父级（避免连锁白屏）
  return false
})

function reset() {
  error.value = null
}
</script>

<template>
  <div v-if="error" class="error-boundary">
    <div class="eb-box">
      <h3>⚠️ 页面遇到了一个小问题</h3>
      <p class="eb-msg">{{ error.message }}</p>
      <p class="eb-info">{{ error.info }}</p>
      <button @click="reset">🔄 点此恢复（数据不会丢失）</button>
      <p class="eb-tip">提示：若反复出现，可能是某篇讲义数据异常，可重新构建或联系维护者。</p>
    </div>
  </div>
  <slot v-else />
</template>