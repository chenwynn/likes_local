<template>
  <div class="runcourse-page">
    <div class="runcourse-header mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-2">
        <h1 class="text-h5 font-weight-bold mb-0">{{ t('nav_runcourse') }}</h1>
        <v-btn-toggle v-model="tab" mandatory density="compact" color="primary" variant="outlined">
          <v-btn value="mine">{{ t('runcourse_tab_mine') }}</v-btn>
          <v-btn value="official">{{ t('runcourse_tab_official') }}</v-btn>
        </v-btn-toggle>
      </div>
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <div class="d-flex align-center flex-wrap gap-2">
          <v-select v-model="filterSports" :items="sportsOptions" item-title="title" item-value="value" :label="t('runcourse_filter_sports')" density="compact" variant="outlined" hide-details class="filter-select" />
          <v-select v-model="filterWeight" :items="weightOptions" item-title="title" item-value="value" :label="t('runcourse_filter_weight')" density="compact" variant="outlined" hide-details class="filter-select" />
          <v-select v-model="filterType" :items="typeOptions" item-title="title" item-value="value" :label="t('runcourse_filter_training_type')" density="compact" variant="outlined" hide-details class="filter-select" />
          <v-select v-if="tab === 'official'" v-model="filterGrade" :items="gradeOptions" item-title="title" item-value="value" :label="t('runcourse_filter_grade')" density="compact" variant="outlined" hide-details class="filter-select" />
        </div>
        <v-btn v-if="tab === 'mine'" color="primary" prepend-icon="mdi-plus" @click="openEdit()">{{ t('runcourse_add') }}</v-btn>
      </div>
    </div>

    <template v-if="tab === 'mine'">
      <p v-if="!filteredMineList.length" class="text-center text-medium-emphasis py-8">{{ t('runcourse_no_data') }}</p>
      <div class="analysis-masonry">
        <v-card v-for="course in filteredMineList" :key="course.id" class="analysis-card runcourse-card" variant="outlined" @click="openEdit(course)">
          <v-card-title class="analysis-card-title runcourse-card-title runcourse-card-title-bar">
            <span class="runcourse-card-title-text">
              <v-icon size="22" class="me-2 flex-shrink-0">{{ getRunTypeIcon(course.sports) }}</v-icon>
              <span class="runcourse-card-title-label">{{ course.title || t('calendar_untitled') }}</span>
            </span>
            <span class="runcourse-card-actions flex-shrink-0">
              <v-btn icon size="x-small" variant="text" :title="t('runcourse_copy')" :loading="copyingId === String(course.id)" @click.stop="copyMine(course)">
                <v-icon size="18">mdi-content-copy</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" :title="t('calendar_delete')" @click.stop="removeMine(course.id)">
                <v-icon size="18">mdi-delete-outline</v-icon>
              </v-btn>
            </span>
          </v-card-title>
          <v-card-text>
            <template v-if="course.description">
              <div v-if="!expandedDescIds.has('mine-' + course.id)" class="runcourse-desc-toggle mb-2">
                <v-btn variant="text" size="x-small" density="compact" prepend-icon="mdi-chevron-down" @click.stop="toggleDesc('mine-' + course.id)">
                  {{ t('runcourse_show_desc') }}
                </v-btn>
              </div>
              <div v-else class="runcourse-desc-wrap mb-2">
                <v-btn variant="text" size="x-small" density="compact" prepend-icon="mdi-chevron-up" class="mb-1" @click.stop="toggleDesc('mine-' + course.id)">
                  {{ t('runcourse_hide_desc') }}
                </v-btn>
                <div class="runcourse-desc text-body2">{{ course.description }}</div>
              </div>
            </template>
            <div v-if="getCourseDetail(course).html" class="batch-event-detail runcourse-detail">
              <div class="batch-event-detail-inner">
                <div class="event-detail-markdown runcourse-md" v-html="localizePlanHtml(getCourseDetail(course).html)" />
              </div>
            </div>
            <div
              v-if="getCourseDetail(course).echart && renderChartHtml(getCourseDetail(course).echart)"
              class="batch-chart-wrapper runcourse-chart"
              v-html="renderChartHtml(getCourseDetail(course).echart)"
            />
          </v-card-text>
        </v-card>
      </div>
    </template>

    <template v-else>
      <p v-if="officialLoading" class="text-center text-medium-emphasis py-8">{{ t('act_loading') }}</p>
      <p v-else-if="!displayedOfficialList.length" class="text-center text-medium-emphasis py-8">{{ t('runcourse_no_data') }}</p>
      <div class="analysis-masonry">
        <v-card v-for="item in displayedOfficialList" :key="item.id" class="analysis-card runcourse-card runcourse-card-official" variant="outlined">
          <v-card-title class="analysis-card-title runcourse-card-title runcourse-card-title-bar">
            <span class="runcourse-card-title-text">
              <v-icon size="22" class="me-2 flex-shrink-0">{{ getRunTypeIcon(Number(item.sports) || 1) }}</v-icon>
              <span class="runcourse-card-title-label">{{ item.title || t('calendar_untitled') }}</span>
            </span>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-content-copy" :loading="copyingId === String(item.id)" @click.stop="copyOfficial(item)">
              {{ t('runcourse_copy') }}
            </v-btn>
          </v-card-title>
          <v-card-text>
            <template v-if="item.description">
            <div v-if="!expandedDescIds.has('official-' + item.id)" class="runcourse-desc-toggle mb-2">
                <v-btn variant="text" size="x-small" density="compact" prepend-icon="mdi-chevron-down" @click.stop="toggleDesc('official-' + item.id)">
                  {{ t('runcourse_show_desc') }}
                </v-btn>
              </div>
              <div v-else class="runcourse-desc-wrap mb-2">
                <v-btn variant="text" size="x-small" density="compact" prepend-icon="mdi-chevron-up" class="mb-1" @click.stop="toggleDesc('official-' + item.id)">
                  {{ t('runcourse_hide_desc') }}
                </v-btn>
                <div class="runcourse-desc text-body2">{{ item.description }}</div>
              </div>
            </template>
            <div v-if="getOfficialCourseDetail(item).html" class="batch-event-detail runcourse-detail">
              <div class="batch-event-detail-inner">
                <div class="event-detail-markdown runcourse-md" v-html="localizePlanHtml(getOfficialCourseDetail(item).html)" />
              </div>
            </div>
            <div
              v-if="getOfficialCourseDetail(item).echart && renderChartHtml(getOfficialCourseDetail(item).echart)"
              class="batch-chart-wrapper runcourse-chart"
              v-html="renderChartHtml(getOfficialCourseDetail(item).echart)"
            />
          </v-card-text>
        </v-card>
      </div>
      <div v-if="hasMoreOfficial" class="text-center">
        <v-btn variant="outlined" @click="loadMoreOfficial">{{ t('runcourse_load_more') }}</v-btn>
      </div>
    </template>

    <v-dialog v-model="editOpen" max-width="1280" width="92vw" persistent>
      <PlanEditor :plan="selectedPlan" @close="closePlanEditor" @save="saveMinePlan" />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { db, saveRunCourse, type DBRunCourse } from '@/db'
