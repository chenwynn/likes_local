import { ref } from 'vue'

export type ChartColorMode = 'default' | 'lowSaturation' | 'blue' | 'pastel' | 'mono'

const KEY = 'likes_chart_color_mode'
const VALID: ChartColorMode[] = ['default', 'lowSaturation', 'blue', 'pastel', 'mono']

const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null) as ChartColorMode | null
const chartColorMode = ref<ChartColorMode>(stored && VALID.includes(stored) ? stored : 'default')

export function useChartColorMode() {
  function setChartColorMode(mode: ChartColorMode) {
    chartColorMode.value = mode
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, mode)
  }
  return { chartColorMode, setChartColorMode }
}
