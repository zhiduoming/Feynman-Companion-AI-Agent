<script setup>
import { onBeforeUnmount, watch } from 'vue'
import RadarChart from './RadarChart.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  report: { type: Object, default: null } // final_report 完整对象
})
const emit = defineEmits(['close'])

function handleEsc(e) {
  if (e.key === 'Escape' && props.open) emit('close')
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEsc)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEsc)
    }
  }
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleEsc)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-mask" @click.self="$emit('close')">
        <div class="drawer-panel" role="dialog" aria-modal="true">
          <header class="drawer-header">
            <h2>费曼诊断报告</h2>
            <button class="drawer-close" @click="$emit('close')" aria-label="关闭">
              ×
            </button>
          </header>

          <div v-if="report" class="drawer-body">
            <!-- 总评 -->
            <section class="block">
              <h3 class="block-title">📝 总评摘要</h3>
              <p class="summary">{{ report.summary }}</p>
            </section>

            <!-- 四维雷达 -->
            <section class="block">
              <h3 class="block-title">🎯 四维评分雷达</h3>
              <RadarChart :dimensions="report.dimensions" />
            </section>

            <!-- 小白刁难点 -->
            <section class="block">
              <h3 class="block-title">❓ 小白刁难点</h3>
              <ul class="list">
                <li v-for="(q, i) in report.student_tricky_points" :key="i">
                  {{ q }}
                </li>
              </ul>
            </section>

            <!-- 回应漏洞 -->
            <section class="block">
              <h3 class="block-title">⚠️ 你的回应漏洞</h3>
              <div
                v-for="(v, i) in report.user_vulnerabilities"
                :key="i"
                class="vuln-card"
              >
                <div class="vuln-type">{{ v.type }}</div>
                <div class="vuln-detail">{{ v.detail }}</div>
              </div>
            </section>

            <!-- 深度剖析 -->
            <section class="block">
              <h3 class="block-title">🔬 深度原理剖析</h3>
              <p class="analysis">{{ report.deep_analysis }}</p>
            </section>
          </div>

          <div v-else class="drawer-empty">报告数据缺失</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 遮罩 */
.drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fade-in 0.2s ease;
}

/* 抽屉本体 */
.drawer-panel {
  width: 100%;
  max-width: 720px;
  max-height: 88vh;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  animation: slide-up 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

/* 桌面端居中模态框 */
@media (min-width: 768px) {
  .drawer-mask { align-items: center; }
  .drawer-panel {
    border-radius: var(--radius-xl);
    max-height: 80vh;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 14px;
  border-bottom: 1px solid var(--color-border);
}
.drawer-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.drawer-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 22px;
  line-height: 1;
  color: var(--color-text-soft);
  transition: background 0.15s;
}
.drawer-close:hover { background: var(--color-border); }

.drawer-body {
  padding: 18px 22px 24px;
  overflow-y: auto;
  flex: 1;
}

.drawer-empty {
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
}

/* 内容块 */
.block { margin-bottom: 22px; }
.block:last-child { margin-bottom: 0; }
.block-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-soft);
  letter-spacing: 0.2px;
}
.summary,
.analysis {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.75;
  color: var(--color-text);
  white-space: pre-wrap;
}

/* 列表 */
.list {
  margin: 0;
  padding-left: 20px;
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--color-text);
}
.list li { margin-bottom: 4px; }

/* 漏洞卡片 */
.vuln-card {
  background: #fff7ed;
  border-left: 3px solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 10px;
}
.vuln-type {
  font-size: 13px;
  font-weight: 600;
  color: #b45309;
  margin-bottom: 4px;
}
.vuln-detail {
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.65;
}

/* 过渡 */
.drawer-enter-from,
.drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel { transform: translateY(40px); }
</style>
