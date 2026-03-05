<template>
  <div class="analysis-page">
    <div class="analysis-header mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">{{ t('nav_analysis') }}</h1>
          <p class="text-body2 text-medium-emphasis">{{ t('analysis_subtitle') }}</p>
        </div>
        <div class="d-flex align-center gap-2 flex-wrap">
          <v-btn-toggle v-model="days" mandatory density="compact" color="primary" variant="outlined">
            <v-btn :value="30">{{ t('analysis_days_30') }}</v-btn>
            <v-btn :value="60">{{ t('analysis_days_60') }}</v-btn>
            <v-btn :value="90">{{ t('analysis_days_90') }}</v-btn>
          </v-btn-toggle>
        </div>
      </div>
      <v-progress-linear v-if="syncState.running" :model-value="syncProgress" color="primary" height="3" rounded class="mt-2" />
    </div>

    <template v-if="dbLoading">
      <v-row>
        <v-col v-for="i in 6" :key="i" cols="12" sm="6" lg="4">
          <v-skeleton-loader type="card" height="280" />
        </v-col>
      </v-row>
    </template>

    <template v-else-if="!filteredActivities.length">
      <v-card variant="outlined" class="text-center pa-8">
        <v-icon size="64" color="grey-lighten-1" class="mb-3">mdi-chart-line</v-icon>
        <p class="text-body1 mb-1">{{ t('analysis_no_data') }}</p>
        <p class="text-body2 text-medium-emphasis mb-4">{{ t('analysis_sync_hint') }}</p>
        <v-btn color="primary" prepend-icon="mdi-sync" :loading="syncState.running" @click="handleStartSync">{{ t('analysis_sync_btn') }}</v-btn>
      </v-card>
    </template>

    <template v-else>
      <v-row class="mb-2">
        <v-col v-for="stat in overviewStats" :key="stat.label" cols="6" sm="4" md="2">
          <v-card variant="outlined" class="analysis-summary-card pa-3 text-center">
            <v-icon :color="stat.color" class="mb-1">{{ stat.icon }}</v-icon>
            <div class="text-h6 font-weight-bold">{{ stat.value }}</div>
            <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
          </v-card>
        </v-col>
      </v-row>

      <div class="analysis-masonry">
        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-chart-bar</v-icon>{{ t('analysis_distance_trend') }}</v-card-title>
          <v-card-text>
            <div class="chart-stats mb-2">
              <span class="stat-item">{{ t('analysis_mean') }} <strong class="stat-value">{{ formatDistance(distanceStats.mean) }}</strong></span>
              <span class="stat-item">{{ t('analysis_max') }} <strong class="stat-value">{{ formatDistance(distanceStats.max) }}</strong></span>
              <span class="stat-item">{{ t('analysis_min') }} <strong class="stat-value">{{ formatDistance(distanceStats.min) }}</strong></span>
            </div>
            <div v-if="distanceChartOption" class="chart-wrap"><v-chart :option="distanceChartOption" autoresize /></div>
            <p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p>
          </v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-timer-outline</v-icon>{{ t('analysis_duration_trend') }}</v-card-title>
          <v-card-text>
            <div class="chart-stats mb-2">
              <span class="stat-item">{{ t('analysis_mean') }} <strong class="stat-value">{{ formatDuration(Math.round(durationStats.mean)) }}</strong></span>
              <span class="stat-item">{{ t('analysis_max') }} <strong class="stat-value">{{ formatDuration(durationStats.max) }}</strong></span>
              <span class="stat-item">{{ t('analysis_min') }} <strong class="stat-value">{{ formatDuration(durationStats.min) }}</strong></span>
            </div>
            <div v-if="durationChartOption" class="chart-wrap"><v-chart :option="durationChartOption" autoresize /></div>
            <p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p>
          </v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-chart-line-variant</v-icon>{{ t('analysis_performance_curve') }}</v-card-title>
          <v-card-text>
            <div v-if="performanceChartOption" class="chart-wrap chart-wrap-tall"><v-chart :option="performanceChartOption" autoresize /></div>
            <p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p>
          </v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-chart-pie</v-icon>{{ t('analysis_intensity_combo') }}</v-card-title>
          <v-card-text>
            <div v-if="intensityPieOption" class="chart-wrap chart-wrap-pie mb-3"><v-chart :option="intensityPieOption" autoresize /></div>
            <div v-if="intensityTrendOption" class="chart-wrap"><v-chart :option="intensityTrendOption" autoresize /></div>
            <p v-if="!intensityPieOption && !intensityTrendOption" class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p>
          </v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-speedometer</v-icon>{{ t('analysis_pace_trend') }}</v-card-title>
          <v-card-text><div v-if="paceChartOption" class="chart-wrap"><v-chart :option="paceChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-heart-pulse</v-icon>{{ t('analysis_heart_trend') }}</v-card-title>
          <v-card-text><div v-if="heartChartOption" class="chart-wrap"><v-chart :option="heartChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-lightning-bolt</v-icon>{{ t('analysis_power_trend') }}</v-card-title>
          <v-card-text><div v-if="powerChartOption" class="chart-wrap"><v-chart :option="powerChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-elevation-rise</v-icon>{{ t('analysis_elevation_trend') }}</v-card-title>
          <v-card-text><div v-if="elevationChartOption" class="chart-wrap"><v-chart :option="elevationChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-foot-print</v-icon>{{ t('analysis_cadence_trend') }}</v-card-title>
          <v-card-text><div v-if="cadenceChartOption" class="chart-wrap"><v-chart :option="cadenceChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-timer-sand</v-icon>{{ t('analysis_contact_trend') }}</v-card-title>
          <v-card-text><div v-if="contactChartOption" class="chart-wrap"><v-chart :option="contactChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-ruler</v-icon>{{ t('analysis_stride_trend') }}</v-card-title>
          <v-card-text><div v-if="strideChartOption" class="chart-wrap"><v-chart :option="strideChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-arrow-up-bold</v-icon>{{ t('analysis_vertical_amplitude_trend') }}</v-card-title>
          <v-card-text><div v-if="verticalChartOption" class="chart-wrap"><v-chart :option="verticalChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-percent</v-icon>{{ t('analysis_vertical_ratio_trend') }}</v-card-title>
          <v-card-text><div v-if="verticalRatioChartOption" class="chart-wrap"><v-chart :option="verticalRatioChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center"><v-icon size="22" class="me-2">mdi-run-fast</v-icon>{{ t('analysis_run_force_trend') }}</v-card-title>
          <v-card-text><div v-if="runForceChartOption" class="chart-wrap"><v-chart :option="runForceChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { useLocale } from '@/composables/useLocale'
