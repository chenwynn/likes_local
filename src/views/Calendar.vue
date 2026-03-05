<template>
  <div class="calendar-page">
    <div class="calendar-header mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <div class="d-flex align-center gap-2">
          <h1 class="text-h5 font-weight-bold mb-0">{{ t('nav_calendar') }}</h1>
          <v-btn
            size="small"
            variant="tonal"
            :color="planLibraryOpen ? 'primary' : undefined"
            :title="t('calendar_plan_library')"
            class="plan-library-trigger"
            prepend-icon="mdi-book-open-variant"
            @click="togglePlanLibrary"
          >
            {{ t('calendar_plan_library') }}
          </v-btn>
        </div>
        <div class="d-flex align-center gap-2">
          <v-btn variant="outlined" prepend-icon="mdi-chevron-left" @click="shiftMonth(-1)" />
          <div class="text-subtitle-1 font-weight-medium month-title">{{ currentMonthLabel }}</div>
          <v-btn variant="outlined" prepend-icon="mdi-chevron-right" @click="shiftMonth(1)" />
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreatePlan">{{ t('calendar_add_plan') }}</v-btn>
          <v-btn variant="text" icon="mdi-content-copy" :title="t('calendar_copy')" @click="copyMonthPlans" />
          <v-btn variant="text" icon="mdi-content-paste" :title="t('calendar_paste')" :disabled="copyBuffer?.type !== 'month'" @click="pasteMonthPlans" />
          <v-btn variant="text" icon="mdi-delete-outline" :title="t('calendar_delete')" @click="deleteMonthPlans" />
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-content-save" :disabled="!dirty" @click="saveLocalChanges">
            {{ t('settings_save') }}
          </v-btn>
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-sync" :loading="syncing" @click="openSyncDialog">
            {{ t('calendar_sync_remote') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-file-excel-outline"
            :disabled="pushCandidateCount === 0"
            @click="exportMonthPlansExcel"
          >
            {{ t('calendar_export_excel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-cloud-upload-outline"
            :disabled="pushCandidateCount === 0 || pushingPlans"
            :loading="pushingPlans"
            @click="openPushDialog"
          >
            {{ t('calendar_push_account') }}
          </v-btn>
        </div>
      </div>
    </div>

    <v-card variant="outlined" class="calendar-card mb-4">
      <v-card-text>
        <div class="calendar-main-wrap">
          <aside v-if="planLibraryOpen" class="calendar-plan-library">
            <div class="plan-library-header">
              <span class="plan-library-title">{{ t('nav_runcourse') }}</span>
              <v-btn icon size="x-small" variant="text" @click="planLibraryOpen = false">
                <v-icon size="16">mdi-close</v-icon>
              </v-btn>
            </div>
            <div class="plan-library-content">
              <template v-if="planLibraryLoading">
                <v-skeleton-loader v-for="i in 4" :key="i" type="text" class="mb-2" />
              </template>
              <template v-else-if="!planLibraryList.length">
                <p class="text-caption text-medium-emphasis py-3">{{ t('runcourse_no_data') }}</p>
              </template>
              <template v-else>
                <div
                  v-for="course in planLibraryList"
                  :key="course.id"
                  class="batch-event plan-library-card"
                  draggable="true"
                  @dragstart="onRunCourseDragStart($event, course.id)"
                >
                  <div class="batch-event-header d-flex align-center">
                    <v-icon size="16" class="me-1 flex-shrink-0">{{ getRunTypeIcon(course.sports) }}</v-icon>
                    <div class="batch-event-title">{{ course.title || t('calendar_untitled') }}</div>
                  </div>
                  <div v-if="course.name" class="batch-event-code">
                    <span class="batch-event-code-text">{{ course.name }}</span>
                  </div>
                  <div
                    v-if="getRunCourseEventDetail(course).html"
                    class="batch-event-detail"
                  >
                    <div class="batch-event-detail-inner">
                      <div class="event-detail-markdown" v-html="localizePlanHtml(getRunCourseEventDetail(course).html)" />
                    </div>
                  </div>
                  <div
                    v-if="getRunCourseEventDetail(course).echart && renderPlanChartHtml(getRunCourseEventDetail(course).echart)"
                    class="batch-event-chart"
                    v-html="renderPlanChartHtml(getRunCourseEventDetail(course).echart)"
                  />
                </div>
              </template>
            </div>
          </aside>

          <div class="calendar-grid-wrap">
            <div class="weekday-row">
              <div class="weekday-cell week-col">{{ t('calendar_week') }}</div>
              <div v-for="w in weekNames" :key="w" class="weekday-cell">{{ w }}</div>
            </div>
            <div v-for="week in weeklyRows" :key="week.weekKey" class="grid-week-row">
              <div class="week-summary-cell">
              <div class="week-header">
                <span class="week-label">W{{ week.weekNumber }}</span>
                <div class="week-actions">
                  <v-btn icon size="x-small" variant="text" :title="t('calendar_copy_week')" @click="copyWeek(week.weekKey)"><v-icon size="14">mdi-content-copy</v-icon></v-btn>
                  <v-btn icon size="x-small" variant="text" :title="t('calendar_paste_week')" :disabled="copyBuffer?.type !== 'week'" @click="pasteWeek(week.weekKey)"><v-icon size="14">mdi-content-paste</v-icon></v-btn>
                  <v-btn icon size="x-small" variant="text" :title="t('calendar_delete_week')" @click="deleteWeek(week.weekKey)"><v-icon size="14">mdi-delete-outline</v-icon></v-btn>
                </div>
              </div>
              <div class="week-stats">
                <div class="stat-item"><span class="stat-label">{{ t('calendar_time') }}</span><span class="stat-value">{{ week.actualTime }} / {{ week.planTime }}</span></div>
                <div class="stat-item"><span class="stat-label">{{ t('calendar_dist') }}</span><span class="stat-value">{{ week.actualDist }} / {{ week.planDist }}</span></div>
                <div class="stat-item"><span class="stat-label">{{ t('calendar_load_tss') }}</span><span class="stat-value">{{ week.actualLoad }} / {{ week.planLoad }}</span></div>
              </div>
              <div class="week-progress" v-if="week.hasPlanOrActual">
                <div class="progress-item">
                  <div class="progress-head">
                    <span>{{ t('calendar_time') }}</span>
                    <span>{{ week.timePercent }}%</span>
                  </div>
                  <div class="progress-caption">{{ week.actualTime }} / {{ week.planTime }}</div>
                  <v-progress-linear :model-value="week.timePercent" color="primary" rounded height="4" />
                </div>
                <div class="progress-item">
                  <div class="progress-head">
                    <span>{{ t('calendar_dist') }}</span>
                    <span>{{ week.distPercent }}%</span>
                  </div>
                  <div class="progress-caption">{{ week.actualDist }} / {{ week.planDist }}</div>
                  <v-progress-linear :model-value="week.distPercent" color="primary" rounded height="4" />
                </div>
                <div class="progress-item">
                  <div class="progress-head">
                    <span>{{ t('calendar_load_tss') }}</span>
                    <span>{{ week.loadPercent }}%</span>
                  </div>
                  <div class="progress-caption">{{ week.actualLoad }} / {{ week.planLoad }}</div>
                  <v-progress-linear :model-value="week.loadPercent" color="primary" rounded height="4" />
                </div>
              </div>
            </div>
              <div
                v-for="d in week.days"
                :key="d.key"
                class="day-cell"
                :class="{
                  'day-outside': !d.inMonth,
                  'day-today': d.isToday,
                  'day-selected': d.key === selectedDay,
                  'day-drop-target': dragOverDay === d.key,
                }"
                @click="selectedDay = d.key"
                @dragover.prevent
                @dragenter.prevent="onDragEnterDay(d.key)"
                @dragleave="onDragLeaveDay(d.key)"
                @drop="onDropDay(d.key)"
              >
              <div class="batch-cell-actions">
                <v-btn icon size="x-small" variant="text" :title="t('calendar_add_plan')" @click.stop="addPlanToDay(d.key)"><v-icon size="14">mdi-plus</v-icon></v-btn>
                <v-btn icon size="x-small" variant="text" :title="t('calendar_copy')" :disabled="d.items.length === 0" @click.stop="copyDay(d.key)"><v-icon size="14">mdi-content-copy</v-icon></v-btn>
                <v-btn icon size="x-small" variant="text" :title="t('calendar_paste')" :disabled="copyBuffer?.type !== 'event'" @click.stop="pasteToDay(d.key)"><v-icon size="14">mdi-content-paste</v-icon></v-btn>
                <v-btn icon size="x-small" variant="text" :title="t('calendar_delete')" :disabled="dayEditableCount(d.key) === 0" @click.stop="deleteDay(d.key)"><v-icon size="14">mdi-delete-outline</v-icon></v-btn>
              </div>
              <div class="cell-header">
                <span class="cell-day">{{ d.weekday }}</span>
                <span class="cell-date">{{ d.day }}</span>
                <span class="cell-month">{{ d.monthLabel }}</span>
              </div>
              <div class="day-list">
                <div
                  v-for="item in d.items"
                  :key="item.id"
                  :class="['batch-event', 'plan-card', { 'plan-card-readonly': isReadOnlyPlan(item) }]"
                  :title="item.title || item.name"
                  :draggable="!isReadOnlyPlan(item)"
                  @dragstart="onDragStart(item.id)"
                  @click.stop="openEditPlan(item)"
                >
                  <div class="plan-card-actions">
                    <v-btn
                      icon
                      size="x-small"
                      variant="text"
                      class="plan-card-favorite"
                      :title="t('calendar_collect_plan')"
                      @click.stop="collectPlanToLibrary(item)"
                    >
                      <v-icon size="13">mdi-star-plus-outline</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="!isReadOnlyPlan(item)"
                      icon
                      size="x-small"
                      variant="text"
                      class="plan-card-delete"
                      :title="t('calendar_delete')"
                      @click.stop="removePlan(item.id)"
                    >
                      <v-icon size="13">mdi-close</v-icon>
                    </v-btn>
                  </div>
                  <div class="batch-event-header d-flex align-center">
                    <v-icon size="16" class="me-1 flex-shrink-0">{{ getRunTypeIcon(item.sports) }}</v-icon>
                    <div class="batch-event-title">{{ item.title || t('calendar_untitled') }}</div>
                    <span v-if="isReadOnlyPlan(item)" class="readonly-badge ms-1">{{ t('calendar_training_plan') }}</span>
                  </div>
                  <div
                    v-if="item.name"
                    class="batch-event-code"
                    @click.stop="toggleNameVisible(planKey(item))"
                    :title="eventNameVisible(planKey(item)) ? t('runcourse_hide_desc') : t('runcourse_show_desc')"
                  >
                    <span v-show="!eventNameVisible(planKey(item))" class="batch-event-code-toggle">&lt;&gt;</span>
                    <span v-show="eventNameVisible(planKey(item))" class="batch-event-code-text">{{ item.name }}</span>
                  </div>
                  <div class="batch-event-toggle-wrapper" @click.stop>
                    <div class="batch-event-toggle" @click="toggleEventDetail(planKey(item))" v-if="hasEventDetail(item)">
                      <v-icon size="small">{{ eventDetailExpanded(planKey(item)) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
                      <span>{{ eventDetailExpanded(planKey(item)) ? t('runcourse_hide_desc') : t('runcourse_show_desc') }}</span>
                    </div>
                  </div>
                  <div
                    v-if="hasEventDetail(item)"
                    class="batch-event-detail"
                    :class="{ collapsed: !eventDetailExpanded(planKey(item)) }"
                  >
                    <div class="batch-event-detail-inner" v-if="(item.description || item.desc) || getPlanEventDetail(item).html">
                      <template v-if="item.description || item.desc">{{ item.description || item.desc }}</template>
                      <div v-else-if="getPlanEventDetail(item).html" class="event-detail-markdown" v-html="localizePlanHtml(getPlanEventDetail(item).html)" />
                    </div>
                  </div>
                  <div
                    v-if="getPlanEventDetail(item).echart && renderPlanChartHtml(getPlanEventDetail(item).echart)"
                    class="batch-event-chart"
                    v-html="renderPlanChartHtml(getPlanEventDetail(item).echart)"
                  />
                </div>
                <div
                  v-for="activity in d.activities"
                  :key="`a-${activity.id}`"
                  class="activity-card"
                  :style="{ borderLeftColor: getActivityColor(activity) }"
                  @click.stop="openReceipt(activity)"
                >
                  <div class="activity-summary">
                    <span class="activity-time">{{ formatActivityTime(activity) }}</span>
                    <span class="activity-distance">{{ formatDistance(activity.run_km) }}</span>
                  </div>
                  <div class="activity-type d-flex align-center">
                    <v-icon size="14" class="me-1">{{ getRunTypeIcon(activity.run_type) }}</v-icon>
                    {{ runTypeLabel(activity.run_type ?? 0) }}
                  </div>
                  <div class="activity-stats">
                    <span v-if="activity.avg_heart > 0">{{ t('calendar_heart') }} {{ activity.avg_heart }}</span>
                    <span v-if="activityPaceOrSpeed(activity)">{{ activityPaceOrSpeed(activity) }}</span>
                  </div>
                  <div v-if="activity.tss > 0" class="activity-load">
                    {{ t('calendar_load_tss') }} {{ Math.round(activity.tss) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="planDialogOpen" max-width="1280" width="92vw" persistent>
      <PlanEditor :plan="selectedPlan" @close="closePlanEditor" @save="handlePlanSave" />
    </v-dialog>

    <v-dialog v-model="syncDialogOpen" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1">{{ t('calendar_sync_mode_title') }}</v-card-title>
        <v-card-text>
          <div class="text-body2 mb-2">{{ t('calendar_sync_mode_summary') }}</div>
          <div class="push-meta">
            <div><span class="label">{{ t('calendar_push_date_range') }}:</span> <span>{{ pushRangeText }}</span></div>
            <div><span class="label">{{ t('calendar_push_count') }}:</span> <span>{{ pushCandidateCount }}</span></div>
          </div>
          <v-switch
            v-model="syncOverwrite"
            color="primary"
            hide-details
            class="mt-3"
            :label="syncOverwrite ? t('calendar_sync_mode_overwrite') : t('calendar_sync_mode_merge')"
          />
          <div class="text-caption text-medium-emphasis mt-2">{{ t('calendar_sync_mode_hint') }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="syncDialogOpen = false">{{ t('settings_cancel') }}</v-btn>
          <v-btn color="primary" :loading="syncing" @click="syncRemotePlans">
            {{ t('settings_save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="pushDialogOpen" max-width="560" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1">{{ t('calendar_push_account') }}</v-card-title>
        <v-card-text>
          <div class="text-body2 mb-2">
            {{ t('calendar_push_summary') }}
          </div>
          <div class="push-meta">
            <div><span class="label">{{ t('calendar_push_date_range') }}:</span> <span>{{ pushRangeText }}</span></div>
            <div><span class="label">{{ t('calendar_push_dates') }}:</span> <span>{{ pushCandidateDates }}</span></div>
            <div><span class="label">{{ t('calendar_push_count') }}:</span> <span>{{ pushCandidateCount }}</span></div>
          </div>
          <v-switch
            v-model="pushOverwrite"
            color="primary"
            hide-details
            class="mt-3"
            :label="pushOverwrite ? t('calendar_push_mode_overwrite') : t('calendar_push_mode_append')"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="pushDialogOpen = false">{{ t('settings_cancel') }}</v-btn>
          <v-btn color="primary" :loading="pushingPlans" :disabled="pushCandidateCount === 0" @click="confirmPushPlans">
            {{ t('settings_save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="pushResultDialogOpen" max-width="520">
      <v-card class="push-result-card">
        <v-card-text class="pt-6 pb-4">
          <div class="push-result-hero" :class="`state-${pushResultState}`">
            <template v-if="pushResultState === 'success'">
              <svg class="checkmark" viewBox="0 0 52 52" aria-hidden="true">
                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path class="checkmark-check" fill="none" d="M14 27l7 7 17-17" />
              </svg>
            </template>
            <template v-else-if="pushResultState === 'partial'">
              <v-icon size="54" color="warning">mdi-alert-circle-outline</v-icon>
            </template>
            <template v-else>
              <v-icon size="54" color="error">mdi-close-circle-outline</v-icon>
            </template>
            <div class="push-result-title">
              {{
                pushResultState === 'success'
                  ? t('calendar_push_result_title_success')
                  : pushResultState === 'partial'
                    ? t('calendar_push_result_title_partial')
                    : t('calendar_push_result_title_failed')
              }}
            </div>
          </div>

          <div v-if="pushResultSummary" class="push-result-stats mt-4">
            <div><span>{{ t('calendar_push_result_total') }}</span><strong>{{ pushResultSummary.total }}</strong></div>
            <div><span>{{ t('calendar_push_result_inserted') }}</span><strong>{{ pushResultSummary.inserted }}</strong></div>
            <div><span>{{ t('calendar_push_result_parse_failed') }}</span><strong>{{ pushResultSummary.parse_failed }}</strong></div>
            <div><span>{{ t('calendar_push_result_insert_failed') }}</span><strong>{{ pushResultSummary.insert_failed }}</strong></div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="tonal" @click="pushResultDialogOpen = false">
            {{ t('calendar_close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="receiptDialog"
      :fullscreen="receiptFullscreen"
      max-width="960"
      width="95vw"
      transition="dialog-bottom-transition"
      persistent
      scrollable
      content-class="receipt-dialog"
    >
      <v-card v-if="receiptActivity" class="receipt-dialog-card">
        <v-toolbar density="compact" class="receipt-toolbar">
          <v-toolbar-title>{{ t('act_receipt') }}</v-toolbar-title>
          <v-spacer />
          <v-btn icon size="small" variant="text" :title="receiptFullscreen ? t('act_exit_fullscreen') : t('act_fullscreen')" @click="receiptFullscreen = !receiptFullscreen">
            <v-icon>{{ receiptFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" @click="closeReceipt">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="receipt-dialog-content">
          <ActivityReceiptDetail :activity="receiptActivity" @close="closeReceipt" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="collectSnackbar"
      :timeout="1800"
      color="success"
      location="bottom"
    >
      {{ t('calendar_collect_success') }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { useLocale } from '@/composables/useLocale'
import { useChartColorMode } from '@/composables/useChartColorMode'
import { getChartColorByMode } from '@/utils/chartColor'
import { getRunTypeIcon } from '@/utils'
import { formatDurationHMS, formatDistance, formatPace } from '@/utils'
import * as XLSX from 'xlsx'
import { RUN_TYPE_COLORS } from '@/constants'
import { db, saveRunCourse, type DBGameTaskUser, type DBRunCourse } from '@/db'
import { openApi } from '@/services/api'
import type { ActivityRecord, PlanEvent } from '@/types'
import PlanEditor from '@/components/PlanEditor.vue'
import ActivityReceiptDetail from '@/components/ActivityReceiptDetail.vue'
// @ts-ignore
import Mylikes from '@/utils/mylikes.js'

const { t, locale } = useLocale()
const { chartColorMode } = useChartColorMode()

const monthCursor = ref(dayjs().startOf('month'))
const selectedDay = ref(dayjs().format('YYYY-MM-DD'))
const syncing = ref(false)
const pushingPlans = ref(false)
const plans = ref<DBGameTaskUser[]>([])
const activities = ref<ActivityRecord[]>([])
const draggingPlanId = ref<number | null>(null)
const dragOverDay = ref<string | null>(null)
const dirty = ref(false)
const planDialogOpen = ref(false)
const selectedPlan = ref<PlanEvent | null>(null)
const receiptDialog = ref(false)
const receiptActivity = ref<ActivityRecord | null>(null)
const receiptFullscreen = ref(false)
const eventDetailExpandedKeys = ref<Set<string>>(new Set())
const eventNameVisibleKeys = ref<Set<string>>(new Set())
const planLibraryOpen = ref(false)
const planLibraryLoading = ref(false)
const planLibraryList = ref<DBRunCourse[]>([])
const syncDialogOpen = ref(false)
const syncOverwrite = ref(false)
const pushDialogOpen = ref(false)
const pushOverwrite = ref(false)
const pushResultDialogOpen = ref(false)
const pushResultSummary = ref<null | { total: number; inserted: number; parse_failed: number; insert_failed: number }>(null)
const runCourseEventDetailCache = new Map<number, { html: string; echart: { data: any[]; max: number } | null }>()
const collectSnackbar = ref(false)
type CopyBuffer = { type: 'event' | 'week' | 'month'; plans: PlanEvent[]; sourceStart?: string } | null
const copyBuffer = ref<CopyBuffer>(null)
const idSeed = ref(1)
const mylikesOption = { tPace: 330, heartMax: 190, heartMin: 60, ftp: 200, css: 120, tsp: 150 }
const planEventDetailCache = new Map<string, { html: string; echart: { data: any[]; max: number } | null }>()
const planTotalsCache = new Map<string, { timeSec: number; distanceKm: number; tss: number }>()
const draggingRunCourseId = ref<number | null>(null)

function invalidatePlanCaches() {
  planEventDetailCache.clear()
  planTotalsCache.clear()
}

const weekNames = computed(() =>
  locale.value === 'zh'
    ? ['一', '二', '三', '四', '五', '六', '日']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
)

const currentMonthLabel = computed(() =>
  locale.value === 'zh' ? monthCursor.value.format('YYYY 年 M 月') : monthCursor.value.format('MMMM YYYY')
)

const pushMonthRange = computed(() => {
  const start = monthCursor.value.startOf('month')
  const end = monthCursor.value.endOf('month')
  return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') }
})

const pushCandidates = computed(() =>
  plans.value.filter((p) => {
    const day = p.start || dayjs.unix(p.start_time || 0).format('YYYY-MM-DD')
    return day >= pushMonthRange.value.start && day <= pushMonthRange.value.end
  })
)

const pushCandidateCount = computed(() => pushCandidates.value.length)
const pushCandidateDates = computed(() => new Set(pushCandidates.value.map((p) => p.start || dayjs.unix(p.start_time || 0).format('YYYY-MM-DD'))).size)
const pushRangeText = computed(() => `${pushMonthRange.value.start} ~ ${pushMonthRange.value.end}`)
const pushResultState = computed<'success' | 'partial' | 'failed'>(() => {
  const r = pushResultSummary.value
  if (!r) return 'failed'
  if (r.inserted > 0 && r.parse_failed === 0 && r.insert_failed === 0) return 'success'
  if (r.inserted > 0) return 'partial'
  return 'failed'
})

const planMap = computed(() => {
  const m = new Map<string, DBGameTaskUser[]>()
  plans.value.forEach((p) => {
    const key = p.start || dayjs.unix(p.start_time || 0).format('YYYY-MM-DD')
    if (!m.has(key)) m.set(key, [])
    m.get(key)!.push(p)
  })
  return m
})

const activityMap = computed(() => {
  const m = new Map<string, ActivityRecord[]>()
  activities.value.forEach((a) => {
    const key = dayjs.unix(Number(a.sign_date) || 0).format('YYYY-MM-DD')
    if (!m.has(key)) m.set(key, [])
    m.get(key)!.push(a)
  })
  return m
})

const calendarDays = computed(() => {
  const start = monthCursor.value.startOf('month')
  const startOffset = (start.day() + 6) % 7
  const gridStart = start.subtract(startOffset, 'day')
  return Array.from({ length: 42 }).map((_, i) => {
    const d = gridStart.add(i, 'day')
    const key = d.format('YYYY-MM-DD')
    const items = planMap.value.get(key) ?? []
    const dayActivities = activityMap.value.get(key) ?? []
    return {
      key,
      day: d.date(),
      weekday: d.format('ddd'),
      monthLabel: d.format('MMM'),
      inMonth: d.month() === monthCursor.value.month(),
      isToday: key === dayjs().format('YYYY-MM-DD'),
      count: items.length,
      items,
      activities: dayActivities,
    }
  })
})

function percent(actual: number, plan: number): number {
  if (plan <= 0) return 0
  return Math.min(100, Math.round((actual / plan) * 100))
}

const weeklyRows = computed(() => {
  const rows: Array<{
    weekKey: string
    weekNumber: number
    days: typeof calendarDays.value
    planTime: string
    planDist: string
    planLoad: string
    actualTime: string
    actualDist: string
    actualLoad: string
    timePercent: number
    distPercent: number
    loadPercent: number
    hasPlanOrActual: boolean
  }> = []
  for (let i = 0; i < calendarDays.value.length; i += 7) {
    const days = calendarDays.value.slice(i, i + 7)
    const weekKey = days[0]?.key || `w-${i}`
    const weekNumber = Math.floor(i / 7) + 1
    const plansInWeek = days.flatMap((d) => d.items)
    let t = 0
    let km = 0
    let load = 0
    plansInWeek.forEach((p) => {
      const totals = getPlanTotals(p)
      t += totals.timeSec
      km += totals.distanceKm
      load += totals.tss
    })
    const activitiesInWeek = days.flatMap((d) => d.activities)
    const actualTime = activitiesInWeek.reduce((sum, a) => sum + (Number(a.run_time) || 0), 0)
    const actualDist = activitiesInWeek.reduce((sum, a) => sum + (Number(a.run_km) || 0), 0)
    const actualLoad = activitiesInWeek.reduce((sum, a) => sum + (Number(a.tss) || 0), 0)
    rows.push({
      weekKey,
      weekNumber,
      days,
      planTime: formatSec(t),
      planDist: `${km.toFixed(1)} km`,
      planLoad: `${Math.round(load)}`,
      actualTime: formatSec(actualTime),
      actualDist: `${actualDist.toFixed(1)} km`,
      actualLoad: `${Math.round(actualLoad)}`,
      timePercent: percent(actualTime, t),
      distPercent: percent(actualDist, km),
      loadPercent: percent(actualLoad, load),
      hasPlanOrActual: t > 0 || km > 0 || load > 0 || actualTime > 0 || actualDist > 0 || actualLoad > 0,
    })
  }
  return rows
})

async function loadLocalPlans() {
  invalidatePlanCaches()
  plans.value = (await db.game_task_user.toArray()).map((p) => ({ ...p }))
}

async function loadLocalActivities() {
  activities.value = (await db.activities.toArray()) as unknown as ActivityRecord[]
}

function formatSec(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

function nextId(): number {
  idSeed.value += 1
  return Date.now() + idSeed.value
}

function clonePlanToDay(p: PlanEvent, dayKey: string): DBGameTaskUser {
  const oldStart = dayjs(p.start || dayjs.unix(p.start_time || 0).format('YYYY-MM-DD'))
  const oldEnd = dayjs(p.end || dayjs.unix(p.end_time || 0).format('YYYY-MM-DD'))
  const spanDays = Math.max(0, oldEnd.diff(oldStart, 'day'))
  const start = dayKey
  const end = dayjs(dayKey).add(spanDays, 'day').format('YYYY-MM-DD')
  return {
    ...(p as DBGameTaskUser),
    id: nextId(),
    start,
    end,
    start_time: dayjs(start).startOf('day').unix(),
    end_time: dayjs(end).endOf('day').unix(),
    synced_at: Date.now(),
  }
}

function isReadOnlyPlan(plan: Pick<DBGameTaskUser, 'game_id'>): boolean {
  return Number(plan.game_id) !== 0
}

function dayEditableCount(dayKey: string): number {
  return (planMap.value.get(dayKey) || []).filter((p) => !isReadOnlyPlan(p)).length
}

function fromRunCourseToPlan(course: DBRunCourse, dayKey: string): DBGameTaskUser {
  const start = dayKey
  const end = dayKey
  return {
    id: nextId(),
    game_task_user_id: 0,
    game_id: 0,
    section_id: 0,
    task_id: 0,
    user_id: 0,
    title: course.title || t('calendar_untitled'),
    name: course.name || '',
    description: course.description || '',
    start,
    end,
    start_time: dayjs(start).startOf('day').unix(),
    end_time: dayjs(end).endOf('day').unix(),
    type: course.type || 'other',
    weight: course.weight || 'xuanxiu',
    sports: Number(course.sports) || 1,
    status: Number(course.status) || 1,
    content: course.content || '[]',
    task_content: course.content || '[]',
    synced_at: Date.now(),
  }
}

function getPlanDateKey(p: PlanEvent): string {
  return p.start || dayjs.unix(p.start_time || 0).format('YYYY-MM-DD')
}

function upsertLocalPlans(rows: DBGameTaskUser[]) {
  const map = new Map(plans.value.map((p) => [p.id, p]))
  rows.forEach((r) => map.set(r.id, r))
  plans.value = Array.from(map.values())
}

function getPlanTotals(plan: PlanEvent): { timeSec: number; distanceKm: number; tss: number } {
  const key = planKey(plan)
  const cached = planTotalsCache.get(key)
  if (cached) return cached
  const empty = { timeSec: 0, distanceKm: 0, tss: 0 }
  try {
    const raw = plan.content || plan.task_content || '[]'
    const contentData = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!contentData || (Array.isArray(contentData) && contentData.length === 0)) {
      planTotalsCache.set(key, empty)
      return empty
    }
    const mylikes = new (Mylikes as any)(mylikesOption)
    if (typeof mylikes.get_tss_dist_time !== 'function') {
      planTotalsCache.set(key, empty)
      return empty
    }
    const lap = mylikes.getVltContent(contentData)
    if (!lap) {
      planTotalsCache.set(key, empty)
      return empty
    }
    const lapData = mylikes.createTaskRunDataLap(lap)
    if (!lapData || !Array.isArray(lapData) || lapData.length === 0) {
      planTotalsCache.set(key, empty)
      return empty
    }
    const stat = mylikes.get_tss_dist_time(lapData)
    let timeSec = 0
    let distanceKm = 0
    let tss = 0
    if (stat && typeof stat === 'object') {
      timeSec = Number((stat as any).all_time) || Number((stat as any).time) || Number((stat as any).run_time) || 0
      distanceKm = Number((stat as any).all_dist) || Number((stat as any).distance) || Number((stat as any).run_km) || 0
      tss = ((stat as any).tss?.tss?.code && (stat as any).tss?.tss?.data?.tss != null)
        ? Number((stat as any).tss.tss.data.tss)
        : (Number((stat as any).all_tss) || Number((stat as any).tss) || 0)
    }
    if ((timeSec === 0 || distanceKm === 0) && typeof mylikes.getTaskEchart === 'function') {
      const echartRaw = mylikes.getTaskEchart(lapData)
      const echartList = Array.isArray(echartRaw) ? echartRaw : (echartRaw && Array.isArray((echartRaw as any).data) ? (echartRaw as any).data : [])
      let timeFromEchart = 0
      let distFromEchart = 0
      for (const item of echartList) {
        const row = item && typeof item === 'object' ? item : {}
        timeFromEchart += Number((row as any).time ?? (row as any)[0]) || 0
        distFromEchart += Number((row as any).km ?? (row as any).distance) || 0
      }
      if (timeSec === 0) timeSec = timeFromEchart
      if (distanceKm === 0) distanceKm = distFromEchart
    }
    const result = { timeSec, distanceKm, tss }
    planTotalsCache.set(key, result)
    return result
  } catch {
    planTotalsCache.set(key, empty)
    return empty
  }
}

function planKey(plan: PlanEvent): string {
  return `plan-${plan.id || plan.game_task_user_id || `${plan.start}-${plan.start_time || 0}`}`
}

function getPlanEventDetail(plan: PlanEvent): { html: string; echart: { data: any[]; max: number } | null } {
  const key = planKey(plan)
  const cached = planEventDetailCache.get(key)
  if (cached !== undefined) return cached
  const raw = plan.content || plan.task_content || '[]'
  const empty = { html: '', echart: null as { data: any[]; max: number } | null }
  try {
    const contentData = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!contentData || (Array.isArray(contentData) && contentData.length === 0)) {
      planEventDetailCache.set(key, empty)
      return empty
    }
    const mylikes = new (Mylikes as any)(mylikesOption)
    const lap = mylikes.getVltContent(contentData)
    if (!lap) {
      planEventDetailCache.set(key, empty)
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
    planEventDetailCache.set(key, result)
    return result
  } catch {
    planEventDetailCache.set(key, empty)
    return empty
  }
}

function eventNameVisible(key: string): boolean {
  return eventNameVisibleKeys.value.has(key)
}

function toggleNameVisible(key: string) {
  const next = new Set(eventNameVisibleKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  eventNameVisibleKeys.value = next
}

function eventDetailExpanded(key: string): boolean {
  return eventDetailExpandedKeys.value.has(key)
}

function toggleEventDetail(key: string) {
  const next = new Set(eventDetailExpandedKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  eventDetailExpandedKeys.value = next
}

function hasEventDetail(plan: PlanEvent): boolean {
  const desc = plan.description || plan.desc || ''
  if (String(desc).trim()) return true
  const detail = getPlanEventDetail(plan)
  return !!(detail.html || detail.echart)
}

function getRunCourseEventDetail(course: DBRunCourse): { html: string; echart: { data: any[]; max: number } | null } {
  const cached = runCourseEventDetailCache.get(course.id)
  if (cached !== undefined) return cached
  const raw = course.content || '[]'
  const empty = { html: '', echart: null as { data: any[]; max: number } | null }
  try {
    const contentData = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!contentData || (Array.isArray(contentData) && contentData.length === 0)) {
      runCourseEventDetailCache.set(course.id, empty)
      return empty
    }
    const mylikes = new (Mylikes as any)(mylikesOption)
    const lap = mylikes.getVltContent(contentData)
    if (!lap) {
      runCourseEventDetailCache.set(course.id, empty)
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
    runCourseEventDetailCache.set(course.id, result)
    return result
  } catch {
    runCourseEventDetailCache.set(course.id, empty)
    return empty
  }
}

function addPlanToDay(dayKey: string) {
  selectedDay.value = dayKey
  openCreatePlan()
}

async function copyDay(dayKey: string) {
  const first = (planMap.value.get(dayKey) || [])[0]
  if (!first) return
  copyBuffer.value = { type: 'event', plans: [{ ...(first as PlanEvent) }] }
}

async function pasteToDay(dayKey: string) {
  if (copyBuffer.value?.type !== 'event' || !copyBuffer.value.plans.length) return
  const rows = copyBuffer.value.plans.map((p) => clonePlanToDay(p, dayKey))
  upsertLocalPlans(rows)
  dirty.value = true
  invalidatePlanCaches()
}

async function deleteDay(dayKey: string) {
  const dayIds = new Set((planMap.value.get(dayKey) || []).filter((p) => !isReadOnlyPlan(p)).map((p) => p.id))
  if (dayIds.size === 0) return
  plans.value = plans.value.filter((p) => !dayIds.has(p.id))
  dirty.value = true
  invalidatePlanCaches()
}

async function copyWeek(weekKey: string) {
  const week = weeklyRows.value.find((w) => w.weekKey === weekKey)
  if (!week) return
  copyBuffer.value = {
    type: 'week',
    sourceStart: week.days[0]?.key,
    plans: week.days.flatMap((d) => d.items.map((p) => ({ ...(p as PlanEvent) }))),
  }
}

async function pasteWeek(weekKey: string) {
  if (copyBuffer.value?.type !== 'week' || !copyBuffer.value.plans.length) return
  const week = weeklyRows.value.find((w) => w.weekKey === weekKey)
  if (!week) return
  const weekStart = dayjs(week.days[0].key)
  const rows = copyBuffer.value.plans.map((p) => {
    const src = getPlanDateKey(p)
    const srcStart = dayjs(copyBuffer.value?.sourceStart || src)
    const offset = dayjs(src).diff(srcStart, 'day')
    const targetDay = weekStart.add(offset, 'day').format('YYYY-MM-DD')
    return clonePlanToDay(p, targetDay)
  })
  upsertLocalPlans(rows)
  dirty.value = true
  invalidatePlanCaches()
}

async function deleteWeek(weekKey: string) {
  const week = weeklyRows.value.find((w) => w.weekKey === weekKey)
  if (!week) return
  const ids = new Set(week.days.flatMap((d) => d.items.filter((p) => !isReadOnlyPlan(p)).map((p) => p.id)))
  plans.value = plans.value.filter((p) => !ids.has(p.id))
  dirty.value = true
  invalidatePlanCaches()
}

function getMonthRange() {
  const start = monthCursor.value.startOf('month')
  const end = monthCursor.value.endOf('month')
  return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') }
}

function inMonthRange(day: string, start: string, end: string): boolean {
  return day >= start && day <= end
}

function copyMonthPlans() {
  const { start, end } = getMonthRange()
  const copied = plans.value
    .filter((p) => inMonthRange(p.start || dayjs.unix(p.start_time || 0).format('YYYY-MM-DD'), start, end))
    .map((p) => ({ ...(p as PlanEvent) }))
  copyBuffer.value = { type: 'month', sourceStart: start, plans: copied }
}

async function pasteMonthPlans() {
  if (copyBuffer.value?.type !== 'month' || !copyBuffer.value.plans.length) return
  const targetStart = monthCursor.value.startOf('month').format('YYYY-MM-DD')
  const sourceStart = copyBuffer.value.sourceStart || targetStart
  const rows = copyBuffer.value.plans.map((p) => {
    const src = getPlanDateKey(p)
    const offset = dayjs(src).diff(dayjs(sourceStart), 'day')
    const targetDay = dayjs(targetStart).add(offset, 'day').format('YYYY-MM-DD')
    return clonePlanToDay(p, targetDay)
  })
  upsertLocalPlans(rows)
  dirty.value = true
  invalidatePlanCaches()
}

async function deleteMonthPlans() {
  const { start, end } = getMonthRange()
  const ids = new Set(plans.value
    .filter((p) => inMonthRange(p.start || dayjs.unix(p.start_time || 0).format('YYYY-MM-DD'), start, end) && !isReadOnlyPlan(p))
    .map((p) => p.id))
  plans.value = plans.value.filter((p) => !ids.has(p.id))
  dirty.value = true
  invalidatePlanCaches()
}

async function saveLocalChanges() {
  const now = Date.now()
  const rows = plans.value.map((p) => ({ ...p, synced_at: now }))
  await db.transaction('rw', db.game_task_user, async () => {
    await db.game_task_user.clear()
    await db.game_task_user.bulkPut(rows)
  })
  plans.value = rows
  dirty.value = false
  invalidatePlanCaches()
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

function renderPlanChartHtml(echart: { data: any[]; max: number } | null): string {
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

function shiftMonth(delta: number) {
  monthCursor.value = monthCursor.value.add(delta, 'month').startOf('month')
}

async function loadPlanLibrary() {
  planLibraryLoading.value = true
  try {
    planLibraryList.value = await db.runcourse.orderBy('updated_at').reverse().toArray()
    runCourseEventDetailCache.clear()
  } finally {
    planLibraryLoading.value = false
  }
}

async function togglePlanLibrary() {
  planLibraryOpen.value = !planLibraryOpen.value
  if (planLibraryOpen.value && !planLibraryList.value.length) {
    await loadPlanLibrary()
  }
}

function openSyncDialog() {
  syncOverwrite.value = false
  syncDialogOpen.value = true
}

function openPushDialog() {
  pushOverwrite.value = false
  pushDialogOpen.value = true
}

function exportMonthPlansExcel() {
  const weightLabel = (weight: string) => {
    const w = String(weight || '').toLowerCase()
    if (w === 'q1') return t('plan_weight_q1')
    if (w === 'q2') return t('plan_weight_q2')
    if (w === 'q3') return t('plan_weight_q3')
    if (w === 'xuanxiu') return t('plan_weight_xuanxiu')
    return String(weight || '')
  }
  const rows = [...pushCandidates.value]
    .sort((a, b) => {
      const da = String(a.start || dayjs.unix(a.start_time || 0).format('YYYY-MM-DD'))
      const dbs = String(b.start || dayjs.unix(b.start_time || 0).format('YYYY-MM-DD'))
      if (da === dbs) return Number(a.id) - Number(b.id)
      return da.localeCompare(dbs)
    })
    .map((p) => ({
      日期: String(p.start || dayjs.unix(p.start_time || 0).format('YYYY-MM-DD')),
      简称: String(p.title || ''),
      课表: String(p.name || ''),
      描述: String(p.description || ''),
      权重: weightLabel(String(p.weight || '')),
    }))
  if (!rows.length) return
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Plans')
  const filename = `calendar_plans_${monthCursor.value.format('YYYY-MM')}.xlsx`
  XLSX.writeFile(wb, filename)
}

async function confirmPushPlans() {
  if (!pushCandidates.value.length) return
  pushingPlans.value = true
  try {
    const payloadPlans = pushCandidates.value.map((p) => ({
      name: String(p.name || ''),
      title: String(p.title || t('calendar_untitled')).slice(0, 20),
      start: String(p.start || dayjs.unix(p.start_time || 0).format('YYYY-MM-DD')),
      weight: p.weight || 'xuanxiu',
      type: p.type || 'other',
      description: p.description || '',
      sports: Number(p.sports) || 1,
      // Push-to-self path: force unified game_id so overwrite match is stable.
      game_id: 0,
    }))
    const res = await openApi.pushPlans({
      plans: payloadPlans,
      game_id: 0,
      overwrite: Boolean(pushOverwrite.value),
    })
    pushResultSummary.value = {
      total: Number(res.total || 0),
      inserted: Number(res.inserted || 0),
      parse_failed: Number(res.parse_failed || 0),
      insert_failed: Number(res.insert_failed || 0),
    }
    pushDialogOpen.value = false
    pushResultDialogOpen.value = true
  } catch (err: any) {
    pushResultSummary.value = { total: 0, inserted: 0, parse_failed: 0, insert_failed: 1 }
    pushDialogOpen.value = false
    pushResultDialogOpen.value = true
  } finally {
    pushingPlans.value = false
  }
}

async function syncRemotePlans() {
  syncing.value = true
  try {
    const planRes = await openApi.getPlans({ start: monthCursor.value.startOf('month').format('YYYY-MM-DD') })
    if (syncOverwrite.value) {
      const now = Date.now()
      const rows = planRes.rows.map((r) => ({ ...r, id: Number(r.id), synced_at: now }))
      await db.transaction('rw', db.game_task_user, async () => {
        await db.game_task_user.clear()
        await db.game_task_user.bulkPut(rows as any)
      })
    } else {
      await db.game_task_user.bulkPut(planRes.rows.map((r) => ({ ...r, id: Number(r.id), synced_at: Date.now() })) as any)
    }
    await loadLocalPlans()
    dirty.value = false
    syncDialogOpen.value = false
  } finally {
    syncing.value = false
  }
}

function openCreatePlan() {
  selectedPlan.value = {
    id: 0,
    game_task_user_id: 0,
    game_id: 0,
    section_id: 0,
    task_id: 0,
    user_id: 0,
    title: '',
    name: '',
    description: '',
    desc: '',
    start: selectedDay.value,
    end: selectedDay.value,
    start_time: dayjs(selectedDay.value + ' 00:00:00').unix(),
    end_time: dayjs(selectedDay.value + ' 23:59:59').unix(),
    type: 'other',
    weight: 'xuanxiu',
    sports: 1,
    status: 1,
    content: '[]',
    task_content: '[]',
  }
  planDialogOpen.value = true
}

function openEditPlan(p: DBGameTaskUser) {
  if (isReadOnlyPlan(p)) return
  selectedPlan.value = {
    ...p,
    desc: p.description || '',
  }
  planDialogOpen.value = true
}

function closePlanEditor() {
  planDialogOpen.value = false
  selectedPlan.value = null
}

async function handlePlanSave(updated: PlanEvent) {
  const base = selectedPlan.value
  if (!base) return
  const isNew = !base.id
  const id = isNew ? Date.now() : base.id
  const start = base.start || selectedDay.value
  const end = base.end || start
  const startTs = dayjs(start + ' 00:00:00').unix()
  const endTs = dayjs(end + ' 23:59:59').unix()
  const prev = isNew ? null : plans.value.find((p) => p.id === id)
  const row: DBGameTaskUser = {
    id,
    game_task_user_id: prev?.game_task_user_id ?? 0,
    game_id: prev?.game_id ?? 0,
    section_id: prev?.section_id ?? 0,
    task_id: prev?.task_id ?? 0,
    user_id: prev?.user_id ?? 0,
    title: updated.title || '',
    name: updated.name || '',
    description: updated.description || '',
    start,
    end,
    start_time: startTs,
    end_time: endTs,
    type: updated.type || prev?.type || 'other',
    weight: updated.weight || prev?.weight || 'xuanxiu',
    sports: updated.sports ?? prev?.sports ?? 1,
    status: updated.status ?? prev?.status ?? 1,
    content: updated.content || prev?.content || '[]',
    task_content: updated.task_content || prev?.task_content || '[]',
    synced_at: Date.now(),
  }
  upsertLocalPlans([row])
  dirty.value = true
  invalidatePlanCaches()
  closePlanEditor()
}

async function removePlan(id: number) {
  const target = plans.value.find((p) => p.id === id)
  if (!target || isReadOnlyPlan(target)) return
  plans.value = plans.value.filter((p) => p.id !== id)
  dirty.value = true
  invalidatePlanCaches()
}

async function collectPlanToLibrary(plan: DBGameTaskUser) {
  await saveRunCourse({
    title: String(plan.title || t('calendar_untitled')),
    name: String(plan.name || ''),
    description: String(plan.description || ''),
    content: String(plan.content || plan.task_content || '[]'),
    type: String(plan.type || 'other'),
    weight: String(plan.weight || 'xuanxiu'),
    sports: Number(plan.sports) || 1,
    status: Number(plan.status) || 1,
  })
  if (planLibraryOpen.value) {
    await loadPlanLibrary()
  }
  collectSnackbar.value = true
}

function runTypeLabel(type: number): string {
  const k = 'run_type_' + (type ?? 254)
  const v = t(k)
  return v !== k ? v : t('run_type_unknown')
}

function getActivityColor(activity: ActivityRecord): string {
  return RUN_TYPE_COLORS[activity.run_type ?? 1] || RUN_TYPE_COLORS[1]
}

function formatActivityTime(activity: ActivityRecord): string {
  return formatDurationHMS(activity.run_time ?? 0)
}

function activityPaceOrSpeed(activity: ActivityRecord): string {
  const rt = activity.run_type ?? 1
  const runTime = activity.run_time ?? 0
  const runKm = activity.run_km ?? 0
  if (rt === 1) {
    if (activity.run_pace != null && activity.run_pace > 0) return `${t('calendar_pace_label')} ${formatPace(activity.run_pace)}/km`
    return ''
  }
  if (rt === 2) {
    if (runTime > 0 && runKm > 0) return `${t('calendar_speed_label')} ${(runKm * 3600 / runTime).toFixed(1)} km/h`
    return ''
  }
  if (rt === 5) {
    if (runTime > 0 && runKm > 0) {
      const secPer100m = runTime / (runKm * 10)
      return `${t('calendar_pace_label')} ${formatPace(secPer100m)}/100m`
    }
    return ''
  }
  return ''
}

function openReceipt(item: ActivityRecord) {
  receiptActivity.value = item
  receiptDialog.value = true
  receiptFullscreen.value = false
}

function closeReceipt() {
  receiptDialog.value = false
  receiptActivity.value = null
}

function onDragStart(id: number) {
  const plan = plans.value.find((p) => p.id === id)
  if (!plan || isReadOnlyPlan(plan)) return
  draggingRunCourseId.value = null
  draggingPlanId.value = id
}

function onRunCourseDragStart(e: DragEvent, id: number) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.dropEffect = 'copy'
  }
  draggingPlanId.value = null
  draggingRunCourseId.value = id
  const onDragEnd = () => {
    document.removeEventListener('dragend', onDragEnd)
    draggingRunCourseId.value = null
    dragOverDay.value = null
  }
  document.addEventListener('dragend', onDragEnd)
}

function onDragEnterDay(dayKey: string) {
  if (!draggingPlanId.value && !draggingRunCourseId.value) return
  dragOverDay.value = dayKey
}

function onDragLeaveDay(dayKey: string) {
  if (dragOverDay.value === dayKey) dragOverDay.value = null
}

async function onDropDay(dayKey: string) {
  if (draggingRunCourseId.value) {
    const course = planLibraryList.value.find((c) => c.id === draggingRunCourseId.value)
    draggingRunCourseId.value = null
    dragOverDay.value = null
    if (!course) return
    upsertLocalPlans([fromRunCourseToPlan(course, dayKey)])
    dirty.value = true
    invalidatePlanCaches()
    selectedDay.value = dayKey
    return
  }
  if (!draggingPlanId.value) return
  const id = draggingPlanId.value
  draggingPlanId.value = null
  dragOverDay.value = null
  const plan = plans.value.find((p) => p.id === id)
  if (!plan) return
  if (isReadOnlyPlan(plan)) return
  const oldStart = dayjs(plan.start || dayjs.unix(plan.start_time || 0).format('YYYY-MM-DD'))
  const oldEnd = dayjs(plan.end || dayjs.unix(plan.end_time || 0).format('YYYY-MM-DD'))
  const spanDays = Math.max(0, oldEnd.diff(oldStart, 'day'))
  const newStart = dayjs(dayKey)
  const newEnd = newStart.add(spanDays, 'day')
  upsertLocalPlans([{
    ...plan,
    start: newStart.format('YYYY-MM-DD'),
    end: newEnd.format('YYYY-MM-DD'),
    start_time: newStart.startOf('day').unix(),
    end_time: newEnd.endOf('day').unix(),
    synced_at: Date.now(),
  }])
  dirty.value = true
  invalidatePlanCaches()
  selectedDay.value = dayKey
}

onMounted(async () => {
  await loadLocalPlans()
  await loadLocalActivities()
  await loadPlanLibrary()
  dirty.value = false
})
</script>

<style scoped>
.calendar-page {
  max-width: 100%;
  height: calc(100vh - 74px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.calendar-header { padding: 0 4px; }
.plan-library-trigger { margin-left: 0; }
.month-title { min-width: 140px; text-align: center; }
.push-meta { display: flex; flex-direction: column; gap: 6px; }
.push-meta .label { color: rgba(var(--v-theme-on-surface), 0.65); }
.push-result-card { border-radius: 16px; }
.push-result-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.push-result-title {
  font-size: 20px;
  font-weight: 700;
}
.push-result-hero.state-success .push-result-title { color: rgb(var(--v-theme-success)); }
.push-result-hero.state-partial .push-result-title { color: rgb(var(--v-theme-warning)); }
.push-result-hero.state-failed .push-result-title { color: rgb(var(--v-theme-error)); }
.checkmark { width: 64px; height: 64px; display: block; }
.checkmark-circle {
  stroke: rgb(var(--v-theme-success));
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: stroke-circle .45s ease-in-out forwards;
}
.checkmark-check {
  stroke: rgb(var(--v-theme-success));
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke-check .35s .35s ease-out forwards;
}
@keyframes stroke-circle { to { stroke-dashoffset: 0; } }
@keyframes stroke-check { to { stroke-dashoffset: 0; } }
.push-result-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.push-result-stats > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-border-color), 0.2);
  border-radius: 10px;
  background: rgba(var(--v-theme-surface), 0.65);
}
.calendar-card {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  box-shadow: none !important;
  border-radius: 8px;
  flex: 1;
  min-height: 0;
}
.calendar-card :deep(.v-card-text) {
  height: 100%;
  overflow: hidden;
}
.calendar-main-wrap {
  display: flex;
  min-height: 0;
  height: 100%;
}
.calendar-plan-library {
  width: calc((100% - 160px) / 8);
  min-width: 0;
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-background));
  display: flex;
  flex-direction: column;
}
.plan-library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  padding: 0 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.plan-library-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.plan-library-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  scrollbar-gutter: stable;
}
.plan-library-card {
  margin-bottom: 8px;
  cursor: grab;
}
.plan-library-card:active {
  cursor: grabbing;
}
.calendar-grid-wrap {
  overflow: auto;
  flex: 1;
  min-height: 0;
}
.weekday-row {
  display: grid;
  grid-template-columns: 160px repeat(7, minmax(140px, 1fr));
  min-width: 1140px;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-background));
}
.weekday-cell.week-col {
  text-align: left;
  padding-left: 12px;
}
.grid-week-row {
  display: grid;
  grid-template-columns: 160px repeat(7, minmax(140px, 1fr));
  min-width: 1140px;
}
.weekday-cell {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
  padding: 10px 6px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.weekday-cell:last-child { border-right: none; }
.grid-wrap {
  display: grid;
  grid-template-columns: repeat(7, minmax(140px, 1fr));
  min-width: 980px;
  gap: 0;
}
.week-summary-cell {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-background));
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.week-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.week-label { font-size: 13px; font-weight: 600; color: rgba(var(--v-theme-on-surface)); }
.week-actions { display: flex; align-items: center; gap: 0; }
.week-actions .v-btn { min-width: 26px; }
.week-stats { display: flex; flex-direction: column; gap: 6px; }
.stat-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.stat-label { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.6); }
.stat-value { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.9); }
.week-progress { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
.progress-item { display: flex; flex-direction: column; gap: 3px; }
.progress-head { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.7); }
.progress-caption { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.6); }
.day-cell {
  position: relative;
  min-height: 140px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0;
  padding: 8px;
  cursor: pointer;
  background: rgba(var(--v-theme-background));
}
.batch-cell-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  z-index: 4;
  background: rgba(var(--v-theme-surface), 0.86);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 1px;
}
.day-cell:hover .batch-cell-actions {
  opacity: 1;
  pointer-events: auto;
}
.day-outside { opacity: 0.45; }
.day-today { border-color: rgba(var(--v-theme-primary), 0.55); }
.day-selected { outline: 2px solid rgba(var(--v-theme-primary), 0.3); }
.day-drop-target {
  border-color: rgba(var(--v-theme-primary), 0.8);
  background: rgba(var(--v-theme-primary), 0.12);
}
.cell-header {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 8px;
}
.cell-day { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.6); }
.cell-date { font-size: 16px; font-weight: 700; line-height: 1; color: rgba(var(--v-theme-on-surface), 0.9); }
.cell-month { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.55); }
.day-list { display: flex; flex-direction: column; gap: 4px; }
.batch-event {
  position: relative;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 8px;
  padding: 6px 8px;
  background: rgba(var(--v-theme-surface), 1);
  overflow: hidden;
}
.batch-event:hover { border-color: rgba(var(--v-theme-primary), 0.35); }
.plan-card-readonly {
  cursor: default;
  border-style: dashed;
}
.plan-card-actions {
  position: absolute;
  top: 2px;
  right: 2px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
}
.batch-event:hover .plan-card-actions { opacity: 1; }
.readonly-badge {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1;
  color: rgba(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.14);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}
.batch-event-title {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.batch-event-code {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.65);
  cursor: pointer;
}
.batch-event-code-toggle {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .4px;
}
.batch-event-code-text { display: inline; word-break: break-all; }
.batch-event-toggle-wrapper { margin-top: 2px; }
.batch-event-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  cursor: pointer;
}
.batch-event-detail.collapsed {
  margin-top: 0;
  max-height: 0;
  overflow: hidden;
}
.batch-event-detail { margin-top: 4px; font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.6); white-space: normal; word-break: break-word; }
.batch-event-detail-inner { margin-bottom: 6px; }
.event-detail-markdown { font-size: 11px; line-height: 1.5; color: rgba(var(--v-theme-on-surface), 0.85); }
.event-detail-markdown :deep(.section.section-md) { margin: 0.25em 0; }
.event-detail-markdown :deep(.section-title-md) { font-weight: 600; margin: 0.2em 0 0.15em; font-size: 1em; }
.event-detail-markdown :deep(.task-group-md) { margin: 0.35em 0; }
.event-detail-markdown :deep(.group-count-md) { font-weight: 600; display: inline-block; margin-bottom: 0.15em; }
.event-detail-markdown :deep(.group-content-md) { padding-left: 1.2em; margin: 0.15em 0 0.25em; border-left: 2px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.event-detail-markdown :deep(.group-content-md .lap-item-md) { margin: 0.2em 0; color: rgba(var(--v-theme-on-surface), 0.65); font-size: 0.95em; }
.event-detail-markdown :deep(.lap-item-md) { display: block; }
.event-detail-markdown :deep(.lap-duration-md),
.event-detail-markdown :deep(.lap-name-md),
.event-detail-markdown :deep(.lap-intensity-md) { margin-right: 0.35em; }
.event-detail-markdown :deep(.task-item-md) { margin: 0.2em 0; color: rgba(var(--v-theme-on-surface), 0.6); }
.event-detail-markdown :deep(.section.section-md > .task-item-md) { font-weight: 600; }
.batch-event-chart { min-height: 42px; margin-top: 4px; }
.batch-event-chart :deep(.batch-chart-container) { display: flex; align-items: flex-end; height: 42px; width: 100%; gap: 2px; }
.batch-event-chart :deep(.batch-chart-bar) { min-width: 4px; }
.batch-event-chart :deep(.batch-chart-bar-top) {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 4px 4px 0 0;
}
.batch-chart-wrapper { min-height: 48px; margin-top: 6px; }
.batch-chart-wrapper :deep(.batch-chart-container) { display: flex; align-items: flex-end; height: 48px; width: 100%; gap: 2px; }
.batch-chart-wrapper :deep(.batch-chart-bar) { min-width: 4px; }
.activity-card {
  border: 1px solid rgba(var(--v-border-color), 0.14);
  border-left: 3px solid;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 1);
  padding: 6px 8px;
}
.activity-card:hover { border-color: rgba(var(--v-theme-primary), 0.35); }
.activity-summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 11px; }
.activity-time { color: rgba(var(--v-theme-on-surface), 0.72); }
.activity-distance { color: rgba(var(--v-theme-primary)); font-weight: 600; }
.activity-type { margin-top: 2px; font-size: 12px; font-weight: 600; }
.activity-stats { margin-top: 2px; display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.72); }
.activity-load { margin-top: 2px; font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.66); }
.receipt-dialog-card {
  display: flex;
  flex-direction: column;
  max-height: 100%;
}
.receipt-dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}
</style>
