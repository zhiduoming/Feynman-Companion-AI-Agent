<script setup>
import { ref, nextTick, watch } from 'vue'

const props = defineProps({
  locked: { type: Boolean, default: false },
  finished: { type: Boolean, default: false }
})
const emit = defineEmits(['send', 'restart'])

const text = ref('')
const textareaEl = ref(null)

function autoGrow() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function handleSubmit() {
  const value = text.value.trim()
  if (!value || props.locked || props.finished) return
  emit('send', value)
  text.value = ''
  nextTick(autoGrow)
}

function handleKeydown(e) {
  // Enter 发送，Shift+Enter 换行
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

watch(text, () => nextTick(autoGrow))
</script>

<template>
  <div class="chat-input">
    <div v-if="finished" class="input-finished">
      <span>🔒 本次费曼学习训练已完成</span>
      <button class="restart-btn" @click="$emit('restart')">重新开始</button>
    </div>

    <div v-else class="input-box">
      <textarea
        ref="textareaEl"
        v-model="text"
        rows="1"
        :placeholder="locked ? 'AI 小白正在努力思考你的逻辑…' : '请用大白话向小白解释 Dijkstra…'"
        :disabled="locked"
        @keydown="handleKeydown"
        @input="autoGrow"
      />
      <button
        class="send-btn"
        :disabled="locked || !text.trim()"
        @click="handleSubmit"
      >
        发送
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-input {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(247, 247, 245, 0) 0%, var(--color-bg) 30%);
  padding: 12px 16px 18px;
}

/* 已完成态 */
.input-finished {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  font-size: 14px;
  color: var(--color-text-soft);
  box-shadow: var(--shadow-sm);
}
.restart-btn {
  background: var(--color-accent);
  color: var(--color-text-on-primary);
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.15s;
}
.restart-btn:hover { opacity: 0.88; }

/* 输入态 */
.input-box {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  box-shadow: var(--shadow-md);
  transition: border-color 0.15s;
}
.input-box:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

textarea {
  flex: 1;
  resize: none;
  min-height: 24px;
  max-height: 160px;
  padding: 4px 6px;
  font-size: 15px;
  line-height: 1.55;
  background: transparent;
}

.send-btn {
  flex: 0 0 auto;
  background: var(--color-accent);
  color: var(--color-text-on-primary);
  padding: 8px 18px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.15s, transform 0.1s;
}
.send-btn:not(:disabled):hover { opacity: 0.9; }
.send-btn:not(:disabled):active { transform: scale(0.97); }
</style>