import { formatDistance, formatPace, formatDuration, formatDurationHMS } from '@/utils'
import type { DBAnalysisDetail } from '@/db'
import { db } from '@/db'
import { syncState, startSync, resetSync, initSync } from '@/db/sync'
import dayjs from 'dayjs'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const { t } = useLocale()
const theme = useTheme()
const days = ref(30)
const dbLoading = ref(true)
const analysisData = ref<DBAnalysisDetail[]>([])

const syncProgress = computed(() => !syncState.value.total ? 0 : Math.min(100, Math.round((syncState.value.synced / syncState.value.total) * 100)))
const syncProgressText = computed(() => syncState.value.total ? `${syncState.value.synced} / ${syncState.value.total}` : t('analysis_syncing'))

async function loadFromDB() {
  dbLoading.value = true
  try {
    analysisData.value = await db.analysis_detail.toArray()
  } finally {
    dbLoading.value = false
  }
}
async function handleStartSync() { await startSync(); await loadFromDB() }
async function handleResetSync() { await resetSync(); analysisData.value = []; await handleStartSync() }

const filteredActivities = computed(() => {
  const cutoff = dayjs().subtract(days.value - 1, 'day').startOf('day').unix()
  return analysisData.value.filter(a => a.overlap === 0 && a.sign_date >= cutoff).sort((a, b) => a.sign_date - b.sign_date)
})
const runActivities = computed(() => filteredActivities.value.filter(a => [1, 3, 4, 6].includes(a.run_type)))