import { useLocale } from '@/composables/useLocale'
import { useChartColorMode } from '@/composables/useChartColorMode'
import { getChartColorByMode } from '@/utils/chartColor'
import { getRunTypeIcon } from '@/utils'
import type { PlanEvent } from '@/types'
import PlanEditor from '@/components/PlanEditor.vue'
// @ts-ignore
import Mylikes from '@/utils/mylikes.js'

type OfficialCourseItem = {
  id: string | number
  title?: string
  name?: string
  description?: string
  content?: string
  type?: string
  grade?: string
  sports?: string | number
}

const { t, locale } = useLocale()
const { chartColorMode } = useChartColorMode()
const tab = ref<'mine' | 'official'>('mine')
const mineList = ref<DBRunCourse[]>([])
const officialList = ref<OfficialCourseItem[]>([])
const officialLoading = ref(false)
const copyingId = ref<string | null>(null)
const expandedDescIds = ref<Set<string>>(new Set())

const filterSports = ref<number | ''>('')
const filterWeight = ref<string>('')
const filterType = ref<string>('')
const filterGrade = ref<string>('')

const OFFICIAL_PAGE_SIZE = 20
const displayedOfficialLimit = ref(OFFICIAL_PAGE_SIZE)

const typeOptions = computed(() => [
  { value: '', title: t('runcourse_all') },
  { value: 'qingsong', title: 'qingsong' },
  { value: 'e', title: 'e' },
  { value: 'm', title: 'm' },
  { value: 't', title: 't' },
  { value: 'i', title: 'i' },
  { value: 'r', title: 'r' },
  { value: 'lsd', title: 'lsd' },
  { value: 'other', title: 'other' },
])
const weightOptions = computed(() => [
  { value: '', title: t('runcourse_all') },
  { value: 'q1', title: 'q1' },
  { value: 'q2', title: 'q2' },
  { value: 'q3', title: 'q3' },
  { value: 'xuanxiu', title: 'xuanxiu' },
])
const sportsOptions = computed(() => [
  { value: '', title: t('runcourse_all') },
  { value: 1, title: 'Run' },
  { value: 2, title: 'Ride' },
  { value: 5, title: 'Swim' },
  { value: 10, title: 'Strength' },
  { value: 254, title: 'Other' },
])
const gradeOptions = computed(() => [
  { value: '', title: t('runcourse_all') },
  { value: 'rumen', title: 'rumen' },
  { value: 'chuji', title: 'chuji' },
  { value: 'zhongji', title: 'zhongji' },
  { value: 'gaoji', title: 'gaoji' },
  { value: 'jingying', title: 'jingying' },
])

