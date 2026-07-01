<script setup>
import { onMounted, ref, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import MessageBubble from '@/components/MessageBubble.vue'
import LoadingBubble from '@/components/LoadingBubble.vue'
import ReportCard from '@/components/ReportCard.vue'
import ReportDrawer from '@/components/ReportDrawer.vue'
import ChatInput from '@/components/ChatInput.vue'

const store = useChatStore()
const drawerOpen = ref(false)
const messageListEl = ref(null)

/** 滚到底部 */
async function scrollToBottom(smooth = true) {
  await nextTick()
  const el = messageListEl.value
  if (!el) return
  el.scrollTo({
    top: el.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

/** 监听消息变化：每次新增都滚到底 */
watch(
  () => store.messages.length,
  () => scrollToBottom()
)
/** loading 出现时也滚一下（气泡高度会变） */
watch(
  () => store.isLocked,
  (locked) => locked && scrollToBottom()
)

onMounted(async () => {
  await store.bootstrap()
  scrollToBottom(false)
})

function handleSend(text) {
  store.sendUserMessage(text)
}

async function handleRestart() {
  drawerOpen.value = false
  await store.resetSession()
  await store.bootstrap()
  scrollToBottom(false)
}

function openDrawer() {
  if (!store.reportData?.finalReport) return
  drawerOpen.value = true
}
</script>

<template>
  <div class="chat-view">
    <!-- 顶部 Header -->
    <header class="chat-header">
      <div class="logo">📚</div>
      <div class="title">
        <div class="title-main">费曼伴学 · 智能体</div>
        <div class="title-sub">Dijkstra 路径规划 · 费曼讲练</div>
      </div>
    </header>

    <!-- 消息区 -->
    <main ref="messageListEl" class="chat-main">
      <div class="chat-main__inner">
        <MessageBubble
          v-for="m in store.messages"
          :key="m.id"
          :role="m.role"
          :content="m.content"
        />

        <LoadingBubble v-if="store.isLocked && !store.isReportReady" />

        <!-- 报告卡片：熔断后插入到对话流尾部 -->
        <ReportCard
          v-if="store.isReportReady && store.reportData?.cardPreview"
          :card-preview="store.reportData.cardPreview"
          @click="openDrawer"
        />
      </div>
    </main>

    <!-- 底部输入区 -->
    <ChatInput
      :locked="store.isLocked"
      :finished="store.isReportReady"
      @send="handleSend"
      @restart="handleRestart"
    />

    <!-- 报告抽屉 -->
    <ReportDrawer
      :open="drawerOpen"
      :report="store.reportData?.finalReport"
      @close="drawerOpen = false"
    />
  </div>
</template>

<style scoped>
.chat-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  z-index: 5;
}
.logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.title-main {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}
.title-sub {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* 消息主区 */
.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 0;
}
.chat-main__inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 12px 0 24px;
}
</style>