type TrendRow = {
  date: string
  run_km: number
  run_time: number
  avg_pace: number
  avg_heart: number
  run_force: number
  tss: number
  total_ascent: number
  avg_power: number
  avg_cadence: number
  avg_contact: number
  avg_stride: number
  avg_vertical: number
  avg_vertical_ratio: number
  aerobic_time: number
  hybrid_time: number
  velocity_time: number
}

const trendRows = computed<TrendRow[]>(() => {
  const map = new Map<string, TrendRow & { paceDen: number; hrDen: number; den: number }>()
  filteredActivities.value.forEach((a) => {
    const date = dayjs.unix(a.sign_date).format('YYYY-MM-DD')
    if (!map.has(date)) {
      map.set(date, {
        date, run_km: 0, run_time: 0, avg_pace: 0, avg_heart: 0, run_force: 0, tss: 0, total_ascent: 0,
        avg_power: 0, avg_cadence: 0, avg_contact: 0, avg_stride: 0, avg_vertical: 0, avg_vertical_ratio: 0,
        aerobic_time: 0, hybrid_time: 0, velocity_time: 0,
        paceDen: 0, hrDen: 0, den: 0,
      })
    }
    const row = map.get(date)!
    const km = Number(a.run_km) || 0
    const sec = Number(a.run_time) || 0
    row.run_km += km
    row.run_time += sec
    row.tss += Number(a.tss) || 0
    row.total_ascent += Number(a.total_ascent) || 0
    row.aerobic_time += Number(a.aerobic_time) || 0
    row.hybrid_time += Number(a.hybrid_time) || 0
    row.velocity_time += Number(a.velocity_time) || 0
    if (a.run_pace > 0 && km > 0) { row.avg_pace += Number(a.run_pace) * km; row.paceDen += km }
    if (a.avg_heart > 0 && sec > 0) { row.avg_heart += Number(a.avg_heart) * sec; row.hrDen += sec }
    if (sec > 0) {
      row.avg_power += (Number(a.avg_power) || 0) * sec
      row.avg_cadence += (Number(a.avg_cadence) || 0) * sec * 2
      row.avg_contact += (Number(a.avg_contact) || 0) * sec
      row.avg_stride += (Number(a.avg_stride) || 0) * sec
      row.avg_vertical += ((Number(a.avg_vertical) || 0) >= 10 ? (Number(a.avg_vertical) || 0) / 10 : (Number(a.avg_vertical) || 0)) * sec
      row.avg_vertical_ratio += ((Number(a.avg_vertical_ratio) || 0) > 1 ? (Number(a.avg_vertical_ratio) || 0) : (Number(a.avg_vertical_ratio) || 0) * 100) * sec
      row.run_force += (Number(a.run_force) || 0) / 10 * sec
      row.den += sec
    }
  })
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({
    date: r.date,
    run_km: Number(r.run_km.toFixed(2)),
    run_time: Math.round(r.run_time),
    avg_pace: r.paceDen > 0 ? r.avg_pace / r.paceDen : 0,
    avg_heart: r.hrDen > 0 ? r.avg_heart / r.hrDen : 0,
    run_force: r.den > 0 ? r.run_force / r.den : 0,
    tss: Number(r.tss.toFixed(1)),
    total_ascent: Number(r.total_ascent.toFixed(1)),
    avg_power: r.den > 0 ? r.avg_power / r.den : 0,
    avg_cadence: r.den > 0 ? r.avg_cadence / r.den : 0,
    avg_contact: r.den > 0 ? r.avg_contact / r.den : 0,
    avg_stride: r.den > 0 ? r.avg_stride / r.den : 0,
    avg_vertical: r.den > 0 ? r.avg_vertical / r.den : 0,
    avg_vertical_ratio: r.den > 0 ? r.avg_vertical_ratio / r.den : 0,
    aerobic_time: r.aerobic_time,
    hybrid_time: r.hybrid_time,
    velocity_time: r.velocity_time,
  }))
})