const filteredMineList = computed(() =>
  mineList.value.filter((c) => {
    if (filterSports.value !== '' && Number(c.sports) !== Number(filterSports.value)) return false
    if (filterWeight.value && c.weight !== filterWeight.value) return false
    if (filterType.value && c.type !== filterType.value) return false
    return true
  })
)
const filteredOfficialList = computed(() =>
  officialList.value.filter((c) => {
    if (filterSports.value !== '' && Number(c.sports) !== Number(filterSports.value)) return false
    if (filterType.value && String(c.type || '') !== filterType.value) return false
    if (filterGrade.value && String(c.grade || '') !== filterGrade.value) return false
    return true
  })
)
const displayedOfficialList = computed(() => filteredOfficialList.value.slice(0, displayedOfficialLimit.value))
const hasMoreOfficial = computed(() => displayedOfficialList.value.length < filteredOfficialList.value.length)

const editOpen = ref(false)
const editing = ref<DBRunCourse | null>(null)
const selectedPlan = ref<PlanEvent | null>(null)
const mylikesOption = { tPace: 330, heartMax: 190, heartMin: 60, ftp: 200, css: 120, tsp: 150 }
const courseDetailCache = new Map<number, { html: string; echart: { data: any[]; max: number } | null }>()
const officialDetailCache = new Map<string, { html: string; echart: { data: any[]; max: number } | null }>()

function toggleDesc(key: string) {
  const n = new Set(expandedDescIds.value)
  if (n.has(key)) n.delete(key)
  else n.add(key)
  expandedDescIds.value = n
}

function loadMoreOfficial() {
  displayedOfficialLimit.value += OFFICIAL_PAGE_SIZE
}

function localizePlanHtml(html: string): string {
  if (!html || typeof html !== 'string' || locale.value === 'zh') return html
  let s = html
  const replacements: Array<[RegExp, (() => string) | ((match: string, ...args: string[]) => string)]> = [
    [/热身/g, () => t('plan_section_warmup')],
    [/主课/g, () => t('plan_section_main')],
    [/放松/g, () => t('plan_section_cooldown')],
    [/冷身/g, () => t('plan_section_cooldown_alt')],
    [/间歇/g, () => t('plan_section_interval')],
    [/\s*组数\s*/g, () => ' ' + t('plan_section_group_count') + ' '],
    [/(\d+)\s*组/g, (_, n) => n + ' ' + t('plan_section_group')],
    [/组/g, () => t('plan_section_group')],
    [/×\s*(\d+)\s*次/g, (_, n) => '× ' + n + ' ' + t('plan_times_unit')],
    [/(\d+)\s*次/g, (_, n) => n + ' ' + t('plan_times_unit')],
    [/彻底休息/g, () => t('plan_md_full_rest')],
    [/乳酸阈值跑/g, () => t('plan_md_threshold_run')],
    [/配速跑/g, () => t('plan_md_pace_run')],
    [/功率跑/g, () => t('plan_md_power_run')],
    [/功率游/g, () => t('plan_md_power_swim')],
    [/心率跑/g, () => t('plan_md_hr_run')],
    [/轻松跑/g, () => t('plan_md_easy_run')],
    [/慢跑/g, () => t('plan_md_jog')],
    [/快跑/g, () => t('plan_md_fast_run')],
    [/配速/g, () => t('plan_md_pace')],
    [/休息/g, () => t('plan_md_rest')],
    [/分钟/g, () => t('plan_md_min')],
    [/秒/g, () => t('plan_md_sec')],
    [/公里/g, () => t('plan_md_km')],
    [/(\d+)米/g, (_, n) => n + t('plan_md_m')],
    [/心率/g, () => t('plan_md_hr')],
    [/(\d+)瓦/g, (_, n) => n + t('plan_md_w')],
    [/瓦/g, () => t('plan_md_w')],
  ]
  replacements.forEach(([pattern, repl]) => {
    s = s.replace(pattern, (match: string, ...args: string[]) => {
      if (typeof repl !== 'function') return repl as string
      if (args.length >= 1) return (repl as (m: string, ...a: string[]) => string)(match, ...args)
      return (repl as () => string)()
    })
  })
  return s
}

