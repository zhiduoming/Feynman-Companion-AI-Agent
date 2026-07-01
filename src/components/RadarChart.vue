<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  /** { understanding_depth, expression_completeness, logic_coherence, structure_ability } */
  dimensions: {
    type: Object,
    required: true
  }
})

const chartEl = ref(null)
let chartInstance = null

const dimensionLabels = {
  understanding_depth: '理解深度',
  expression_completeness: '表达完整度',
  logic_coherence: '逻辑连贯性',
  structure_ability: '结构组织力'
}

function buildOption() {
  const indicators = Object.keys(dimensionLabels).map((key) => ({
    name: dimensionLabels[key],
    max: 10
  }))
  const values = Object.keys(dimensionLabels).map((k) => props.dimensions[k] ?? 0)
  return {
    tooltip: { enabled: false },
    radar: {
      indicator: indicators,
      radius: '62%',
      splitNumber: 5,
      axisName: {
        color: '#5a6072',
        fontSize: 12
      },
      splitLine: { lineStyle: { color: '#e6e8ee' } },
      splitArea: { areaStyle: { color: ['#fafbfd', '#ffffff'] } },
      axisLine: { lineStyle: { color: '#e6e8ee' } }
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#4f6bff', width: 2 },
        itemStyle: { color: '#4f6bff' },
        areaStyle: { color: 'rgba(79, 107, 255, 0.18)' },
        data: [{ value: values, name: '本次得分' }]
      }
    ]
  }
}

function render() {
  if (!chartInstance) return
  chartInstance.setOption(buildOption(), true)
}

onMounted(() => {
  chartInstance = echarts.init(chartEl.value)
  render()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chartInstance?.dispose()
  chartInstance = null
})

watch(() => props.dimensions, render, { deep: true })

function resize() {
  chartInstance?.resize()
}
</script>

<template>
  <div ref="chartEl" class="radar-chart" />
</template>

<style scoped>
.radar-chart {
  width: 100%;
  height: 280px;
}
</style>