const overviewStats = computed(() => {
  const acts = filteredActivities.value
  const totalDist = acts.reduce((s, a) => s + a.run_km, 0)
  const totalTime = acts.reduce((s, a) => s + a.run_time, 0)
  const validPaces = runActivities.value.filter(a => a.run_pace > 0)
  const avgPace = validPaces.length ? validPaces.reduce((s, a) => s + a.run_pace, 0) / validPaces.length : 0
  const validHR = acts.filter(a => a.avg_heart > 0)
  const avgHR = validHR.length ? validHR.reduce((s, a) => s + a.avg_heart, 0) / validHR.length : 0
  const bestDist = acts.reduce((max, a) => Math.max(max, a.run_km), 0)
  return [
    { label: t('analysis_total_distance'), value: formatDistance(totalDist), icon: 'mdi-map-marker-distance', color: 'primary' },
    { label: t('analysis_total_count'), value: String(acts.length), icon: 'mdi-format-list-numbered', color: 'secondary' },
    { label: t('analysis_total_time'), value: formatDuration(totalTime), icon: 'mdi-clock-outline', color: 'info' },
    { label: t('analysis_avg_pace'), value: avgPace > 0 ? formatPace(avgPace) : '--', icon: 'mdi-speedometer', color: 'warning' },
    { label: t('analysis_avg_hr'), value: avgHR > 0 ? Math.round(avgHR) + ' bpm' : '--', icon: 'mdi-heart-pulse', color: 'error' },
    { label: t('analysis_best_distance'), value: formatDistance(bestDist), icon: 'mdi-trophy', color: 'success' },
  ]
})

function dataBoundMinMax(values: number[], pad = 0.08) {
  const valid = values.filter(v => Number.isFinite(v))
  if (!valid.length) return { min: 0, max: 1 }
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  const span = max - min || 1
  return { min: min - span * pad, max: max + span * pad }
}
function mean(values: number[]) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0 }
function expandingMean(values: number[]) {
  if (!values.length) return []
  const gm = mean(values)
  const out = [gm]
  let sum = gm
  for (let i = 0; i < values.length - 1; i++) { sum += values[i]; out.push(sum / (i + 2)) }
  return out
}

function axisTooltipInteger(params: any): string {
  if (!params?.length) return ''
  const name = params[0].name
  const lines = params
    .filter((p: any) => p.seriesName)
    .map((p: any) => {
      const n = Number(p.value)
      if (!Number.isFinite(n)) return null
      const display = Number.isInteger(n) ? String(n) : String(Math.round(n))
      return `${p.seriesName}: ${display}`
    })
    .filter(Boolean)
  return `${name}<br/>${lines.join('<br/>')}`
}