function renderChartHtml(echart: { data: any[]; max: number } | null): string {
  if (!echart || !echart.data || !echart.data.length) return ''
  const data = echart.data
  const max = echart.max || 1
  const fallbackWidth = 100 / data.length
  const bars = data
    .map((item: any) => {
      if (!item) return ''
      let width: number | null = item[6] != null ? Number(item[6]) : (item.width != null ? Number(item.width) : null)
      const speed = item[2] != null ? Number(item[2]) : (item.speed != null ? Number(item.speed) : (item.intensity != null ? Number(item.intensity) : (typeof item === 'number' ? item : 0)))
      const origColor = item[8] || item.color || '#60a5fa'
      const ratio = max > 0 ? speed / max : 0
      const color = getChartColorByMode(chartColorMode.value, ratio, origColor)
      if (width == null || width <= 0) width = fallbackWidth
      const topHeight = Math.max(0, Math.min(100, Math.floor(100 - (speed / max) * 100)))
      const barHeight = Math.max(0, Math.min(100, Math.floor((speed / max) * 100)))
      return `<div class="batch-chart-bar" style="width:${width}%;height:100%;"><span class="batch-chart-bar-top" style="display:block;height:${topHeight}%;"></span><span style="height:${barHeight}%;background:${color};display:block;border-radius:4px 4px 0 0;"></span></div>`
    })
    .filter(Boolean)
    .join('')
  if (!bars) return ''
  return `<div class="batch-chart-container">${bars}</div>`
}

function getCourseDetail(course: DBRunCourse): { html: string; echart: { data: any[]; max: number } | null } {
  const cached = courseDetailCache.get(course.id)
  if (cached !== undefined) return cached
  const raw = course.content || '[]'
  const empty = { html: '', echart: null as { data: any[]; max: number } | null }
  try {
    const contentData = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!contentData || (Array.isArray(contentData) && contentData.length === 0)) {
      courseDetailCache.set(course.id, empty)
      return empty
    }
    const mylikes = new (Mylikes as any)(mylikesOption)
    const lap = mylikes.getVltContent(contentData)
    if (!lap) {
      courseDetailCache.set(course.id, empty)
      return empty
    }
    const lapData = mylikes.createTaskRunDataLap(lap)
    const echartRaw = mylikes.getTaskEchart(lapData)
    const htmlResult = mylikes.getTaskHtmlShow(contentData, 'md')
    const html = (htmlResult && (typeof htmlResult === 'object' ? htmlResult.html : htmlResult))
      ? String(typeof htmlResult === 'object' ? htmlResult.html : htmlResult)
      : ''
    let echart: { data: any[]; max: number } | null = null
    if (echartRaw && Array.isArray(echartRaw) && echartRaw.length > 0) {
      const maxVal = Math.max(1, ...echartRaw.map((item: any) => (item && item[2] != null ? Number(item[2]) : 0)))
      echart = { data: echartRaw, max: maxVal }
    } else if (echartRaw && typeof echartRaw === 'object' && Array.isArray((echartRaw as any).data) && (echartRaw as any).data.length > 0) {
      echart = echartRaw as { data: any[]; max: number }
      if (echart.max == null || echart.max === 0) {
        const maxVal = Math.max(1, ...echart.data.map((item: any) => (item && item[2] != null ? Number(item[2]) : 0)))
        echart = { ...echart, max: maxVal }
      }
    }
    const result = { html, echart }
    courseDetailCache.set(course.id, result)
    return result
  } catch {
    courseDetailCache.set(course.id, empty)
    return empty
  }
}

