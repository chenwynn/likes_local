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
      <p v-if="syncState.running" class="text-caption text-medium-emphasis mt-1 mb-0">
        {{ syncProgressText }}
      </p>
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
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-chart-bar</v-icon>{{ t('analysis_distance_trend') }}
            <v-spacer />
            <span v-if="distanceGrowth" class="chart-growth" :class="'chart-growth--' + distanceGrowth.dir">
              <v-icon size="16">{{ distanceGrowth.icon }}</v-icon>
              {{ distanceGrowth.text }}
            </span>
          </v-card-title>
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
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-timer-outline</v-icon>{{ t('analysis_duration_trend') }}
            <v-spacer />
            <span v-if="durationGrowth" class="chart-growth" :class="'chart-growth--' + durationGrowth.dir">
              <v-icon size="16">{{ durationGrowth.icon }}</v-icon>
              {{ durationGrowth.text }}
            </span>
          </v-card-title>
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
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-speedometer</v-icon>{{ t('analysis_pace_trend') }}
            <v-spacer />
            <span v-if="paceGrowth" class="chart-growth" :class="'chart-growth--' + paceGrowth.dir">
              <v-icon size="16">{{ paceGrowth.icon }}</v-icon>
              {{ paceGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="paceChartOption" class="chart-wrap"><v-chart :option="paceChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-heart-pulse</v-icon>{{ t('analysis_heart_trend') }}
            <v-spacer />
            <span v-if="heartGrowth" class="chart-growth" :class="'chart-growth--' + heartGrowth.dir">
              <v-icon size="16">{{ heartGrowth.icon }}</v-icon>
              {{ heartGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="heartChartOption" class="chart-wrap"><v-chart :option="heartChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-lightning-bolt</v-icon>{{ t('analysis_power_trend') }}
            <v-spacer />
            <span v-if="powerGrowth" class="chart-growth" :class="'chart-growth--' + powerGrowth.dir">
              <v-icon size="16">{{ powerGrowth.icon }}</v-icon>
              {{ powerGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="powerChartOption" class="chart-wrap"><v-chart :option="powerChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-elevation-rise</v-icon>{{ t('analysis_elevation_trend') }}
            <v-spacer />
            <span v-if="elevationGrowth" class="chart-growth" :class="'chart-growth--' + elevationGrowth.dir">
              <v-icon size="16">{{ elevationGrowth.icon }}</v-icon>
              {{ elevationGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="elevationChartOption" class="chart-wrap"><v-chart :option="elevationChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-foot-print</v-icon>{{ t('analysis_cadence_trend') }}
            <v-spacer />
            <span v-if="cadenceGrowth" class="chart-growth" :class="'chart-growth--' + cadenceGrowth.dir">
              <v-icon size="16">{{ cadenceGrowth.icon }}</v-icon>
              {{ cadenceGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="cadenceChartOption" class="chart-wrap"><v-chart :option="cadenceChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-timer-sand</v-icon>{{ t('analysis_contact_trend') }}
            <v-spacer />
            <span v-if="contactGrowth" class="chart-growth" :class="'chart-growth--' + contactGrowth.dir">
              <v-icon size="16">{{ contactGrowth.icon }}</v-icon>
              {{ contactGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="contactChartOption" class="chart-wrap"><v-chart :option="contactChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-ruler</v-icon>{{ t('analysis_stride_trend') }}
            <v-spacer />
            <span v-if="strideGrowth" class="chart-growth" :class="'chart-growth--' + strideGrowth.dir">
              <v-icon size="16">{{ strideGrowth.icon }}</v-icon>
              {{ strideGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="strideChartOption" class="chart-wrap"><v-chart :option="strideChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-arrow-up-bold</v-icon>{{ t('analysis_vertical_amplitude_trend') }}
            <v-spacer />
            <span v-if="verticalGrowth" class="chart-growth" :class="'chart-growth--' + verticalGrowth.dir">
              <v-icon size="16">{{ verticalGrowth.icon }}</v-icon>
              {{ verticalGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="verticalChartOption" class="chart-wrap"><v-chart :option="verticalChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-percent</v-icon>{{ t('analysis_vertical_ratio_trend') }}
            <v-spacer />
            <span v-if="verticalRatioGrowth" class="chart-growth" :class="'chart-growth--' + verticalRatioGrowth.dir">
              <v-icon size="16">{{ verticalRatioGrowth.icon }}</v-icon>
              {{ verticalRatioGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="verticalRatioChartOption" class="chart-wrap"><v-chart :option="verticalRatioChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-run-fast</v-icon>{{ t('analysis_run_force_trend') }}
            <v-spacer />
            <span v-if="runForceGrowth" class="chart-growth" :class="'chart-growth--' + runForceGrowth.dir">
              <v-icon size="16">{{ runForceGrowth.icon }}</v-icon>
              {{ runForceGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="runForceChartOption" class="chart-wrap"><v-chart :option="runForceChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-chart-arc</v-icon>{{ t('analysis_pace_distribution') }}
          </v-card-title>
          <v-card-text>
            <div v-if="paceDistPieOption" class="chart-wrap chart-wrap-pie mb-3"><v-chart :option="paceDistPieOption" autoresize /></div>
            <div v-if="paceDistChartOption" class="chart-wrap"><v-chart :option="paceDistChartOption" autoresize /></div>
            <p v-else-if="!paceDistPieOption" class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p>
          </v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-heart-box</v-icon>{{ t('analysis_heart_distribution') }}
          </v-card-title>
          <v-card-text>
            <div v-if="heartDistPieOption" class="chart-wrap chart-wrap-pie mb-3"><v-chart :option="heartDistPieOption" autoresize /></div>
            <div v-if="heartDistChartOption" class="chart-wrap"><v-chart :option="heartDistChartOption" autoresize /></div>
            <p v-else-if="!heartDistPieOption" class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p>
          </v-card-text>
        </v-card>

        <v-card v-if="false" class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-heart-box</v-icon>{{ t('analysis_hrv_trend') }}
            <v-spacer />
            <span v-if="hrvGrowth" class="chart-growth" :class="'chart-growth--' + hrvGrowth.dir">
              <v-icon size="16">{{ hrvGrowth.icon }}</v-icon>
              {{ hrvGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="hrvChartOption" class="chart-wrap"><v-chart :option="hrvChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card v-if="false" class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-scale-bathroom</v-icon>{{ t('analysis_weight_trend') }}
            <v-spacer />
            <span v-if="weightGrowth" class="chart-growth" :class="'chart-growth--' + weightGrowth.dir">
              <v-icon size="16">{{ weightGrowth.icon }}</v-icon>
              {{ weightGrowth.text }}
            </span>
          </v-card-title>
          <v-card-text><div v-if="weightChartOption" class="chart-wrap"><v-chart :option="weightChartOption" autoresize /></div><p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p></v-card-text>
        </v-card>

        <v-card class="analysis-card" variant="outlined">
          <v-card-title class="analysis-card-title d-flex align-center">
            <v-icon size="22" class="me-2">mdi-table</v-icon>{{ t('analysis_posture_by_zone') }}
          </v-card-title>
          <v-card-text>
            <div v-if="postureByZoneRows.length" class="posture-zone-table-wrap">
              <table class="posture-zone-table">
                <thead>
                  <tr>
                    <th>{{ t('analysis_zone') }}</th>
                    <th>{{ t('analysis_cadence_trend') }}</th>
                    <th>{{ t('analysis_contact_trend') }}</th>
                    <th>{{ t('analysis_vertical_amplitude_trend') }}</th>
                    <th>{{ t('analysis_stride_trend') }}</th>
                    <th>{{ t('analysis_vertical_ratio_trend') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="z in postureByZoneRows" :key="z.area">
                    <td><span class="zone-badge" :style="{ backgroundColor: paceZoneColor(z.area) }">{{ z.area === 'w' ? 'W' : z.name }}</span></td>
                    <td>{{ z.avg_cadence != null ? Math.round(z.avg_cadence * 2) + ' spm' : '–' }}</td>
                    <td>{{ z.avg_contact != null ? Math.round(z.avg_contact) + ' ms' : '–' }}</td>
                    <td>{{ z.avg_vertical != null ? Number(z.avg_vertical).toFixed(2) + ' cm' : '–' }}</td>
                    <td>{{ z.avg_stride != null ? Math.round(z.avg_stride) + ' cm' : '–' }}</td>
                    <td>{{ z.vertical_ratio != null ? Number(z.vertical_ratio).toFixed(2) + '%' : '–' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="text-center text-medium-emphasis py-4">{{ t('analysis_no_data') }}</p>
          </v-card-text>
        </v-card>
      </div>
    </template>
  </div>
  <v-snackbar v-model="syncNoticeOpen" :color="syncNoticeColor" :timeout="2200" location="bottom">
    {{ syncNoticeText }}
  </v-snackbar>
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
import { resolveApiErrorMessage } from '@/utils/apiError'
import type { DBActivity } from '@/db'
import { db } from '@/db'
import { syncState, syncActivitiesInRange, initSync } from '@/db/sync'
import dayjs from 'dayjs'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const { t } = useLocale()
const theme = useTheme()
const days = ref(30)
const dbLoading = ref(true)
/** 每条打卡（signlog）数据，直接用于按日聚合渲染图表 */
const analysisData = ref<DBActivity[]>([])
const thresholdPace = ref<number | null>(null)
const maxHeartRate = ref<number | null>(null)
const fallbackWeight = ref<number | null>(null)

const syncProgress = computed(() => !syncState.value.total ? 0 : Math.min(100, Math.round((syncState.value.synced / syncState.value.total) * 100)))
const syncProgressText = computed(() => syncState.value.total ? `${syncState.value.synced} / ${syncState.value.total}` : t('analysis_syncing'))
const syncNoticeOpen = ref(false)
const syncNoticeText = ref('')
const syncNoticeColor = ref<'success' | 'error' | 'info'>('info')

async function loadFromDB() {
  dbLoading.value = true
  try {
    analysisData.value = await db.activities.toArray()
    const p = await db.profile.get(1)
    thresholdPace.value = Number(p?.data?.t_pace) > 0 ? Number(p?.data?.t_pace) : null
    maxHeartRate.value = Number(p?.data?.max_rate) > 0 ? Number(p?.data?.max_rate) : null
    fallbackWeight.value = Number(p?.data?.weight) > 0 ? Number(p?.data?.weight) : null
  } finally {
    dbLoading.value = false
  }
}
function getRecentRange(daysCount: number): { startDate: string; endDate: string } {
  const endDate = dayjs().format('YYYY-MM-DD')
  const startDate = dayjs().subtract(Math.max(1, daysCount) - 1, 'day').format('YYYY-MM-DD')
  return { startDate, endDate }
}
async function syncRecentDays(daysCount: number): Promise<{ fetched: number; inserted: number; skipped: number }> {
  // syncActivitiesInRange 单次最多支持 31 天，这里按 30 天窗口分段同步，
  // 保持“首次 60 天 / 后续 7 天”的产品策略不变。
  let cursorEnd = dayjs()
  let remaining = Math.max(1, daysCount)
  const result = { fetched: 0, inserted: 0, skipped: 0 }
  while (remaining > 0) {
    const chunkDays = Math.min(30, remaining)
    const endDate = cursorEnd.format('YYYY-MM-DD')
    const startDate = cursorEnd.subtract(chunkDays - 1, 'day').format('YYYY-MM-DD')
    const partial = await syncActivitiesInRange(startDate, endDate)
    result.fetched += partial.fetched
    result.inserted += partial.inserted
    result.skipped += partial.skipped
    remaining -= chunkDays
    cursorEnd = cursorEnd.subtract(chunkDays, 'day')
  }
  await loadFromDB()
  return result
}
async function handleStartSync() {
  syncNoticeOpen.value = false
  syncNoticeColor.value = 'info'
  syncNoticeText.value = t('analysis_syncing')
  try {
    const result = await syncRecentDays(60)
    syncNoticeColor.value = 'success'
    syncNoticeText.value = `${t('analysis_sync_done')} (+${result.inserted})`
  } catch (e) {
    syncNoticeColor.value = 'error'
    syncNoticeText.value = resolveApiErrorMessage(e, t, 'activityList')
  } finally {
    syncNoticeOpen.value = true
  }
}

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
const axisLabelColor = computed(() => theme.global.current.value.dark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)')
const tooltipTextColor = computed(() => theme.global.current.value.dark ? 'rgba(255,255,255,0.92)' : '#1f2937')
const tooltipBgColor = computed(() => theme.global.current.value.dark ? 'rgba(20,24,31,0.92)' : 'rgba(255,255,255,0.96)')

type GrowthBadge = { text: string; icon: string; dir: 'up' | 'down' | 'flat' } | null
function growthFromValues(values: number[], opts?: { lowerIsBetter?: boolean }): GrowthBadge {
  if (values.length < 2) return null
  const valid = values.filter((v) => Number.isFinite(v))
  if (valid.length < 2) return null
  const ma = expandingMean(valid)
  const first = ma[0]
  const last = ma[ma.length - 1]
  const base = Math.abs(first) || 1
  let pct = ((last - first) / base) * 100
  if (opts?.lowerIsBetter) pct = -pct
  if (Math.abs(pct) < 0.05) return null
  const up = pct > 0
  return { text: `${up ? '+' : ''}${pct.toFixed(1)}%`, icon: up ? 'mdi-arrow-up' : 'mdi-arrow-down', dir: up ? 'up' : 'down' }
}

function readMaybeNumber(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const n = Number(source[key])
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

type ZoneRow = { area: string; name: string; time: number; avg_cadence?: number; avg_contact?: number; avg_vertical?: number; avg_stride?: number; vertical_ratio?: number }
const PACE_ZONE_ORDER = ['w', 'e', 'm', 't', 'a', 'i', 'r']
const PACE_ZONE_LABEL: Record<string, string> = { w: 'W', e: 'E', m: 'M', t: 'T', a: 'A', i: 'I', r: 'R' }
const PACE_ZONE_COLORS: Record<string, string> = { w: '#D0D0D0', e: '#4CAF50', m: '#2196F3', t: '#FF9800', a: '#FF5722', i: '#F44336', r: '#9C27B0' }
function paceZoneColor(zone: string): string { return PACE_ZONE_COLORS[zone] || '#9E9E9E' }

function paceZoneFromPace(secPerKm: number): string {
  if (!(secPerKm > 0)) return 'w'
  const tp = thresholdPace.value && thresholdPace.value > 0 ? thresholdPace.value : mean(runActivities.value.map(a => Number(a.run_pace) || 0).filter(v => v > 0))
  if (!(tp > 0)) return 'w'
  const ratio = secPerKm / tp
  if (ratio <= 0.75) return 'r'
  if (ratio <= 0.88) return 'i'
  if (ratio <= 0.98) return 'a'
  if (ratio <= 1.06) return 't'
  if (ratio <= 1.18) return 'm'
  if (ratio <= 1.32) return 'e'
  return 'w'
}
function heartZoneFromAvg(hr: number): string {
  const maxHr = maxHeartRate.value && maxHeartRate.value > 0 ? maxHeartRate.value : 190
  if (!(hr > 0)) return 'w'
  const pct = hr / maxHr
  if (pct >= 0.95) return 'r'
  if (pct >= 0.9) return 'i'
  if (pct >= 0.85) return 'a'
  if (pct >= 0.8) return 't'
  if (pct >= 0.7) return 'm'
  if (pct >= 0.6) return 'e'
  return 'w'
}

const paceDistributionRows = computed(() => {
  const map = new Map<string, number>()
  runActivities.value.forEach((a) => {
    const sec = Number(a.run_time) || 0
    const pace = Number(a.run_pace) || 0
    if (sec <= 0 || pace <= 0) return
    const z = paceZoneFromPace(pace)
    map.set(z, (map.get(z) || 0) + sec)
  })
  return PACE_ZONE_ORDER.map((z) => ({ zone: z, name: PACE_ZONE_LABEL[z], time: map.get(z) || 0 })).filter((z) => z.time > 0)
})
const heartDistributionRows = computed(() => {
  const map = new Map<string, number>()
  runActivities.value.forEach((a) => {
    const sec = Number(a.run_time) || 0
    const hr = Number(a.avg_heart) || 0
    if (sec <= 0 || hr <= 0) return
    const z = heartZoneFromAvg(hr)
    map.set(z, (map.get(z) || 0) + sec)
  })
  return PACE_ZONE_ORDER.map((z) => ({ zone: z, name: PACE_ZONE_LABEL[z], time: map.get(z) || 0 })).filter((z) => z.time > 0)
})

const postureByZoneRows = computed<ZoneRow[]>(() => {
  const map = new Map<string, ZoneRow & { den: number }>()
  runActivities.value.forEach((a) => {
    const sec = Number(a.run_time) || 0
    const pace = Number(a.run_pace) || 0
    if (!(sec > 0) || !(pace > 0)) return
    const zone = paceZoneFromPace(pace)
    if (!map.has(zone)) {
      map.set(zone, { area: zone, name: PACE_ZONE_LABEL[zone], time: 0, avg_cadence: 0, avg_contact: 0, avg_vertical: 0, avg_stride: 0, vertical_ratio: 0, den: 0 })
    }
    const row = map.get(zone)!
    row.time += sec
    row.avg_cadence! += (Number(a.avg_cadence) || 0) * sec
    row.avg_contact! += (Number(a.avg_contact) || 0) * sec
    const vertical = Number(a.avg_vertical) || 0
    row.avg_vertical! += (vertical >= 10 ? vertical / 10 : vertical) * sec
    row.avg_stride! += (Number(a.avg_stride) || 0) * sec
    const ratio = Number(a.avg_vertical_ratio) || 0
    row.vertical_ratio! += (ratio > 1 ? ratio : ratio * 100) * sec
    row.den += sec
  })
  return PACE_ZONE_ORDER.map((z) => {
    const row = map.get(z)
    if (!row || row.den <= 0) return null
    return {
      area: row.area,
      name: row.name,
      time: row.time,
      avg_cadence: row.avg_cadence! / row.den,
      avg_contact: row.avg_contact! / row.den,
      avg_vertical: row.avg_vertical! / row.den,
      avg_stride: row.avg_stride! / row.den,
      vertical_ratio: row.vertical_ratio! / row.den,
    } as ZoneRow
  }).filter(Boolean) as ZoneRow[]
})

const hrvDailyRows = computed(() => {
  const map = new Map<string, { date: string; sum: number; den: number }>()
  filteredActivities.value.forEach((a) => {
    const raw = a as unknown as Record<string, unknown>
    const hrv = readMaybeNumber(raw, ['rmssd_hrv', 'RmssdHrv', 'sdrr_hrv', 'SdrrHrv', 'avg_hrv', 'AvgHrv'])
    if (!(hrv && hrv > 0)) return
    const date = dayjs.unix(a.sign_date).format('YYYY-MM-DD')
    if (!map.has(date)) map.set(date, { date, sum: 0, den: 0 })
    const row = map.get(date)!
    row.sum += hrv
    row.den += 1
  })
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({ date: r.date, value: r.den > 0 ? r.sum / r.den : 0 })).filter((r) => r.value > 0)
})

const weightDailyRows = computed(() => {
  const map = new Map<string, { date: string; sum: number; den: number }>()
  filteredActivities.value.forEach((a) => {
    const raw = a as unknown as Record<string, unknown>
    const weight = readMaybeNumber(raw, ['weight', 'Weight'])
    if (!(weight && weight > 0)) return
    const date = dayjs.unix(a.sign_date).format('YYYY-MM-DD')
    if (!map.has(date)) map.set(date, { date, sum: 0, den: 0 })
    const row = map.get(date)!
    row.sum += weight
    row.den += 1
  })
  const list = [...map.values()].sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({ date: r.date, value: r.den > 0 ? r.sum / r.den : 0 })).filter((r) => r.value > 0)
  if (list.length) return list
  if (fallbackWeight.value && fallbackWeight.value > 0) {
    return [{ date: dayjs().format('YYYY-MM-DD'), value: fallbackWeight.value }]
  }
  return []
})

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
    xAxis: { type: 'category', data: x, boundaryGap: false, axisLabel: { rotate: 45, color: axisLabelColor.value }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: { type: 'value', name: yName, nameTextStyle: { color: axisLabelColor.value }, scale: true, min, max, inverse, axisLabel: yLabel ? { formatter: yLabel, color: axisLabelColor.value } : { color: axisLabelColor.value }, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
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
const distanceGrowth = computed(() => growthFromValues(distanceVals.value))
const durationVals = computed(() => trendRows.value.map(r => r.run_time).filter(v => v > 0))
const durationStats = computed(() => ({ mean: mean(durationVals.value), max: durationVals.value.length ? Math.max(...durationVals.value) : 0, min: durationVals.value.length ? Math.min(...durationVals.value) : 0 }))
const durationGrowth = computed(() => growthFromValues(durationVals.value.map((v) => v / 3600)))

const distanceChartOption = computed(() => {
  const list = trendRows.value.filter((r) => r.run_km > 0)
  if (!list.length) return null
  const x = list.map((r) => dayjs(r.date).format('MM/DD'))
  const v = list.map((r) => r.run_km)
  const ma = expandingMean(v)
  const yMax = Math.max(...v) * 1.06
  return {
    grid: { left: 50, right: 20, top: 20, bottom: 32 },
    xAxis: { type: 'category', data: x, axisLabel: { rotate: 45, color: axisLabelColor.value }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: { type: 'value', name: 'km', nameTextStyle: { color: axisLabelColor.value }, axisLabel: { color: axisLabelColor.value }, min: 0, max: yMax, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
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
    xAxis: { type: 'category', data: x, axisLabel: { rotate: 45, color: axisLabelColor.value }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: { type: 'value', name: 'h', nameTextStyle: { color: axisLabelColor.value }, axisLabel: { color: axisLabelColor.value }, min: 0, max: yMax, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
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
    xAxis: { type: 'category', data: x, boundaryGap: false, axisLabel: { rotate: 45, color: axisLabelColor.value }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: { type: 'value', scale: true, min: yMin, max: yMax, inverse: true, nameTextStyle: { color: axisLabelColor.value }, axisLabel: { formatter: (val: number) => formatPace(val), color: axisLabelColor.value }, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
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
const paceGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.avg_pace).filter((v) => v > 0), { lowerIsBetter: true }))
const heartGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.avg_heart).filter((v) => v > 0)))
const powerGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.avg_power).filter((v) => v > 0)))
const elevationGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.total_ascent).filter((v) => v >= 0)))
const cadenceGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.avg_cadence).filter((v) => v > 0)))
const contactGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.avg_contact).filter((v) => v > 0), { lowerIsBetter: true }))
const strideGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.avg_stride).filter((v) => v > 0)))
const verticalGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.avg_vertical).filter((v) => v > 0), { lowerIsBetter: true }))
const verticalRatioGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.avg_vertical_ratio).filter((v) => v > 0), { lowerIsBetter: true }))
const runForceGrowth = computed(() => growthFromValues(trendRows.value.map((r) => r.run_force).filter((v) => v > 0)))

function estimatePerformanceBaseline(rows: TrendRow[]): number {
  if (!rows.length) return 0
  const firstDay = dayjs(rows[0].date).startOf('day')
  const lookbackDays = 42
  const startDay = firstDay.subtract(lookbackDays, 'day')
  const tssByDay = new Map<string, number>()
  analysisData.value.forEach((a) => {
    if (a.overlap !== 0) return
    const sign = dayjs.unix(a.sign_date)
    if (sign.isBefore(startDay) || !sign.isBefore(firstDay)) return
    const key = sign.format('YYYY-MM-DD')
    tssByDay.set(key, (tssByDay.get(key) || 0) + (Number(a.tss) || 0))
  })
  let sum = 0
  for (let i = 0; i < lookbackDays; i++) {
    const day = startDay.add(i, 'day').format('YYYY-MM-DD')
    sum += tssByDay.get(day) || 0
  }
  const baseline = sum / lookbackDays
  if (baseline > 0) return baseline
  // 若无完整历史，退化为当前窗口均值估算，避免从 0 起步
  const currentAvg = mean(rows.map((r) => Number(r.tss) || 0))
  return currentAvg > 0 ? currentAvg : 0
}

const performanceRows = computed(() => {
  const baseline = estimatePerformanceBaseline(trendRows.value)
  let fitness = baseline
  let fatigue = baseline
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
  const sRaw = list.map(r => Number(r.form.toFixed(1)))
  // 状态线（Form）通常在 -30~30，做仅展示用的上移偏移，增强与体能/疲劳曲线的交错可读性
  const lowerLoad = Math.min(...f, ...a)
  const upperForm = Math.max(...sRaw)
  const formDisplayOffset = lowerLoad > upperForm ? (lowerLoad - upperForm) * 0.82 : 0
  const sDisplay = sRaw.map(v => Number((v + formDisplayOffset).toFixed(1)))
  const bound = dataBoundMinMax([...f, ...a, ...sDisplay], 0.1)
  return {
    grid: { left: 44, right: 20, top: 30, bottom: 38 },
    legend: { bottom: 0, data: [t('analysis_fitness'), t('analysis_fatigue'), t('analysis_form')] },
    xAxis: { type: 'category', data: x, boundaryGap: false },
    yAxis: { type: 'value', scale: true, min: bound.min, max: bound.max, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
    series: [
      { name: t('analysis_fitness'), type: 'line', data: f, smooth: true, itemStyle: { color: '#91cc75' } },
      { name: t('analysis_fatigue'), type: 'line', data: a, smooth: true, itemStyle: { color: '#ee6666' } },
      { name: t('analysis_form'), type: 'line', data: sDisplay, smooth: true, itemStyle: { color: '#fac858' } },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params?.length) return ''
        const idx = Number(params[0]?.dataIndex ?? 0)
        const lines = [
          params[0].name,
          `${t('analysis_fitness')}: ${Math.round(f[idx] ?? 0)}`,
          `${t('analysis_fatigue')}: ${Math.round(a[idx] ?? 0)}`,
          `${t('analysis_form')}: ${Math.round(sRaw[idx] ?? 0)}`,
        ]
        return lines.join('<br/>')
      },
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

const paceDistPieOption = computed(() => {
  const rows = paceDistributionRows.value
  const total = rows.reduce((s, r) => s + r.time, 0)
  if (!rows.length || total <= 0) return null
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['40%', '50%'],
      data: rows.map((r) => ({
        value: Number(((r.time / total) * 100).toFixed(1)),
        name: r.name,
        itemStyle: { color: paceZoneColor(r.zone) },
      })),
      label: { formatter: '{b}\n{d}%' },
    }],
  }
})
const paceDistChartOption = computed(() => {
  const rows = paceDistributionRows.value
  if (!rows.length) return null
  const y = rows.map((r) => r.time)
  const yMax = Math.max(...y) * 1.08
  return {
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: rows.map((r) => r.name), axisLabel: { color: axisLabelColor.value }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: {
      type: 'value',
      name: t('analysis_time'),
      nameTextStyle: { color: axisLabelColor.value },
      axisLabel: { formatter: (v: number) => formatDurationHMS(Math.round(v)), color: axisLabelColor.value },
      min: 0,
      max: yMax,
      splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } },
    },
    series: [{ type: 'bar', data: y, itemStyle: { color: '#17C13E' } }],
    tooltip: { trigger: 'axis', formatter: (p: any) => (p?.[0] ? `${p[0].name}: ${formatDurationHMS(Math.round(rows[p[0].dataIndex].time))}` : '') },
  }
})

const heartDistPieOption = computed(() => {
  const rows = heartDistributionRows.value
  const total = rows.reduce((s, r) => s + r.time, 0)
  if (!rows.length || total <= 0) return null
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['40%', '50%'],
      data: rows.map((r) => ({
        value: Number(((r.time / total) * 100).toFixed(1)),
        name: r.name,
        itemStyle: { color: paceZoneColor(r.zone) },
      })),
      label: { formatter: '{b}\n{d}%' },
    }],
  }
})
const heartDistChartOption = computed(() => {
  const rows = heartDistributionRows.value
  if (!rows.length) return null
  const y = rows.map((r) => r.time)
  const yMax = Math.max(...y) * 1.08
  return {
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: rows.map((r) => r.name), axisLabel: { color: axisLabelColor.value }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: {
      type: 'value',
      name: t('analysis_time'),
      nameTextStyle: { color: axisLabelColor.value },
      axisLabel: { formatter: (v: number) => formatDurationHMS(Math.round(v)), color: axisLabelColor.value },
      min: 0,
      max: yMax,
      splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } },
    },
    series: [{ type: 'bar', data: y, itemStyle: { color: (params: any) => paceZoneColor(rows[params.dataIndex]?.zone) } }],
    tooltip: { trigger: 'axis', formatter: (p: any) => (p?.[0] ? `${p[0].name}: ${formatDurationHMS(Math.round(rows[p[0].dataIndex].time))}` : '') },
  }
})

function makeSimpleTrendOption(rows: { date: string; value: number }[], color: string, yName: string) {
  const list = rows.filter((r) => r.value > 0)
  if (!list.length) return null
  const x = list.map((r) => dayjs(r.date).format('MM/DD'))
  const v = list.map((r) => r.value)
  const ma = expandingMean(v)
  const b = dataBoundMinMax(v)
  return {
    grid: { left: 50, right: 20, top: 20, bottom: 32 },
    xAxis: { type: 'category', data: x, boundaryGap: false, axisLabel: { rotate: 45, color: axisLabelColor.value }, axisLine: { lineStyle: { color: axisLineColor.value } } },
    yAxis: { type: 'value', name: yName, nameTextStyle: { color: axisLabelColor.value }, axisLabel: { color: axisLabelColor.value }, scale: true, min: b.min, max: b.max, splitLine: { lineStyle: { color: darkSplit.value, type: 'dashed' } } },
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

const hrvChartOption = computed(() => makeSimpleTrendOption(hrvDailyRows.value, '#3F51B5', 'ms'))
const hrvGrowth = computed(() => growthFromValues(hrvDailyRows.value.map((r) => r.value)))
const weightChartOption = computed(() => makeSimpleTrendOption(weightDailyRows.value, '#009688', 'kg'))
const weightGrowth = computed(() => growthFromValues(weightDailyRows.value.map((r) => r.value), { lowerIsBetter: true }))

onMounted(async () => {
  await initSync()
  await loadFromDB()
  // 分析页增量同步策略：
  // - 本地无历史：首次拉近 60 天，保证图表有足够数据
  // - 本地已有历史：仅拉近 7 天，降低接口压力
  const syncDays = analysisData.value.length > 0 ? 7 : 60
  try {
    await syncRecentDays(syncDays)
  } catch {
    // 页面首次加载失败不阻断渲染，用户可手动重试
  }
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
.chart-growth { display: inline-flex; align-items: center; gap: 2px; font-size: 0.8rem; font-weight: 600; }
.chart-growth--up { color: rgb(var(--v-theme-success)); }
.chart-growth--down { color: rgb(var(--v-theme-error)); }
.chart-growth--flat { color: rgba(var(--v-theme-on-surface), 0.6); }
.chart-wrap { height: 240px; }
.chart-wrap-tall { height: 320px; }
.chart-wrap-pie { height: 220px; }
.posture-zone-table-wrap { overflow-x: auto; }
.posture-zone-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.posture-zone-table th, .posture-zone-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid rgba(var(--v-border-color), 0.08); }
.posture-zone-table th { font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.7); }
.posture-zone-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.zone-badge { display: inline-block; min-width: 24px; padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: 700; font-size: 0.8rem; text-align: center; }
.analysis-masonry { column-gap: 20px; column-count: 1; }
@media (min-width: 700px) { .analysis-masonry { column-count: 2; } }
@media (min-width: 1040px) { .analysis-masonry { column-count: 3; } }
@media (min-width: 1380px) { .analysis-masonry { column-count: 4; } }
</style>
