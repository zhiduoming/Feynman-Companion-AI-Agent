<script setup>
defineProps({
  role: {
    type: String,
    required: true // 'user' | 'ai' | 'system'
  },
  content: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <!-- 系统提示（如"网络异常"） -->
  <div v-if="role === 'system'" class="bubble-system">
    <span class="bubble-system__inner">{{ content }}</span>
  </div>

  <!-- 用户 / AI 气泡 -->
  <div
    v-else
    class="bubble-row"
    :class="[`bubble-row--${role}`]"
  >
    <div class="bubble-avatar" v-if="role === 'ai'">
      <span>AI</span>
    </div>

    <div class="bubble" :class="[`bubble--${role}`]">
      <div class="bubble__content">{{ content }}</div>
    </div>

    <div class="bubble-avatar bubble-avatar--user" v-if="role === 'user'">
      <span>我</span>
    </div>
  </div>
</template>

<style scoped>
/* 普通消息行 */
.bubble-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 14px 0;
  animation: slide-up 0.25s ease;
}
.bubble-row--user {
  justify-content: flex-end;
}

/* 头像 */
.bubble-avatar {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
.bubble-avatar--user {
  background: #ffd9a8;
  color: #b45309;
}

/* 气泡 */
.bubble {
  max-width: min(78%, 640px);
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  font-size: 15px;
  line-height: 1.65;
  word-break: break-word;
  white-space: pre-wrap;
  box-shadow: var(--shadow-sm);
}
.bubble--ai {
  background: var(--color-bg-ai);
  border: 1px solid var(--color-border);
  border-top-left-radius: 4px;
}
.bubble--user {
  background: var(--color-bg-user);
  color: var(--color-text-on-primary);
  border-top-right-radius: 4px;
}
.bubble__content {
  white-space: pre-wrap;
}

/* 系统提示 */
.bubble-system {
  text-align: center;
  margin: 16px 0;
}
.bubble-system__inner {
  display: inline-block;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--color-text-muted);
  background: rgba(0, 0, 0, 0.04);
  border-radius: 999px;
}
</style>