function getOfficialCourseDetail(item: OfficialCourseItem): { html: string; echart: { data: any[]; max: number } | null } {
  const key = String(item.id)
  const cached = officialDetailCache.get(key)
  if (cached !== undefined) return cached
  const raw = item.content || '[]'
  const empty = { html: '', echart: null as { data: any[]; max: number } | null }
  try {
    const contentData = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!contentData || (Array.isArray(contentData) && contentData.length === 0)) {
      officialDetailCache.set(key, empty)
      return empty
    }
    const mylikes = new (Mylikes as any)(mylikesOption)
    const lap = mylikes.getVltContent(contentData)
    if (!lap) {
      officialDetailCache.set(key, empty)
      return empty
    }
    const lapData = mylikes.createTaskRunDataLap(lap)
    const echartRaw = mylikes.getTaskEchart(lapData)
    const htmlResult = mylikes.getTaskHtmlShow(contentData, 'md')
    const html = (htmlResult && (typeof htmlResult === 'object' ? htmlResult.html : htmlResult))
      ? String(typeof htmlResult === 'object' ? htmlResult.html : htmlResult)
      : ''
    let echart: { data: any[]; max: number } | null = null
    if (echartRaw && Array.isArray(echartRaw) && echartRaw.length > 0) {
      const maxVal = Math.max(1, ...echartRaw.map((item: any) => (item && item[2] != null ? Number(item[2]) : 0)))
      echart = { data: echartRaw, max: maxVal }
    } else if (echartRaw && typeof echartRaw === 'object' && Array.isArray((echartRaw as any).data) && (echartRaw as any).data.length > 0) {
      echart = echartRaw as { data: any[]; max: number }
      if (echart.max == null || echart.max === 0) {
        const maxVal = Math.max(1, ...echart.data.map((item: any) => (item && item[2] != null ? Number(item[2]) : 0)))
        echart = { ...echart, max: maxVal }
      }
    }
    const result = { html, echart }
    officialDetailCache.set(key, result)
    return result
  } catch {
    officialDetailCache.set(key, empty)
    return empty
  }
}

async function loadMine() {
  courseDetailCache.clear()
  mineList.value = await db.runcourse.orderBy('updated_at').reverse().toArray()
}

async function loadOfficial() {
  if (officialList.value.length) return
  officialLoading.value = true
  try {
    const url = new URL(`${import.meta.env.BASE_URL}runcourse.json`, window.location.href).toString()
    const res = await fetch(url)
    const data = await res.json()
    officialList.value = Array.isArray(data) ? data : []
    officialDetailCache.clear()
  } catch {
    officialList.value = []
  } finally {
    officialLoading.value = false
  }
}

function openEdit(course?: DBRunCourse) {
  editing.value = course ?? null
  selectedPlan.value = {
    id: course?.id ?? 0,
    game_task_user_id: 0,
    game_id: 0,
    section_id: 0,
    task_id: 0,
    user_id: 0,
    title: course?.title ?? '',
    name: course?.name ?? '',
    description: course?.description ?? '',
    desc: course?.description ?? '',
    start: '',
    end: '',
    start_time: 0,
    end_time: 0,
    type: course?.type ?? 'other',
    weight: course?.weight ?? 'xuanxiu',
    sports: course?.sports ?? 1,
    status: course?.status ?? 1,
    content: course?.content ?? '[]',
    task_content: course?.content ?? '[]',
  }
  editOpen.value = true
}

function closePlanEditor() {
  editOpen.value = false
  selectedPlan.value = null
}

async function saveMinePlan(updated: PlanEvent) {
  await saveRunCourse({
    id: editing.value?.id,
    title: updated.title || '',
    name: updated.name || '',
    description: updated.description || '',
    content: updated.content || updated.task_content || '[]',
    type: updated.type || 'other',
    weight: updated.weight || 'xuanxiu',
    sports: Number(updated.sports) || 1,
    status: Number(updated.status) || 1,
  })
  closePlanEditor()
  await loadMine()
}

async function removeMine(id: number) {
  if (!window.confirm(t('runcourse_delete_confirm'))) return
  await db.runcourse.delete(id)
  await loadMine()
}

async function copyMine(course: DBRunCourse) {
  await saveRunCourse({
    title: `${course.title || ''} (Copy)`.trim(),
    name: course.name,
    description: course.description,
    content: course.content,
    type: course.type,
    weight: course.weight,
    sports: course.sports,
    status: course.status,
  })
  await loadMine()
}

