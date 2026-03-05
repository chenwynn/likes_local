<template>
  <div class="training-detail-container" v-if="activity">
    <div class="pdf-content">
      <!-- 顶部概览信息（与参考一致） -->
      <div class="overview-section">
        <div class="top-header">
          <div class="user-info">
            <div class="user-details">
              <h3>{{ t('receipt_title') }}</h3>
              <p class="receipt-date">{{ formatTime(activity.sign_date, 'YYYY年MM月DD日 HH:mm') }}</p>
            </div>
          </div>
        </div>
        <div class="metrics-grid">
          <div class="metric-card">
            <v-icon size="20" class="metric-icon">mdi-map-marker-distance</v-icon>
            <div class="metric-label">{{ t('receipt_distance') }}</div>
            <div class="metric-value">{{ runKmFormatted }}</div>
            <div class="metric-unit">km</div>
          </div>
          <div class="metric-card">
            <v-icon size="20" class="metric-icon">mdi-clock-outline</v-icon>
            <div class="metric-label">{{ t('receipt_duration') }}</div>
            <div class="metric-value">{{ formatDuration(activity.run_time) }}</div>
            <div class="metric-unit">{{ durationSubUnit }}</div>
          </div>
          <div class="metric-card">
            <v-icon size="20" class="metric-icon">mdi-speedometer</v-icon>
            <div class="metric-label">{{ paceOrSpeedLabel }}</div>
            <div class="metric-value">{{ paceOrSpeedValue }}</div>
            <div class="metric-unit">{{ paceOrSpeedUnit }}</div>
          </div>
          <div class="metric-card">
            <v-icon size="20" class="metric-icon">mdi-heart-pulse</v-icon>
            <div class="metric-label">{{ t('receipt_hr') }}</div>
            <div class="metric-value">{{ activity.avg_heart ?? '--' }}</div>
            <div class="metric-unit">bpm</div>
          </div>
          <div class="metric-card">
            <v-icon size="20" class="metric-icon">mdi-fire</v-icon>
            <div class="metric-label">{{ t('receipt_intensity') }}</div>
            <div class="metric-value">{{ activity.tss ?? '--' }}</div>
            <div class="metric-unit">TSS</div>
          </div>
          <div class="metric-card">
            <v-icon size="20" class="metric-icon">mdi-chart-line</v-icon>
            <div class="metric-label">{{ t('receipt_run_force') }}</div>
            <div class="metric-value">{{ runForceDisplay }}</div>
            <div class="metric-unit"></div>
          </div>
        </div>
      </div>

      <!-- 地图和运动摘要区域（与参考一致：2fr 1fr） -->
      <div class="map-summary-section">
        <div class="map-card">
          <div class="card-header">
            <h4 class="card-title">
              <v-icon size="18">mdi-map</v-icon>
              {{ t('receipt_map') }}
            </h4>
          </div>
          <div class="card-content">
            <div class="map-container" v-if="hasMapData">
              <div :id="mapContainerId" class="map-canvas" ref="mapCanvasRef"></div>
            </div>
            <div class="map-placeholder" v-else>
              <div class="placeholder-content">
                <template v-if="loadingDetailed">
                  <v-progress-circular indeterminate color="primary" size="32" class="mb-2" />
                  <p class="text-caption">{{ t('receipt_loading_gps') }}</p>
                </template>
                <template v-else>
                  <v-icon size="48" color="grey">mdi-map-marker-off</v-icon>
                  <p>{{ t('receipt_no_track') }}</p>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-header">
            <h4 class="card-title">
              <v-icon size="18">mdi-assessment</v-icon>
              {{ t('receipt_summary') }}
            </h4>
          </div>
          <div class="card-content">
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-left">
                  <v-icon size="16" class="summary-icon">mdi-terrain</v-icon>
                  <span class="summary-label">{{ t('receipt_ascent') }}</span>
                </span>
                <span class="summary-value">{{ (activity.total_ascent ?? fitSession?.total_ascent) ?? '--' }} m</span>
              </div>
              <div class="summary-item">
                <span class="summary-left">
                  <v-icon size="16" class="summary-icon">mdi-heart-outline</v-icon>
                  <span class="summary-label">{{ t('receipt_aerobic_time') }}</span>
                </span>
                <span class="summary-value">{{ formatDuration(activity.aerobic_time) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-left">
                  <v-icon size="16" class="summary-icon">mdi-flash</v-icon>
                  <span class="summary-label">{{ t('receipt_mixed_time') }}</span>
                </span>
                <span class="summary-value">{{ formatDuration(activity.hybrid_time) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-left">
                  <v-icon size="16" class="summary-icon">mdi-run-fast</v-icon>
                  <span class="summary-label">{{ t('receipt_anaerobic_time') }}</span>
                </span>
                <span class="summary-value">{{ formatDuration(activity.velocity_time) }}</span>
              </div>
              <div class="summary-item" v-if="fitSession?.avg_cadence">
                <span class="summary-left">
                  <v-icon size="16" class="summary-icon">mdi-footprint</v-icon>
                  <span class="summary-label">{{ t('receipt_cadence') }}</span>
                </span>
                <span class="summary-value">{{ (fitSession.avg_cadence * 2) || '--' }} spm</span>
              </div>
              <div class="summary-item" v-if="fitSession?.avg_step_length">
                <span class="summary-left">
                  <v-icon size="16" class="summary-icon">mdi-open-in-new</v-icon>
                  <span class="summary-label">{{ t('receipt_stride') }}</span>
                </span>
                <span class="summary-value">{{ (fitSession.avg_step_length / 1000).toFixed(2) }} m</span>
              </div>
              <div class="summary-item" v-if="fitSession?.avg_power">
                <span class="summary-left">
                  <v-icon size="16" class="summary-icon">mdi-lightning-bolt</v-icon>
                  <span class="summary-label">{{ t('receipt_power') }}</span>
                </span>
                <span class="summary-value">{{ fitSession.avg_power }} W</span>
              </div>
              <div class="summary-item" v-if="fitSession?.avg_vertical_oscillation">
                <span class="summary-left">
                  <v-icon size="16" class="summary-icon">mdi-arrow-up-down</v-icon>
                  <span class="summary-label">{{ t('receipt_vertical_osc') }}</span>
                </span>
                <span class="summary-value">{{ (fitSession.avg_vertical_oscillation / 10).toFixed(1) }} cm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主要内容区域：数据图表 + 分段数据（与参考一致） -->
      <div class="main-content">
        <!-- Loading detailed GPS/timeseries data -->
        <div v-if="loadingDetailed && chartSeries.length === 0" class="detail-loading-hint">
          <v-progress-circular indeterminate color="primary" size="20" class="me-2" />
          <span class="text-caption text-medium-emphasis">{{ t('receipt_loading_gps') }}</span>
        </div>

        <div class="content-card" v-if="chartSeries.length > 0">
          <div class="card-header">
            <h4 class="card-title">
              <v-icon size="18">mdi-timeline</v-icon>
              {{ t('receipt_data_chart') }}
            </h4>
          </div>
          <div class="card-content">
            <div class="chart-container">
              <div class="chart-item" v-for="s in chartSeries" :key="s.name">
                <v-chart class="chart-instance" :option="s.option" autoresize />
              </div>
            </div>
          </div>
        </div>

        <div class="content-card" v-if="lapRows.length > 0">
          <div class="card-header">
            <h4 class="card-title">
              <v-icon size="18">mdi-table</v-icon>
              {{ t('receipt_segment_data') }}
            </h4>
          </div>
          <div class="card-content">
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ t('receipt_lap_no') }}</th>
                    <th>{{ t('receipt_lap_time') }}</th>
                    <th>{{ t('receipt_lap_distance') }}</th>
                    <th>{{ lapPaceOrSpeedColumnTitle }}</th>
                    <th>{{ t('receipt_avg_hr') }}</th>
                    <th>{{ t('receipt_max_hr') }}</th>
                    <th>{{ t('receipt_avg_power') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in lapRows" :key="row.lapid">
                    <td>{{ row.lapid }}</td>
                    <td>{{ row.lap_timer_time_str }}</td>
                    <td>{{ row.lap_distance_km }}</td>
                    <td>{{ row.avg_speed_str || '--' }}</td>
                    <td>{{ row.avg_heart_rate ?? '--' }}</td>
                    <td>{{ row.max_heart_rate ?? '--' }}</td>
                    <td>{{ row.avg_power ?? '--' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="receipt-loading">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-2 text-body2">{{ t('receipt_loading') }}</p>
    </div>
    <div v-else-if="!hasDataSource && !fitData" class="receipt-empty text-center py-8 text-medium-emphasis">
      {{ t('receipt_no_cloud') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useTheme } from 'vuetify'
import { formatTime, formatDuration, formatDistance, formatPace } from '@/utils'
import { useLocale } from '@/composables/useLocale'
import { openApi } from '@/services/api'
import type { ActivityRecord } from '@/types'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, TitleComponent])

const props = defineProps<{
  activity: ActivityRecord | null
}>()

const { t } = useLocale()
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const loading = ref(false)
/** true when overview is loaded but GPS/timeseries (mode=detailed) is still fetching */
const loadingDetailed = ref(false)
const fitData = ref<{
  record?: { key: string[]; data: any[][] } | null
  lap?: any[]
  session?: any
  has_detailed?: boolean
} | null>(null)
const mapCanvasRef = ref<HTMLElement | null>(null)
const mapInstance = ref<any>(null)
const AMAP_SCRIPT_URL = 'https://webapi.amap.com/maps?v=2.0&key=b3615e7fd6082fa8ed568fa6eb006949'
let amapLoadPromise: Promise<void> | null = null

const mapContainerId = computed(() => `amap_receipt_${props.activity?.id ?? '0'}`)

const activity = computed(() => props.activity)

const runKmFormatted = computed(() => {
  const km = props.activity?.run_km
  return km != null && !isNaN(Number(km)) ? Number(km).toFixed(2) : '0.00'
})

/** 跑力：存为整型 383 表示 38.3，无值则空 */
const runForceDisplay = computed(() => {
  const v = props.activity?.run_force
  if (v == null || (typeof v === 'number' && (isNaN(v) || v <= 0))) return ''
  return (Number(v) / 10).toFixed(1)
})

/** 运动类型：1=跑步 2=骑行 5=游泳 */
const sportKind = computed(() => {
  const t = props.activity?.run_type ?? 1
  if (t === 2) return 'ride'
  if (t === 5) return 'swim'
  return 'run'
})

/** 顶部第三卡：配速(跑步) / 时速(骑行) / 配速100米(游泳) 的显示标签 */
const paceOrSpeedLabel = computed(() => {
  if (sportKind.value === 'ride') return '时速'
  if (sportKind.value === 'swim') return '配速(100米)'
  return '配速'
})

/** 顶部第三卡：数值。跑步=配速秒转分秒，骑行=时速 km/h，游泳=秒/100米转分秒 */
const paceOrSpeedValue = computed(() => {
  const p = props.activity?.run_pace
  if (p == null || (typeof p === 'number' && (isNaN(p) || p <= 0))) return '--'
  const sec = Number(p)
  if (sportKind.value === 'ride') {
    const kmh = 3600 / sec
    return kmh.toFixed(1)
  }
  if (sportKind.value === 'swim') {
    const secPer100 = sec / 10
    const m = Math.floor(secPer100 / 60)
    const s = Math.round(secPer100 % 60)
    return `${m}'${s.toString().padStart(2, '0')}"`
  }
  return formatPace(p)
})

/** 顶部第三卡：单位 */
const paceOrSpeedUnit = computed(() => {
  if (sportKind.value === 'ride') return 'km/h'
  if (sportKind.value === 'swim') return '分秒/100米'
  return 'min/km'
})

/** 时长卡片下方小字：配速/km、时速、配速/100米 */
const durationSubUnit = computed(() => {
  const p = props.activity?.run_pace
  if (!p || p <= 0) return ''
  if (sportKind.value === 'ride') return (3600 / Number(p)).toFixed(1) + ' km/h'
  if (sportKind.value === 'swim') {
    const secPer100 = Number(p) / 10
    const m = Math.floor(secPer100 / 60)
    const s = Math.round(secPer100 % 60)
    return `${m}'${s.toString().padStart(2, '0')}"/100米`
  }
  return formatPace(p) + '/km'
})

const hasDataSource = computed(() => {
  const a = props.activity
  if (!a) return false
  const path = (a as any).data_source_path ?? (a as any).DataSourcePath
  return !!path && String(path).trim().length > 0
})

const fitSession = computed(() => fitData.value?.session ?? null)

const hasMapData = computed(() => {
  const rec = fitData.value?.record
  if (!rec?.key?.length || !rec?.data?.length) return false
  const ki = rec.key.indexOf('position_long')
  const kj = rec.key.indexOf('position_lat')
  if (ki < 0 || kj < 0) return false
  return rec.data.some((row: any[]) => {
    const lon = row[ki]
    const lat = row[kj]
    return lon != null && lat != null && !isNaN(Number(lon)) && !isNaN(Number(lat))
  })
})

function getDataSourceUrl(): string {
  const a = props.activity
  if (!a) return ''
  const path = (a as any).data_source_path ?? (a as any).DataSourcePath
  if (!path) return ''
  const s = String(path).trim()
  return s.startsWith('http') ? s : s.startsWith('/') ? `${window.location.origin}${s}` : s
}

async function loadDetail() {
  if (!props.activity) {
    fitData.value = null
    return
  }
  const id = Number(props.activity.id)
  loading.value = true
  fitData.value = null
  loadingDetailed.value = false

  try {
    // ── Stage 1: check local DB (instant) ──────────────────────────────
    const { db: localDb } = await import('@/db')
    const dbRow = await localDb.activity_fits.get(id)
    if (dbRow) {
      fitData.value = {
        record: (dbRow.record ?? null) as any,
        lap: (dbRow.lap ?? []) as any[],
        session: dbRow.session ?? null,
        has_detailed: dbRow.has_detailed,
      }
      loading.value = false
      // If cached data is only overview (no GPS), still load detailed in bg
      if (!dbRow.has_detailed) {
        loadingDetailed.value = true
        const full = await openApi.getActivityDetail(id, 'detailed')
        if (full) fitData.value = { record: full.record as any, lap: (full.lap ?? []) as any[], session: full.session, has_detailed: true }
        loadingDetailed.value = false
      }
      return
    }

    // ── Stage 2: no DB data — fetch overview first (fast) ──────────────
    const overview = await openApi.getActivityDetail(id, 'overview')
    if (overview) {
      fitData.value = {
        record: null,
        lap: (overview.lap ?? []) as any[],
        session: overview.session ?? null,
        has_detailed: false,
      }
    }
    loading.value = false

    // ── Stage 3: fetch detailed (GPS / timeseries) in background ───────
    loadingDetailed.value = true
    const full = await openApi.getActivityDetail(id, 'detailed')
    if (full) {
      fitData.value = {
        record: full.record as any,
        lap: (full.lap ?? []) as any[],
        session: full.session ?? null,
        has_detailed: true,
      }
    }
  } catch (e) {
    console.error('ActivityReceiptDetail loadDetail failed', e)
  } finally {
    loading.value = false
    loadingDetailed.value = false
  }
}

/** 将 record/lap 中的 speed 转为 m/s。接口为 m/s×100（如 373=3.73 m/s），也兼容 m/s×1000（如 4277=4.277 m/s） */
function recordSpeedToMs(rawSpeed: number): number {
  if (rawSpeed == null || rawSpeed <= 0) return 0
  if (rawSpeed >= 50 && rawSpeed <= 2000) return rawSpeed / 100
  if (rawSpeed > 2000) return rawSpeed / 1000
  return rawSpeed
}

/** 从原始 speed 转为配速(秒/km)。使用 recordSpeedToMs 统一换算 */
function paceFromSpeed(rawSpeed: number): number {
  const speedMs = recordSpeedToMs(rawSpeed)
  if (speedMs <= 0) return 0
  return Math.round(1000 / speedMs)
}

/** 同上但不取整，用于标题统计（均值/最快/最慢） */
function paceFromSpeedFloat(rawSpeed: number): number {
  const speedMs = recordSpeedToMs(rawSpeed)
  if (speedMs <= 0) return 0
  return 1000 / speedMs
}

function formatPaceAxis(value: number): string {
  const m = Math.floor(value / 60)
  const s = Math.floor(value % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** 配速/时速/统计展示用：分'秒 或 小数。values 为曲线 Y 轴同源数据，确保为数字再算均值/最大/最小 */
function getChartStatsText(values: number[], unit: string): string {
  const numVals = values.map((v) => Number(v)).filter((n) => !isNaN(n) && isFinite(n))
  if (!numVals.length) return ''
  const mean = numVals.reduce((a, b) => a + b, 0) / numVals.length
  const max = Math.max(...numVals)
  const min = Math.min(...numVals)
  const fmtPace = (v: number) => `${Math.floor(v / 60)}'${Math.round(v % 60).toString().padStart(2, '0')}"`
  const fmt = (v: number) =>
    unit === 'pace' || unit === 'pace100'
      ? fmtPace(v)
      : unit === 'bpm'
        ? Math.round(v)
        : Number(v).toFixed(1)
  if (unit === 'pace' || unit === 'pace100') return `均值 ${fmt(mean)}  最快 ${fmt(min)}  最慢 ${fmt(max)}`
  if (unit === 'speed') return `均值 ${fmt(mean)}  最大 ${fmt(max)}  最小 ${fmt(min)}`
  return `均值 ${fmt(mean)}  最大 ${fmt(max)}  最小 ${fmt(min)}`
}

function formatPaceForDisplay(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** 从 key 列表中查找第一个匹配的 key（支持多种命名，兼容 CDN/Garmin 等） */
function findKeyIndex(keys: string[], candidates: string[]): number {
  const lower = keys.map((k) => String(k).toLowerCase())
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase())
    if (i >= 0) return i
    const j = keys.indexOf(c)
    if (j >= 0) return j
  }
  return -1
}

const chartSeries = computed(() => {
  const rec = fitData.value?.record
  if (!rec?.key?.length || !rec?.data?.length) return []
  const keys = rec.key as string[]
  const data = rec.data
  const idx = {
    timestamp: findKeyIndex(keys, ['timestamp', 'Timestamp']),
    heart_rate: findKeyIndex(keys, ['heart_rate', 'HeartRate']),
    speed: findKeyIndex(keys, ['speed', 'Speed', 'enhanced_speed', 'EnhancedSpeed']),
    altitude: findKeyIndex(keys, ['altitude', 'Altitude', 'enhanced_altitude']),
    distance: findKeyIndex(keys, ['distance', 'Distance', 'total_distance']),
    cadence: findKeyIndex(keys, ['cadence', 'Cadence', 'fractional_cadence']),
    step_length: findKeyIndex(keys, ['step_length', 'StepLength']),
    vertical_oscillation: findKeyIndex(keys, ['vertical_oscillation', 'VerticalOscillation']),
    vertical_ratio: findKeyIndex(keys, ['vertical_ratio', 'VerticalRatio']),
    power: findKeyIndex(keys, ['power', 'Power', 'accumulated_power']),
  }
  const baseTime = (data[0]?.[idx.timestamp] ?? 0) as number
  const series: { name: string; option: any }[] = []
  const dark = isDark.value
  const axisColor = dark ? 'rgba(255,255,255,0.25)' : '#e8eaed'
  const labelColor = dark ? 'rgba(255,255,255,0.75)' : '#5f6368'
  const titleColor = dark ? 'rgba(255,255,255,0.9)' : '#202124'
  const commonAxis = {
    axisLine: { lineStyle: { color: axisColor } },
    axisLabel: { color: labelColor, fontSize: 11 },
    splitLine: { lineStyle: { color: axisColor, type: 'dashed' } },
  }
  const commonTooltip = {
    backgroundColor: dark ? 'rgba(32, 33, 36, 0.92)' : 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    borderRadius: 4,
    padding: [8, 12],
    textStyle: { color: dark ? '#fff' : '#202124', fontSize: 12 },
  }

  if (idx.heart_rate >= 0) {
    const points = data
      .map((row) => {
        const t = (row[idx.timestamp] ?? 0) - baseTime
        const v = row[idx.heart_rate]
        return v != null && !isNaN(Number(v)) ? [t / 60, Number(v)] : null
      })
      .filter(Boolean) as [number, number][]
    if (points.length) {
      const vals = points.map((p) => p[1])
      series.push({
        name: '心率',
        option: {
          title: {
            text: `心率  ${getChartStatsText(vals, 'bpm')}`,
            left: 12,
            top: 8,
            textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
          },
          grid: { left: 48, right: 24, top: 44, bottom: 36 },
          xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
          yAxis: { type: 'value', name: 'bpm', min: (v: any) => Math.max(0, v.min - 20), ...commonAxis },
          tooltip: {
            trigger: 'axis',
            ...commonTooltip,
            formatter: (params: any) => {
              const p = params?.[0]?.data
              if (!p) return ''
              return `心率: ${Math.round(Number(p[1]))} bpm`
            },
          },
          series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#4ECDC4' } }],
        },
      })
    }
  }

  if (idx.speed >= 0) {
    const kind = sportKind.value
    if (kind === 'ride') {
      const rawPoints: [number, number][] = []
      data.forEach((row) => {
        const t = (row[idx.timestamp] ?? 0) - baseTime
        const speed = row[idx.speed]
        const paceSec = speed != null && Number(speed) > 0 ? paceFromSpeed(Number(speed)) : null
        const speedKmh = paceSec != null && paceSec > 0 ? 3600 / paceSec : null
        if (speedKmh != null && speedKmh < 120) rawPoints.push([t / 60, speedKmh])
      })
      const points = rawPoints.map((p) => [p[0], Math.round(p[1] * 10) / 10] as [number, number])
      if (points.length) {
        const vals = rawPoints.map((p) => p[1])
        series.push({
          name: '时速',
          option: {
            title: {
              text: `时速  ${getChartStatsText(vals, 'speed')} km/h`,
              left: 12,
              top: 8,
              textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
            },
            grid: { left: 52, right: 24, top: 44, bottom: 36 },
            xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
            yAxis: { type: 'value', name: 'km/h', min: (v: any) => Math.max(0, v.min - 5), ...commonAxis },
            tooltip: {
              trigger: 'axis',
              ...commonTooltip,
              formatter: (params: any) => {
                const p = params?.[0]?.data
                if (!p) return ''
                return `时速: ${p[1].toFixed(1)} km/h`
              },
            },
            series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#FF6B6B' } }],
          },
        })
      }
    } else if (kind === 'swim') {
      const points = data
        .map((row) => {
          const t = (row[idx.timestamp] ?? 0) - baseTime
          const speed = row[idx.speed]
          const paceSecKm = speed != null && Number(speed) > 0 ? paceFromSpeed(Number(speed)) : null
          const paceSec100 = paceSecKm != null && paceSecKm < 7200 ? paceSecKm / 10 : null
          return paceSec100 != null ? [t / 60, paceSec100] : null
        })
        .filter(Boolean) as [number, number][]
      if (points.length) {
        const vals = points.map((p) => p[1])
        const pace100AxisLabel = {
          ...commonAxis,
          axisLabel: {
            ...commonAxis.axisLabel,
            formatter: (value: number) => formatPaceAxis(value),
          },
        }
        series.push({
          name: '配速(100米)',
          option: {
            title: {
              text: `配速(100米)  ${getChartStatsText(vals, 'pace100')}`,
              left: 12,
              top: 8,
              textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
            },
            grid: { left: 52, right: 24, top: 44, bottom: 36 },
            xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
            yAxis: { type: 'value', name: '分秒/100米', min: (v: any) => Math.max(0, v.min - 30), ...pace100AxisLabel },
            tooltip: {
              trigger: 'axis',
              ...commonTooltip,
              formatter: (params: any) => {
                const p = params?.[0]?.data
                if (!p) return ''
                return `配速: ${formatPaceForDisplay(p[1])}/100米`
              },
            },
            series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#FF6B6B' } }],
          },
        })
      }
    } else {
      const rawPaces: number[] = []
      const points: [number, number][] = []
      data.forEach((row) => {
        const t = (row[idx.timestamp] ?? 0) - baseTime
        const speed = row[idx.speed]
        if (speed == null || Number(speed) <= 0) return
        const paceSecRounded = paceFromSpeed(Number(speed))
        if (paceSecRounded <= 0 || paceSecRounded >= 1200) return
        rawPaces.push(paceFromSpeedFloat(Number(speed)))
        points.push([t / 60, paceSecRounded])
      })
      if (points.length) {
        const fmtPace = (v: number) => `${Math.floor(v / 60)}'${Math.round(v % 60).toString().padStart(2, '0')}"`
        let meanPaceSec = rawPaces.reduce((a, b) => a + b, 0) / rawPaces.length
        if (idx.distance >= 0 && data.length >= 2) {
          const firstTs = Number(data[0]?.[idx.timestamp]) || 0
          const lastTs = Number(data[data.length - 1]?.[idx.timestamp]) || 0
          const totalDistRaw = Number(data[data.length - 1]?.[idx.distance]) || 0
          const totalTimeSec = lastTs - firstTs
          if (totalTimeSec > 0 && totalDistRaw > 0) {
            const totalDistKm = totalDistRaw < 100 ? totalDistRaw : totalDistRaw / 1000
            meanPaceSec = totalTimeSec / totalDistKm
          }
        } else if (props.activity?.run_pace != null && props.activity.run_pace > 0) {
          meanPaceSec = Number(props.activity.run_pace)
        }
        const minPace = Math.min(...rawPaces)
        const maxPace = Math.max(...rawPaces)
        const paceTitleText = `配速  均值 ${fmtPace(meanPaceSec)}  最快 ${fmtPace(minPace)}  最慢 ${fmtPace(maxPace)}`
        const paceAxisLabel = {
          ...commonAxis,
          axisLabel: {
            ...commonAxis.axisLabel,
            formatter: (value: number) => formatPaceAxis(value),
          },
        }
        series.push({
          name: '配速',
          option: {
            title: {
              text: paceTitleText,
              left: 12,
              top: 8,
              textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
            },
            grid: { left: 52, right: 24, top: 44, bottom: 36 },
            xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
            yAxis: { type: 'value', name: '配速(min/km)', min: (v: any) => Math.max(0, v.min - 30), ...paceAxisLabel },
            tooltip: {
              trigger: 'axis',
              ...commonTooltip,
              formatter: (params: any) => {
                const p = params?.[0]?.data
                if (!p) return ''
                return `配速: ${formatPaceForDisplay(p[1])}`
              },
            },
            series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#FF6B6B' } }],
          },
        })
      }
    }
  }

  if (idx.altitude >= 0) {
    const points = data
      .map((row) => {
        const t = (row[idx.timestamp] ?? 0) - baseTime
        const v = row[idx.altitude]
        const num = v !== '' && v != null && !isNaN(Number(v)) ? Number(v) : null
        return num != null ? [t / 60, num] : null
      })
      .filter(Boolean) as [number, number][]
    const hasValidAltitude = points.some((p) => p[1] !== 0)
    if (points.length && hasValidAltitude) {
      const vals = points.map((p) => p[1])
      series.push({
        name: '海拔',
        option: {
          title: {
            text: `海拔  ${getChartStatsText(vals, 'm')} m`,
            left: 12,
            top: 8,
            textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
          },
          grid: { left: 48, right: 24, top: 44, bottom: 36 },
          xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
          yAxis: { type: 'value', name: 'm', ...commonAxis },
          tooltip: {
            trigger: 'axis',
            ...commonTooltip,
            formatter: (params: any) => {
              const p = params?.[0]?.data
              if (!p) return ''
              return `海拔: ${Math.round(Number(p[1]))} m`
            },
          },
          series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#9B59B6' } }],
        },
      })
    }
  }

  if (idx.cadence >= 0) {
    const points = data
      .map((row) => {
        const t = (row[idx.timestamp] ?? 0) - baseTime
        const v = row[idx.cadence]
        const raw = v != null && !isNaN(Number(v)) ? Number(v) : null
        return raw != null && raw > 0 ? [t / 60, raw * 2] : null
      })
      .filter(Boolean) as [number, number][]
    if (points.length) {
      const vals = points.map((p) => p[1])
      series.push({
        name: '步频',
        option: {
          title: {
            text: `步频  ${getChartStatsText(vals, 'bpm')} spm`,
            left: 12,
            top: 8,
            textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
          },
          grid: { left: 48, right: 24, top: 44, bottom: 36 },
          xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
          yAxis: { type: 'value', name: 'spm', min: (v: any) => Math.max(0, v.min - 20), ...commonAxis },
          tooltip: {
            trigger: 'axis',
            ...commonTooltip,
            formatter: (params: any) => {
              const p = params?.[0]?.data
              if (!p) return ''
              return `步频: ${Math.round(p[1])} spm`
            },
          },
          series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#FF9800' } }],
        },
      })
    }
  }

  if (idx.step_length >= 0) {
    const points = data
      .map((row) => {
        const t = (row[idx.timestamp] ?? 0) - baseTime
        const v = row[idx.step_length]
        const num = v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null
        return num != null && num > 0 ? [t / 60, num >= 10 ? num / 10 : num] : null
      })
      .filter(Boolean) as [number, number][]
    if (points.length) {
      const vals = points.map((p) => p[1])
      series.push({
        name: '步幅',
        option: {
          title: {
            text: `步幅  均值 ${vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '–'}  最大 ${vals.length ? Math.max(...vals).toFixed(1) : '–'}  最小 ${vals.length ? Math.min(...vals).toFixed(1) : '–'} cm`,
            left: 12,
            top: 8,
            textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
          },
          grid: { left: 48, right: 24, top: 44, bottom: 36 },
          xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
          yAxis: { type: 'value', name: 'cm', min: (v: any) => Math.max(0, v.min - 5), ...commonAxis },
          tooltip: {
            trigger: 'axis',
            ...commonTooltip,
            formatter: (params: any) => {
              const p = params?.[0]?.data
              if (!p) return ''
              return `步幅: ${Math.round(Number(p[1]))} cm`
            },
          },
          series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#8BC34A' } }],
        },
      })
    }
  }

  if (idx.vertical_oscillation >= 0) {
    const points = data
      .map((row) => {
        const t = (row[idx.timestamp] ?? 0) - baseTime
        const v = row[idx.vertical_oscillation]
        const num = v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null
        return num != null && num > 0 ? [t / 60, num >= 10 ? num / 10 : num] : null
      })
      .filter(Boolean) as [number, number][]
    if (points.length) {
      const vals = points.map((p) => p[1])
      series.push({
        name: '垂直振幅',
        option: {
          title: {
            text: `垂直振幅  均值 ${vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : '–'}  最大 ${vals.length ? Math.max(...vals).toFixed(2) : '–'} cm`,
            left: 12,
            top: 8,
            textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
          },
          grid: { left: 52, right: 24, top: 44, bottom: 36 },
          xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
          yAxis: { type: 'value', name: 'cm', min: (v: any) => Math.max(0, v.min - 2), ...commonAxis },
          tooltip: {
            trigger: 'axis',
            ...commonTooltip,
            formatter: (params: any) => {
              const p = params?.[0]?.data
              if (!p) return ''
              return `垂直振幅: ${Math.round(Number(p[1]))} cm`
            },
          },
          series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#00BCD4' } }],
        },
      })
    }
  }

  if (idx.vertical_ratio >= 0) {
    const points = data
      .map((row) => {
        const t = (row[idx.timestamp] ?? 0) - baseTime
        const v = row[idx.vertical_ratio]
        const num = v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null
        const pct = num != null && num > 0 ? (num <= 1 ? num * 100 : num) : null
        return pct != null && pct < 100 ? [t / 60, pct] : null
      })
      .filter(Boolean) as [number, number][]
    if (points.length) {
      const vals = points.map((p) => p[1])
      series.push({
        name: '垂直移动比',
        option: {
          title: {
            text: `垂直移动比  均值 ${vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : '–'}%  最大 ${vals.length ? Math.max(...vals).toFixed(2) : '–'}%`,
            left: 12,
            top: 8,
            textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
          },
          grid: { left: 48, right: 24, top: 44, bottom: 36 },
          xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
          yAxis: { type: 'value', name: '%', min: (v: any) => Math.max(0, v.min - 2), ...commonAxis },
          tooltip: {
            trigger: 'axis',
            ...commonTooltip,
            formatter: (params: any) => {
              const p = params?.[0]?.data
              if (!p) return ''
              return `垂直移动比: ${Math.round(Number(p[1]))}%`
            },
          },
          series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#673AB7' } }],
        },
      })
    }
  }

  if (idx.power >= 0) {
    const points = data
      .map((row) => {
        const t = (row[idx.timestamp] ?? 0) - baseTime
        const v = row[idx.power]
        const num = v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null
        return num != null && num > 0 && num !== 65535 ? [t / 60, Math.round(Number(num))] : null
      })
      .filter(Boolean) as [number, number][]
    if (points.length) {
      const vals = points.map((p) => p[1])
      series.push({
        name: '功率',
        option: {
          title: {
            text: `功率  均值 ${vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : '–'}  最大 ${vals.length ? Math.max(...vals) : '–'}  最小 ${vals.length ? Math.min(...vals) : '–'} W`,
            left: 12,
            top: 8,
            textStyle: { fontSize: 14, fontWeight: 500, color: titleColor },
          },
          grid: { left: 48, right: 24, top: 44, bottom: 36 },
          xAxis: { type: 'value', name: '时间(min)', nameLocation: 'middle', nameGap: 28, nameTextStyle: { fontSize: 11, color: labelColor }, ...commonAxis },
          yAxis: { type: 'value', name: 'W', min: (v: any) => Math.max(0, v.min - 20), ...commonAxis },
          tooltip: {
            trigger: 'axis',
            ...commonTooltip,
            formatter: (params: any) => {
              const p = params?.[0]?.data
              if (!p) return ''
              return `功率: ${Math.round(p[1])} W`
            },
          },
          series: [{ type: 'line', data: points, smooth: true, symbol: 'none', lineStyle: { width: 1, color: '#E91E63' } }],
        },
      })
    }
  }

  return series
})

/** 分段表第4列标题：按运动类型 */
const lapPaceOrSpeedColumnTitle = computed(() => {
  if (sportKind.value === 'ride') return '平均时速'
  if (sportKind.value === 'swim') return '平均配速(100米)'
  return '平均配速'
})

const lapRows = computed(() => {
  const laps = fitData.value?.lap
  const kind = sportKind.value
  if (!laps || !Array.isArray(laps)) return []
  const toPaceStr = (paceSec: number) => `${Math.floor(paceSec / 60)}'${(paceSec % 60).toString().padStart(2, '0')}`
  const toPace100Str = (paceSec100: number) => `${Math.floor(paceSec100 / 60)}'${(paceSec100 % 60).toString().padStart(2, '0')}"/100米`
  /** lap_distance 可能为米(m)或公里(km)：若数值 >= 100 视为米，否则视为 km */
  const toDistKm = (d: number) => (d >= 100 ? d / 1000 : d)
  return laps
    .filter((lap: any) => lap.lap_timer_time != null && lap.lap_timer_time > 0)
    .map((lap: any) => {
      const lapTimerSec = Number(lap.lap_timer_time) || 0
      const minutes = Math.floor(lapTimerSec / 60)
      const secs = Math.floor(lapTimerSec % 60)
      const timerStr = minutes >= 60 ? `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${minutes}:${secs.toString().padStart(2, '0')}`
      const distRaw = lap.lap_distance != null && !isNaN(Number(lap.lap_distance)) ? Number(lap.lap_distance) : null
      const distKm = distRaw != null && distRaw > 0 ? toDistKm(distRaw) : 0
      const lap_distance_km = distRaw != null ? toDistKm(distRaw).toFixed(2) + ' km' : '--'

      let avgSpeedStr = '--'
      if (lapTimerSec > 0 && distKm > 0) {
        if (kind === 'ride') {
          const speedKmh = distKm * 3600 / lapTimerSec
          avgSpeedStr = speedKmh.toFixed(1) + ' km/h'
        } else if (kind === 'swim') {
          const distM = distKm * 1000
          const paceSec100 = distM > 0 ? lapTimerSec / (distM / 100) : 0
          avgSpeedStr = toPace100Str(Math.round(paceSec100))
        } else {
          const paceSecPerKm = lapTimerSec / distKm
          avgSpeedStr = toPaceStr(Math.round(paceSecPerKm))
        }
      } else {
        const raw = lap.avg_speed ?? lap.enhanced_avg_speed
        if (raw != null && Number(raw) > 0) {
          const speedMs = recordSpeedToMs(Number(raw))
          if (speedMs > 0) {
            if (kind === 'ride') {
              avgSpeedStr = (speedMs * 3.6).toFixed(1) + ' km/h'
            } else if (kind === 'swim') {
              const pace100 = 100 / speedMs
              avgSpeedStr = toPace100Str(Math.round(pace100))
            } else {
              avgSpeedStr = toPaceStr(Math.round(1000 / speedMs))
            }
          }
        }
      }
      return {
        lapid: lap.lapid,
        lap_timer_time_str: timerStr,
        lap_distance_km,
        avg_speed_str: avgSpeedStr,
        avg_heart_rate: lap.avg_heart_rate,
        max_heart_rate: lap.max_heart_rate,
        avg_power: lap.avg_power,
      }
    })
})

/** 加载高德地图脚本（全局只加载一次） */
function loadAMapScript(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).AMap) {
    return Promise.resolve()
  }
  if (amapLoadPromise) return amapLoadPromise
  amapLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = AMAP_SCRIPT_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('AMap script load failed'))
    document.head.appendChild(script)
  })
  return amapLoadPromise
}

/** 从 record 中提取有效经纬度路径 [[lng, lat], ...] */
function getRecordPath(rec: { key: string[]; data: any[][] }): number[][] {
  const ki = rec.key.indexOf('position_long')
  const kj = rec.key.indexOf('position_lat')
  if (ki < 0 || kj < 0) return []
  const path: number[][] = []
  for (const row of rec.data) {
    const lon = row[ki]
    const lat = row[kj]
    const lonNum = lon !== '' && lon != null ? Number(lon) : NaN
    const latNum = lat !== '' && lat != null ? Number(lat) : NaN
    if (!isNaN(lonNum) && !isNaN(latNum)) {
      path.push([lonNum, latNum])
    }
  }
  return path
}

/** 初始化高德地图并绘制轨迹 */
function initAMapAndPolyline() {
  const rec = fitData.value?.record
  if (!rec?.key?.length || !rec?.data?.length) return
  const path = getRecordPath(rec)
  if (path.length < 2) return
  const containerId = mapContainerId.value
  nextTick(() => {
    nextTick(() => {
      const container = document.getElementById(containerId)
      if (!container) return
      loadAMapScript()
        .then(() => {
          const AMap = (window as any).AMap
          if (!AMap) return
          if (mapInstance.value) {
            mapInstance.value.destroy()
            mapInstance.value = null
          }
          const center = path[Math.floor(path.length / 2)]
          const map = new AMap.Map(containerId, {
            zoom: 14,
            center: center as [number, number],
            mapStyle: 'amap://styles/whitesmoke',
            viewMode: '2D',
          })
          const polyline = new AMap.Polyline({
            path,
            strokeWeight: 4,
            strokeColor: '#1a73e8',
            lineJoin: 'round',
          })
          map.add(polyline)
          map.setFitView(null, false, [40, 40, 40, 40])
          mapInstance.value = map
        })
        .catch((e) => console.error('ActivityReceiptDetail AMap init failed', e))
    })
  })
}

function destroyMap() {
  if (mapInstance.value) {
    mapInstance.value.destroy()
    mapInstance.value = null
  }
}

watch(
  () => props.activity?.id,
  (id) => {
    if (id) loadDetail()
    else {
      destroyMap()
      fitData.value = null
    }
  },
  { immediate: true }
)

watch(
  () => [hasMapData.value, fitData.value?.record] as const,
  ([hasData]) => {
    if (hasData) initAMapAndPolyline()
    else destroyMap()
  },
  { deep: true }
)

onUnmounted(() => destroyMap())
</script>

<style scoped>
.training-detail-container {
  width: 100%;
  max-width: 100%;
  min-height: 100%;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: rgb(var(--v-theme-on-surface));
  font-size: 14px;
  line-height: 1.4;
  box-sizing: border-box;
}

.pdf-content {
  position: relative;
  width: 100%;
  min-height: 100px;
}

.overview-section {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.top-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.user-details h3 {
  margin: 0 0 2px 0;
  font-size: 16px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.receipt-date {
  margin: 0;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.metric-card {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  padding: 12px;
  text-align: center;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.metric-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 4px;
}

.metric-label {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 4px;
  font-weight: 500;
  text-transform: uppercase;
}

.metric-value {
  font-size: 20px;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 2px;
}

.metric-unit {
  font-size: 10px;
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.map-summary-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .map-summary-section {
    grid-template-columns: 1fr;
  }
}

.map-card,
.summary-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

.map-card:hover,
.summary-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 12px 16px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title .v-icon {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.card-content {
  padding: 16px;
}

.map-container {
  height: 300px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.map-canvas {
  width: 100%;
  height: 100%;
}

.map-placeholder {
  height: 300px;
  border-radius: 4px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.placeholder-content p {
  margin: 8px 0 0 0;
  font-size: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.summary-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-icon {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.summary-label {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 500;
}

.summary-value {
  font-size: 10px;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 400;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

.content-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-analysis {
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 12px;
  color: rgb(var(--v-theme-primary));
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.chart-container {
  min-height: 400px;
}

.chart-item {
  margin-bottom: 16px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.chart-item:last-child {
  margin-bottom: 0;
}

.chart-instance {
  height: 300px;
  width: 100%;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 4px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table thead th {
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 11px;
  padding: 8px;
  text-align: center;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.data-table tbody td {
  padding: 8px;
  font-size: 12px;
  text-align: center;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.data-table tbody tr:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.receipt-loading,
.receipt-empty {
  padding: 24px;
}

.detail-loading-hint {
  display: flex;
  align-items: center;
  padding: 8px 0 4px;
}
</style>
