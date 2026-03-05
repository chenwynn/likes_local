<template>
  <div class="lapechart-container" @click="handleClick">
    <div class="lap-bars">
      <div 
        v-for="(bar, idx) in chartBars" 
        :key="idx"
        class="lap-bar"
        :style="{
          height: bar.height + '%',
          backgroundColor: bar.color,
          width: bar.width + '%'
        }"
        :title="bar.tooltip"
      ></div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'LapEchart',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    max_speed: {
      type: Number,
      default: 100
    },
    index: Number
  },
  emits: ['lap-click'],
  setup(props, { emit }) {
    const chartBars = computed(() => {
      if (!props.data || props.data.length === 0) {
        return []
      }

      return props.data.map((point, idx) => {
        const intensity = point.intensity || point.value || 50
        const height = Math.min(100, (intensity / props.max_speed) * 100)
        
        // 根据强度设置颜色
        let color = '#4caf50' // 默认绿色
        if (intensity < 30) {
          color = '#2196f3' // 蓝色 - 低强度
        } else if (intensity < 50) {
          color = '#4caf50' // 绿色 - 中低强度
        } else if (intensity < 70) {
          color = '#ff9800' // 橙色 - 中等强度
        } else if (intensity < 85) {
          color = '#ff5722' // 深橙 - 中高强度
        } else {
          color = '#f44336' // 红色 - 高强度
        }

        return {
          height,
          color,
          width: 100 / props.data.length,
          tooltip: `强度: ${intensity.toFixed(1)}`
        }
      })
    })

    const handleClick = () => {
      emit('lap-click', props.index)
    }

    return {
      chartBars,
      handleClick
    }
  }
})
</script>

<style scoped>
.lapechart-container {
  width: 100%;
  height: 100%;
  min-height: 60px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px;
  display: flex;
  align-items: flex-end;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.lapechart-container:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0,0,0,0.15), inset 0 1px 3px rgba(0,0,0,0.05);
  border-color: rgb(var(--v-theme-primary));
}

.lap-bars {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  gap: 1px;
  padding: 2px;
}

.lap-bar {
  flex: 1;
  min-width: 1px;
  min-height: 4px;
  border-radius: 2px 2px 0 0;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.lap-bar:hover {
  opacity: 0.85;
  transform: scaleY(1.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>