async function copyOfficial(item: OfficialCourseItem) {
  copyingId.value = String(item.id)
  try {
    await saveRunCourse({
      title: item.title || '',
      name: item.name || item.title || '',
      description: item.description || '',
      content: item.content || '[]',
      type: item.type || 'other',
      weight: 'xuanxiu',
      sports: Number(item.sports) || 1,
      status: 1,
    })
    tab.value = 'mine'
    await loadMine()
  } finally {
    copyingId.value = null
  }
}

watch([filterSports, filterType, filterGrade], () => {
  displayedOfficialLimit.value = OFFICIAL_PAGE_SIZE
})

onMounted(async () => {
  await loadMine()
  await loadOfficial()
})
</script>

<style scoped>
.runcourse-page { max-width: 100%; }
.runcourse-header { padding: 0 4px; }
.filter-select { width: 140px; min-width: 120px; }
.analysis-masonry { column-gap: 20px; column-count: 1; }
.analysis-card { break-inside: avoid; border: 1px solid rgba(var(--v-border-color), 0.12); border-radius: 8px; box-shadow: none !important; margin-bottom: 20px; }
.runcourse-card { transition: box-shadow .2s ease; cursor: pointer; }
.runcourse-card-official { cursor: default; }
.runcourse-card:hover { box-shadow: 0 2px 14px rgba(0,0,0,0.06) !important; }
.runcourse-card-title { font-size: 1.2rem !important; font-weight: 600 !important; }
.runcourse-card-title-bar { display: flex !important; align-items: center; gap: 8px; min-height: 48px; position: relative; z-index: 2; background: rgb(var(--v-theme-surface)); flex-wrap: nowrap; }
.runcourse-card-title-text { min-width: 0; flex: 1 1 auto; display: flex; align-items: center; overflow: hidden; }
.runcourse-card-title-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.runcourse-card-actions { flex-shrink: 0; display: inline-flex; align-items: center; gap: 0; }
.runcourse-desc-toggle, .runcourse-desc-wrap { margin-top: 2px; }
.runcourse-desc { color: rgba(var(--v-theme-on-surface), 0.8); white-space: pre-wrap; }
.runcourse-detail.batch-event-detail { margin-top: 4px; font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.6); white-space: normal; word-break: break-word; }
.runcourse-detail .batch-event-detail-inner { margin-bottom: 6px; }
.runcourse-md.event-detail-markdown { font-size: 11px; line-height: 1.5; color: rgba(var(--v-theme-on-surface), 0.85); }
.runcourse-md.event-detail-markdown :deep(.section.section-md) { margin: 0.25em 0; }
.runcourse-md.event-detail-markdown :deep(.section-title-md) { font-weight: 600; margin: 0.2em 0 0.15em; font-size: 1em; }
.runcourse-md.event-detail-markdown :deep(.task-group-md) { margin: 0.35em 0; }
.runcourse-md.event-detail-markdown :deep(.group-count-md) { font-weight: 600; display: inline-block; margin-bottom: 0.15em; }
.runcourse-md.event-detail-markdown :deep(.group-content-md) { padding-left: 1.2em; margin: 0.15em 0 0.25em; border-left: 2px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.runcourse-md.event-detail-markdown :deep(.group-content-md .lap-item-md) { margin: 0.2em 0; color: rgba(var(--v-theme-on-surface), 0.65); font-size: 0.95em; }
.runcourse-md.event-detail-markdown :deep(.lap-item-md) { display: block; }
.runcourse-md.event-detail-markdown :deep(.lap-duration-md),
.runcourse-md.event-detail-markdown :deep(.lap-name-md),
.runcourse-md.event-detail-markdown :deep(.lap-intensity-md) { margin-right: 0.35em; }
.runcourse-md.event-detail-markdown :deep(.task-item-md) { margin: 0.2em 0; color: rgba(var(--v-theme-on-surface), 0.6); }
.runcourse-md.event-detail-markdown :deep(.section.section-md > .task-item-md) { font-weight: 600; }
.runcourse-chart { min-height: 60px; margin-top: 8px; }
.batch-chart-wrapper :deep(.batch-chart-container) { display: flex; align-items: flex-end; height: 60px; width: 100%; gap: 2px; }
.batch-chart-wrapper :deep(.batch-chart-bar) { min-width: 4px; }
@media (min-width: 900px) { .analysis-masonry { column-count: 2; } }
</style>
