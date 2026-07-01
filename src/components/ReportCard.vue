<script setup>
defineProps({
  cardPreview: {
    type: Object,
    required: true
    // { total_score, tagline, main_vulnerability }
  }
})
defineEmits(['click'])
</script>

<template>
  <div class="report-card" @click="$emit('click')" role="button" tabindex="0">
    <div class="report-card__head">
      <div class="report-card__icon">📊</div>
      <div class="report-card__title">费曼诊断报告生成完毕</div>
      <div class="report-card__arrow">›</div>
    </div>

    <div class="report-card__body">
      <div class="report-card__score">
        <span class="num">{{ cardPreview.total_score }}</span>
        <span class="den">/ 10</span>
      </div>
      <div class="report-card__meta">
        <div class="tagline">{{ cardPreview.tagline }}</div>
        <div class="vuln">
          <span class="label">核心盲区</span>
          <span class="value">{{ cardPreview.main_vulnerability }}</span>
        </div>
      </div>
    </div>

    <div class="report-card__footer">点击查看完整三维剖析 →</div>
  </div>
</template>

<style scoped>
.report-card {
  margin: 18px auto;
  max-width: 520px;
  background: var(--color-bg-card);
  color: var(--color-text-on-primary);
  border-radius: var(--radius-lg);
  padding: 18px 20px 14px;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  animation: slide-up 0.3s ease;
}
.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(79, 107, 255, 0.28);
}
.report-card:focus-visible {
  outline: 2px solid #ffffffaa;
  outline-offset: 2px;
}

.report-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.92;
}
.report-card__icon { font-size: 18px; }
.report-card__title { flex: 1; font-weight: 600; }
.report-card__arrow { font-size: 20px; line-height: 1; }

.report-card__body {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 14px 0 8px;
}
.report-card__score {
  display: flex;
  align-items: baseline;
  gap: 2px;
  white-space: nowrap;
}
.report-card__score .num {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}
.report-card__score .den {
  font-size: 14px;
  opacity: 0.85;
}
.report-card__meta {
  flex: 1;
  min-width: 0;
}
.tagline {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
  line-height: 1.45;
}
.vuln {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.vuln .label {
  background: rgba(255, 255, 255, 0.22);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}
.vuln .value {
  font-weight: 600;
}

.report-card__footer {
  text-align: right;
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}
</style>