const darkSplit = computed(() => theme.global.current.value.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
const meanLineColor = computed(() => theme.global.current.value.dark ? 'rgba(227,184,39,0.5)' : 'rgba(227,184,39,0.55)')
const meanAreaColor = computed(() => theme.global.current.value.dark ? 'rgba(128,128,128,0.15)' : 'rgba(128,128,128,0.12)')
const axisLineColor = computed(() => theme.global.current.value.dark ? 'rgba(255,255,255,0.2)' : '#e8eaed')
const tooltipTextColor = computed(() => theme.global.current.value.dark ? 'rgba(255,255,255,0.92)' : '#1f2937')
const tooltipBgColor = computed(() => theme.global.current.value.dark ? 'rgba(20,24,31,0.92)' : 'rgba(255,255,255,0.96)')

function makeTrendOption(
  rows: TrendRow[],
  getVal: (r: TrendRow) => number,
  color: string,
  yName: string,
  yLabel?: (v: number) => string,
  inverse = false,
) {
  const list = rows.filter(r => getVal(r) > 0)
  if (!list.length) return null
  const x = list.map(r => dayjs(r.date).format('MM/DD'))
  const v = list.map(getVal)
  const ma = expandingMean(v)
  const { min, max } = dataBoundMinMax(v, yName === 'min/km' ? 0.05 : 0.08)
  return {
    grid: { left: 50, right: 20, top: 20, bottom: 32 },
    xAxis: { type: 'category', data: x, boundaryGap: false, axisLabel: { rotate: 45, color: 'rgba(var(--v-theme-on-surface),0.7)' }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: { type: 'value', name: yName, scale: true, min, max, inverse, axisLabel: yLabel ? { formatter: yLabel, color: 'rgba(var(--v-theme-on-surface),0.7)' } : { color: 'rgba(var(--v-theme-on-surface),0.7)' }, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
    series: [
      { name: '', type: 'line', data: ma, lineStyle: { width: 0 }, symbol: 'none', areaStyle: { color: meanAreaColor.value }, z: 0 },
      { name: t('analysis_mean'), type: 'line', data: ma, lineStyle: { type: 'dashed', color: meanLineColor.value }, symbol: 'none', z: 1 },
      { name: t('analysis_value'), type: 'line', data: v, smooth: true, itemStyle: { color }, z: 2 },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: axisTooltipInteger,
      textStyle: { color: tooltipTextColor.value },
      backgroundColor: tooltipBgColor.value,
      borderWidth: 0,
    },
  }
}

const distanceVals = computed(() => trendRows.value.map(r => r.run_km).filter(v => v > 0))
const distanceStats = computed(() => ({ mean: mean(distanceVals.value), max: distanceVals.value.length ? Math.max(...distanceVals.value) : 0, min: distanceVals.value.length ? Math.min(...distanceVals.value) : 0 }))
const durationVals = computed(() => trendRows.value.map(r => r.run_time).filter(v => v > 0))
const durationStats = computed(() => ({ mean: mean(durationVals.value), max: durationVals.value.length ? Math.max(...durationVals.value) : 0, min: durationVals.value.length ? Math.min(...durationVals.value) : 0 }))

const distanceChartOption = computed(() => {
  const list = trendRows.value.filter((r) => r.run_km > 0)
  if (!list.length) return null
  const x = list.map((r) => dayjs(r.date).format('MM/DD'))
  const v = list.map((r) => r.run_km)
  const ma = expandingMean(v)
  const yMax = Math.max(...v) * 1.06
  return {
    grid: { left: 50, right: 20, top: 20, bottom: 32 },
    xAxis: { type: 'category', data: x, axisLabel: { rotate: 45, color: 'rgba(var(--v-theme-on-surface),0.7)' }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: { type: 'value', name: 'km', min: 0, max: yMax, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
    series: [
      { name: '', type: 'line', data: ma, lineStyle: { width: 0 }, symbol: 'none', areaStyle: { color: meanAreaColor.value }, z: 0 },
      { name: t('analysis_mean'), type: 'line', data: ma, lineStyle: { type: 'dashed', color: meanLineColor.value }, symbol: 'none', z: 1 },
      { name: t('analysis_distance_trend'), type: 'bar', data: v, itemStyle: { color: '#3874CB' }, z: 2 },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: axisTooltipInteger,
      textStyle: { color: tooltipTextColor.value },
      backgroundColor: tooltipBgColor.value,
      borderWidth: 0,
    },
  }
})

const durationChartOption = computed(() => {
  const list = trendRows.value.filter((r) => r.run_time > 0)
  if (!list.length) return null
  const x = list.map((r) => dayjs(r.date).format('MM/DD'))
  const v = list.map((r) => r.run_time / 3600)
  const ma = expandingMean(v)
  const yMax = Math.max(...v) * 1.06
  return {
    grid: { left: 50, right: 20, top: 20, bottom: 32 },
    xAxis: { type: 'category', data: x, axisLabel: { rotate: 45, color: 'rgba(var(--v-theme-on-surface),0.7)' }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: { type: 'value', name: 'h', min: 0, max: yMax, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
    series: [
      { name: '', type: 'line', data: ma, lineStyle: { width: 0 }, symbol: 'none', areaStyle: { color: meanAreaColor.value }, z: 0 },
      { name: t('analysis_mean'), type: 'line', data: ma, lineStyle: { type: 'dashed', color: meanLineColor.value }, symbol: 'none', z: 1 },
      { name: t('analysis_duration_trend'), type: 'bar', data: v, itemStyle: { color: '#14C9C9' }, z: 2 },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (p: any) => (p && p[0] ? `${p[0].name}<br/>${formatDurationHMS(Math.round(Number(p[0].value) * 3600))}` : ''),
      textStyle: { color: tooltipTextColor.value },
      backgroundColor: tooltipBgColor.value,
      borderWidth: 0,
    },
  }
})

const paceChartOption = computed(() => {
  const list = trendRows.value.filter((r) => r.avg_pace > 0)
  if (!list.length) return null
  const x = list.map((r) => dayjs(r.date).format('MM/DD'))
  const v = list.map((r) => r.avg_pace)
  const ma = expandingMean(v)
  const { min, max } = dataBoundMinMax(v, 0.05)
  const yMin = Math.max(min, 120)
  const yMax = Math.min(max, 1800)
  return {
    grid: { left: 50, right: 20, top: 20, bottom: 32 },
    xAxis: { type: 'category', data: x, boundaryGap: false, axisLabel: { rotate: 45, color: 'rgba(var(--v-theme-on-surface),0.7)' }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: { type: 'value', scale: true, min: yMin, max: yMax, inverse: true, axisLabel: { formatter: (val: number) => formatPace(val), color: 'rgba(var(--v-theme-on-surface),0.7)' }, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
    series: [
      { name: '', type: 'line', data: ma, lineStyle: { width: 0 }, symbol: 'none', areaStyle: { color: meanAreaColor.value }, z: 0 },
      { name: t('analysis_mean'), type: 'line', data: ma, lineStyle: { type: 'dashed', color: meanLineColor.value }, symbol: 'none', z: 1 },
      { name: t('analysis_pace_trend'), type: 'line', data: v, smooth: true, itemStyle: { color: '#00A6FB' }, z: 2 },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (p: any) => {
        if (!p?.length) return ''
        const actualSec = p[2]?.value != null ? Number(p[2].value) : null
        const meanSec = p[1]?.value != null ? Number(p[1].value) : null
        const lines = [p[0].name]
        if (actualSec != null) lines.push(`${t('analysis_pace_trend')}: ${formatPace(actualSec)}`)
        if (meanSec != null) lines.push(`${t('analysis_mean')}: ${formatPace(meanSec)}`)
        return lines.join('<br/>')
      },
      textStyle: { color: tooltipTextColor.value },
      backgroundColor: tooltipBgColor.value,
      borderWidth: 0,
    },
  }
})
const heartChartOption = computed(() => makeTrendOption(trendRows.value, r => r.avg_heart, '#F91919', 'bpm'))
const powerChartOption = computed(() => makeTrendOption(trendRows.value, r => r.avg_power, '#9C27B0', 'W'))
const elevationChartOption = computed(() => makeTrendOption(trendRows.value, r => r.total_ascent, '#4CAF50', 'm'))
const cadenceChartOption = computed(() => makeTrendOption(trendRows.value, r => r.avg_cadence, '#FF9800', 'spm'))
const contactChartOption = computed(() => makeTrendOption(trendRows.value, r => r.avg_contact, '#795548', 'ms'))
const strideChartOption = computed(() => makeTrendOption(trendRows.value, r => r.avg_stride, '#00BCD4', 'cm'))
const verticalChartOption = computed(() => makeTrendOption(trendRows.value, r => r.avg_vertical, '#E91E63', 'cm'))
const verticalRatioChartOption = computed(() => makeTrendOption(trendRows.value, r => r.avg_vertical_ratio, '#673AB7', '%', (v) => `${Math.round(v)}%`))
const runForceChartOption = computed(() => makeTrendOption(trendRows.value, r => r.run_force, '#1DDFDA', ''))

const performanceRows = computed(() => {
  let fitness = 0
  let fatigue = 0
  return trendRows.value.map((r) => {
    const tss = r.tss || 0
    fitness = fitness + (tss - fitness) / 42
    fatigue = fatigue + (tss - fatigue) / 7
    return { date: r.date, fitness, fatigue, form: fitness - fatigue }
  })
})
const performanceChartOption = computed(() => {
  const list = performanceRows.value
  if (!list.length) return null
  const x = list.map(r => dayjs(r.date).format('MM/DD'))
  const f = list.map(r => Number(r.fitness.toFixed(1)))
  const a = list.map(r => Number(r.fatigue.toFixed(1)))
  const s = list.map(r => Number(r.form.toFixed(1)))
  const bound = dataBoundMinMax([...f, ...a, ...s], 0.1)
  return {
    grid: { left: 44, right: 20, top: 30, bottom: 38 },
    legend: { bottom: 0, data: [t('analysis_fitness'), t('analysis_fatigue'), t('analysis_form')] },
    xAxis: { type: 'category', data: x, boundaryGap: false },
    yAxis: { type: 'value', scale: true, min: bound.min, max: bound.max, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
    series: [
      { name: t('analysis_fitness'), type: 'line', data: f, smooth: true, itemStyle: { color: '#91cc75' } },
      { name: t('analysis_fatigue'), type: 'line', data: a, smooth: true, itemStyle: { color: '#ee6666' } },
      { name: t('analysis_form'), type: 'line', data: s, smooth: true, itemStyle: { color: '#fac858' } },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: axisTooltipInteger,
      textStyle: { color: tooltipTextColor.value },
      backgroundColor: tooltipBgColor.value,
      borderWidth: 0,
    },
  }
})

const intensityPieOption = computed(() => {
  const a = trendRows.value.reduce((s, r) => s + r.aerobic_time, 0)
  const h = trendRows.value.reduce((s, r) => s + r.hybrid_time, 0)
  const v = trendRows.value.reduce((s, r) => s + r.velocity_time, 0)
  const total = a + h + v
  if (total <= 0) return null
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['40%', '50%'],
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: Math.round(a / 60), name: t('analysis_intensity_aerobic'), itemStyle: { color: '#48b870' } },
        { value: Math.round(v / 60), name: t('analysis_intensity_anaerobic'), itemStyle: { color: '#f1519b' } },
        { value: Math.round(h / 60), name: t('analysis_intensity_hybrid'), itemStyle: { color: '#ffd068' } },
      ].filter(i => i.value > 0),
    }],
  }
})
const intensityTrendOption = computed(() => {
  const rows = trendRows.value.slice(-42)
  if (!rows.length) return null
  const x = rows.map(r => dayjs(r.date).format('MM/DD'))
  const y = rows.map(r => Number((r.tss || 0).toFixed(1)))
  const b = dataBoundMinMax(y)
  return {
    grid: { left: 44, right: 20, top: 12, bottom: 28 },
    xAxis: { type: 'category', data: x, boundaryGap: false },
    yAxis: { type: 'value', scale: true, min: b.min, max: b.max, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
    series: [{ type: 'line', data: y, smooth: true, lineStyle: { width: 2, color: '#F6BD16' }, areaStyle: { opacity: 0.2, color: '#F6BD16' } }],
    tooltip: {
      trigger: 'axis',
      formatter: axisTooltipInteger,
      textStyle: { color: tooltipTextColor.value },
      backgroundColor: tooltipBgColor.value,
      borderWidth: 0,
    },
  }
})

onMounted(async () => {
  await initSync()
  await loadFromDB()
  if (!analysisData.value.length && !syncState.value.isComplete) await handleStartSync()
})
watch(() => syncState.value.synced, async (n, o) => { if (n !== o && n > 0) await loadFromDB() })
</script>

<style scoped>
.analysis-page { max-width: 100%; }
.analysis-header { padding: 0 4px; }
.analysis-card {
  break-inside: avoid;
  page-break-inside: avoid;
  border-radius: 8px;
  box-shadow: none !important;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  display: inline-block;
  width: 100%;
  margin-bottom: 20px;
  vertical-align: top;
}
.analysis-card-title { font-size: 1.05rem !important; font-weight: 600 !important; letter-spacing: 0.01em; }
.analysis-summary-card {
  border-radius: 8px;
  box-shadow: none !important;
  border: 1px solid rgba(var(--v-border-color), 0.12);
}
.chart-stats { display: flex; flex-wrap: wrap; gap: 12px 24px; font-size: 0.95rem; }
.chart-stats .stat-value { font-size: 1.05rem; font-weight: 700; }
.chart-wrap { height: 240px; }
.chart-wrap-tall { height: 320px; }
.chart-wrap-pie { height: 220px; }
.analysis-masonry { column-gap: 20px; column-count: 1; }
@media (min-width: 700px) { .analysis-masonry { column-count: 2; } }
@media (min-width: 1040px) { .analysis-masonry { column-count: 3; } }
@media (min-width: 1380px) { .analysis-masonry { column-count: 4; } }
</style>
