<template>
  <div class="activities">
    <div class="d-flex align-center justify-end flex-wrap gap-2 mb-4">
      <v-btn variant="outlined" prepend-icon="mdi-filter" @click="filterDialog = true">{{ t('act_filter') }}</v-btn>
      <v-btn
        :color="syncBtnColor"
        variant="tonal"
        :prepend-icon="syncBtnIcon"
        :loading="syncBtnLoading"
        :disabled="syncBtnLoading"
        @click="openSyncDialog"
      >{{ syncBtnText }}</v-btn>
      <v-menu :close-on-content-click="true">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            variant="outlined"
            prepend-icon="mdi-download"
            :disabled="activities.length === 0"
            append-icon="mdi-chevron-down"
          >
            {{ t('act_export') }}{{ selected.length > 0 ? ` (${selected.length})` : '' }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item-subtitle class="px-3 pt-2 text-caption text-medium-emphasis">{{ t('act_export_choose') }}</v-list-item-subtitle>
          <v-list-item prepend-icon="mdi-file-excel-outline" :title="t('act_export_format_excel')" @click="handleExportFormat('excel')" />
          <v-list-item prepend-icon="mdi-code-json" :title="t('act_export_format_json')" @click="handleExportFormat('json')" />
          <v-list-item prepend-icon="mdi-language-markdown-outline" :title="t('act_export_format_md')" @click="handleExportFormat('md')" />
        </v-list>
      </v-menu>
    </div>
    <v-alert
      v-if="hasDateFilter && localTotalCount > total"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <span>{{ t('act_filtering_hint') }} {{ total }} / {{ localTotalCount }}</span>
        <v-btn size="x-small" variant="text" color="primary" @click="showAllFromLocal">
          {{ t('act_show_all') }}
        </v-btn>
      </div>
    </v-alert>

    <v-card class="activities-table-card">
      <v-overlay
        :model-value="loading"
        contained
        class="align-center justify-center"
        scrim="rgba(255,255,255,0.8)"
      >
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="mt-3 text-body2">{{ t('act_loading') }}</p>
      </v-overlay>
      <v-data-table-server
        v-model="selected"
        v-model:page="page"
        v-model:items-per-page="limit"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="activities"
        :items-length="total"
        :loading="loading"
        item-value="id"
        density="comfortable"
        class="elevation-0"
        hide-default-footer
        show-select
        select-strategy="page"
        @update:options="onTableOptionsUpdate"
      >
        <template #no-data>
          <div class="text-center py-12">
            <v-icon size="64" color="grey-lighten-1">mdi-format-list-bulleted</v-icon>
            <p class="mt-2 text-body1">{{ t('act_no_data') }}</p>
            <p class="text-caption text-medium-emphasis">{{ t('act_no_data_hint') }}</p>
          </div>
        </template>
        <template #item.sign_date="{ item }">
          <span v-if="item.sign_date == null">--</span>
          <template v-else>
            <div>{{ formatTime(item.sign_date, 'YYYY-MM-DD') }}</div>
            <div class="text-caption text-medium-emphasis">{{ formatTime(item.sign_date, 'HH:mm') }}</div>
          </template>
        </template>
        <template #item.run_type="{ item }">
          <v-chip
            size="small"
            :color="RUN_TYPE_COLORS[item.run_type ?? 1] ?? 'primary'"
            variant="tonal"
            class="d-inline-flex align-center"
          >
            <v-icon size="14" class="me-1">{{ getRunTypeIcon(item.run_type) }}</v-icon>
            {{ runTypeLabel(item.run_type ?? 0) }}
          </v-chip>
        </template>
        <template #item.run_km="{ item }">
          <span
            class="font-weight-bold text-primary receipt-distance-link"
            @click="openReceipt(item)"
          >{{ formatDistance(item.run_km) }}</span>
        </template>
        <template #item.run_time="{ item }">{{ formatDuration(item.run_time) }}</template>
        <template #item.run_pace="{ item }">
          {{ item.run_pace != null && item.run_pace > 0 ? formatPace(item.run_pace) : '--' }}
        </template>
        <template #item.avg_heart="{ item }">
          <span v-if="item.avg_heart != null && item.avg_heart > 0" class="text-secondary">{{ item.avg_heart }} bpm</span>
          <span v-else>--</span>
        </template>
        <template #item.tss="{ item }">
          {{ item.tss != null && item.tss > 0 ? item.tss : '--' }}
        </template>
        <template #item.run_force="{ item }">
          <v-chip v-if="item.run_force != null && item.run_force > 0" size="small" color="orange" variant="tonal">
            {{ formatRunForce(item.run_force) }}
          </v-chip>
          <span v-else>--</span>
        </template>
        <template #item.overlap="{ item }">
          <v-chip v-if="item.overlap" size="small" color="warning" variant="tonal">{{ t('act_yes') }}</v-chip>
          <span v-else class="text-medium-emphasis">{{ t('act_no') }}</span>
        </template>
        <template #item.related_type="{ item }">
          <span class="text-caption">{{ relatedTypeLabel(item.related_type) }}</span>
        </template>
        <template #item.total_ascent="{ item }">
          {{ formatOptionalInt(item.total_ascent, 'm') }}
        </template>
        <template #item.avg_cadence="{ item }">
          {{ formatCadenceSpm(item.avg_cadence) }}
        </template>
        <template #item.avg_stride="{ item }">
          {{ formatStride(item.avg_stride) }}
        </template>
        <template #item.avg_contact="{ item }">
          {{ formatOptionalInt(item.avg_contact, 'ms') }}
        </template>
        <template #item.avg_fly="{ item }">
          {{ formatOptionalInt(item.avg_fly, 'ms') }}
        </template>
        <template #item.avg_vertical="{ item }">
          {{ formatVerticalOscillation(item.avg_vertical) }}
        </template>
        <template #item.avg_vertical_ratio="{ item }">
          {{ formatOptionalFloat(item.avg_vertical_ratio, '%', 1) }}
        </template>
        <template #item.avg_power="{ item }">
          {{ formatOptionalInt(item.avg_power, 'W') }}
        </template>
        <template #item.temperature="{ item }">
          {{ formatOptionalInt(item.temperature, '°C') }}
        </template>
      </v-data-table-server>

      <v-divider />
      <div class="d-flex align-center pa-3 flex-wrap gap-2">
        <v-select
          v-model="limit"
          :items="PAGINATION_CONFIG.PAGE_SIZE_OPTIONS"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 100px;"
          @update:model-value="page = 1; fetchActivities()"
        />
        <v-spacer />
        <v-pagination
          v-model="page"
          :total-visible="7"
          :length="Math.ceil(total / limit) || 1"
          @update:model-value="fetchActivities()"
        />
      </div>
    </v-card>

    <!-- Activity Receipt Dialog -->
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
      v-model="syncDoneToastOpen"
      :timeout="2200"
      color="success"
      location="bottom"
    >
      {{ syncDoneToastText }}
    </v-snackbar>

    <!-- Sync Confirm Dialog -->
    <v-dialog v-model="syncDialog" max-width="520" persistent>
      <v-card>
        <v-card-title>{{ t('act_sync_confirm_title') }}</v-card-title>
        <v-card-text class="pb-0">
          <p class="text-body2 mb-2">{{ t('act_sync_confirm_desc') }}</p>
          <p class="text-caption text-medium-emphasis mb-3">{{ t('act_sync_skip_dup_hint') }}</p>
          <div class="d-flex flex-wrap gap-1 mb-2">
            <v-btn size="small" variant="tonal" @click="setSyncDateRange('today')">{{ t('act_today') }}</v-btn>
            <v-btn size="small" variant="tonal" @click="setSyncDateRange('7d')">{{ t('act_7d') }}</v-btn>
            <v-btn size="small" variant="tonal" @click="setSyncDateRange('30d')">{{ t('act_30d') }}</v-btn>
          </div>
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="syncForm.start_date" :label="t('act_start_date')" type="date" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="syncForm.end_date" :label="t('act_end_date')" type="date" variant="outlined" density="compact" hide-details />
            </v-col>
          </v-row>
          <p v-if="syncRangeError" class="text-caption text-error mt-2 mb-0">{{ syncRangeError }}</p>
          <p v-else-if="syncRuntimeError" class="text-caption text-error mt-2 mb-0">{{ syncRuntimeError }}</p>
          <p v-else-if="syncRangeDays > 0" class="text-caption text-medium-emphasis mt-2 mb-0">
            {{ t('act_sync_range_days') }}: {{ syncRangeDays }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="syncDialog = false">{{ t('settings_cancel') }}</v-btn>
          <v-btn color="primary" :loading="syncBtnLoading" :disabled="Boolean(syncRangeError)" @click="confirmSync">
            {{ t('act_sync') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Filter Dialog -->
    <v-dialog v-model="filterDialog" max-width="520" persistent scrollable>
      <v-card>
        <v-card-title>{{ t('act_filter_title') }}</v-card-title>
        <v-card-text class="pb-0">
          <v-form>
            <div class="text-caption text-medium-emphasis mb-1">{{ t('act_time_range') }}</div>
            <v-row dense>
              <v-col cols="12" class="d-flex flex-wrap gap-1">
                <v-btn size="small" variant="tonal" @click="setDateRange('today')">{{ t('act_today') }}</v-btn>
                <v-btn size="small" variant="tonal" @click="setDateRange('7d')">{{ t('act_7d') }}</v-btn>
                <v-btn size="small" variant="tonal" @click="setDateRange('30d')">{{ t('act_30d') }}</v-btn>
                <v-btn size="small" variant="tonal" @click="setDateRange('month')">{{ t('act_month') }}</v-btn>
                <v-btn size="small" variant="tonal" @click="setDateRange('clear')">{{ t('act_clear') }}</v-btn>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="filterForm.start_date" :label="t('act_start_date')" type="date" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="filterForm.end_date" :label="t('act_end_date')" type="date" variant="outlined" density="compact" hide-details />
              </v-col>
            </v-row>
            <div class="text-caption text-medium-emphasis mt-3 mb-1">{{ t('act_sport_source') }}</div>
            <v-row dense>
              <v-col cols="6">
                <v-select
                  v-model="filterForm.run_type"
                  :items="runTypeItems"
                  item-title="label"
                  item-value="value"
                  :label="t('act_run_type')"
                  clearable
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="filterForm.related_type"
                  :items="relatedTypeItems"
                  item-title="label"
                  item-value="value"
                  :label="t('act_data_source')"
                  clearable
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
            <div class="text-caption text-medium-emphasis mt-3 mb-1">{{ t('act_dist_duration_ascent') }}</div>
            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model.number="filterForm.min_distance" :label="t('act_min_dist')" type="number" suffix="km" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="filterForm.max_distance" :label="t('act_max_dist')" type="number" suffix="km" variant="outlined" density="compact" hide-details />
              </v-col>
            </v-row>
            <v-row dense class="mt-1">
              <v-col cols="6">
                <v-text-field v-model.number="filterForm.min_total_ascent" :label="t('act_min_ascent')" type="number" placeholder="m" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="filterForm.max_total_ascent" :label="t('act_max_ascent')" type="number" placeholder="m" variant="outlined" density="compact" hide-details />
              </v-col>
            </v-row>
            <div class="text-caption text-medium-emphasis mt-3 mb-1">{{ t('act_temp_hr_load') }}</div>
            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model.number="filterForm.min_avg_heart" :label="t('act_min_hr')" type="number" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="filterForm.max_avg_heart" :label="t('act_max_hr')" type="number" variant="outlined" density="compact" hide-details />
              </v-col>
            </v-row>
            <div class="text-caption text-medium-emphasis mt-3 mb-1">{{ t('act_sort') }}</div>
            <v-row dense>
              <v-col cols="6">
                <v-select
                  v-model="filterForm.order_by"
                  :items="orderByItems"
                  item-title="label"
                  item-value="value"
                  :label="t('act_order_by')"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="filterForm.order"
                  :items="[{ label: t('act_desc'), value: 'desc' }, { label: t('act_asc'), value: 'asc' }]"
                  item-title="label"
                  item-value="value"
                  :label="t('act_order_dir')"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="handleReset">{{ t('act_reset') }}</v-btn>
          <v-btn variant="text" @click="filterDialog = false">{{ t('settings_cancel') }}</v-btn>
          <v-btn color="primary" @click="handleFilter">{{ t('act_apply') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { db } from '@/db'
import { syncState, initSync, syncActivitiesInRange } from '@/db/sync'
import { RUN_TYPE_MAP, RUN_TYPE_COLORS, PAGINATION_CONFIG } from '@/constants'
import { formatTime, formatDuration, formatDurationHMS, formatDistance, formatPace, getRunTypeIcon, getRelatedTypeName, downloadJSON, downloadText } from '@/utils'
import { resolveApiErrorMessage } from '@/utils/apiError'
import * as XLSX from 'xlsx'
import { useLocale } from '@/composables/useLocale'
import type { ActivityRecord } from '@/types'
import ActivityReceiptDetail from '@/components/ActivityReceiptDetail.vue'

const { t } = useLocale()

// ─── DB-backed state ─────────────────────────────────────────────────────────
const loading = ref(false)
// All records from DB (loaded once, filtered/sorted/paginated in memory)
const allActivities = ref<ActivityRecord[]>([])
const activities = ref<ActivityRecord[]>([])
const total = ref(0)
const localTotalCount = ref(0)

const receiptDialog = ref(false)
const receiptActivity = ref<ActivityRecord | null>(null)
const receiptFullscreen = ref(false)

function openReceipt(item: ActivityRecord) {
  receiptActivity.value = item
  receiptDialog.value = true
  receiptFullscreen.value = false
}
function closeReceipt() {
  receiptDialog.value = false
  receiptActivity.value = null
}

const page = ref(1)
const limit = ref(PAGINATION_CONFIG.DEFAULT_LIMIT)
const orderBy = ref('sign_date')
const order = ref<'asc' | 'desc'>('desc')
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'sign_date', order: 'desc' }])
const ALLOWED_ORDER_KEYS = ['sign_date', 'created_time', 'run_km', 'run_time', 'run_pace', 'avg_heart', 'tss', 'run_force', 'total_ascent']
const filterDialog = ref(false)
const syncDialog = ref(false)
const syncRuntimeError = ref('')
const syncDoneToastOpen = ref(false)
const syncDoneToastText = ref('')
const syncForm = reactive<{ start_date: string; end_date: string }>({
  start_date: '',
  end_date: '',
})
const filterForm = reactive<{
  start_date?: string
  end_date?: string
  run_type?: number
  related_type?: string
  min_distance?: number
  max_distance?: number
  min_total_ascent?: number
  max_total_ascent?: number
  min_avg_heart?: number
  max_avg_heart?: number
  order_by?: string
  order?: 'asc' | 'desc'
}>({ order_by: 'sign_date', order: 'desc' })

function setDateRange(preset: 'today' | '7d' | '30d' | 'month' | 'clear') {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  if (preset === 'clear') {
    filterForm.start_date = undefined
    filterForm.end_date = undefined
    return
  }
  if (preset === 'today') {
    filterForm.start_date = today
    filterForm.end_date = today
    return
  }
  const start = new Date(now)
  if (preset === '7d') start.setDate(start.getDate() - 6)
  else if (preset === '30d') start.setDate(start.getDate() - 30)
  else if (preset === 'month') start.setDate(1)
  filterForm.start_date = start.toISOString().slice(0, 10)
  filterForm.end_date = today
}

function setSyncDateRange(preset: 'today' | '7d' | '30d') {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  if (preset === 'today') {
    syncForm.start_date = today
    syncForm.end_date = today
    return
  }
  const start = new Date(now)
  if (preset === '7d') start.setDate(start.getDate() - 6)
  else start.setDate(start.getDate() - 30)
  syncForm.start_date = start.toISOString().slice(0, 10)
  syncForm.end_date = today
}

const orderByItems = computed(() => [
  { label: t('act_table_date'), value: 'sign_date' },
  { label: t('act_table_distance'), value: 'run_km' },
  { label: t('act_table_duration'), value: 'run_time' },
  { label: t('act_table_pace'), value: 'run_pace' },
  { label: t('act_table_hr'), value: 'avg_heart' },
  { label: t('act_table_tss'), value: 'tss' },
  { label: t('act_table_run_force'), value: 'run_force' },
])

const relatedTypeItems = computed(() => [
  { label: t('act_source_garmin_cn'), value: 'GarminCnFeed' },
  { label: t('act_source_garmin'), value: 'GarminFeed' },
  { label: t('act_source_huawei'), value: 'HuaweiFeed' },
  { label: t('act_source_coros'), value: 'CorosFeed' },
  { label: t('act_source_apple'), value: 'AppleFeed' },
  { label: t('act_source_strava'), value: 'StravaFeed' },
  { label: t('act_source_likes'), value: 'LikesApp' },
  { label: t('act_source_manual'), value: 'WxApp' },
  { label: t('act_source_codoon'), value: 'CodoonRoute' },
  { label: t('act_source_other'), value: '__other__' },
])

const selected = ref<number[]>([])

const headers = computed(() => [
  { title: t('act_table_date'), key: 'sign_date', width: '112px', sortable: true },
  { title: t('act_table_overlap'), key: 'overlap', width: '56px' },
  { title: t('act_table_run_type'), key: 'run_type', width: '88px' },
  { title: t('act_table_source'), key: 'related_type', width: '100px' },
  { title: t('act_table_distance'), key: 'run_km', width: '88px', sortable: true },
  { title: t('act_table_duration'), key: 'run_time', width: '88px', sortable: true },
  { title: t('act_table_pace'), key: 'run_pace', width: '80px', sortable: true },
  { title: t('act_table_hr'), key: 'avg_heart', width: '72px', sortable: true },
  { title: t('act_table_ascent'), key: 'total_ascent', width: '72px', sortable: true },
  { title: t('act_table_tss'), key: 'tss', width: '64px', sortable: true },
  { title: t('act_table_run_force'), key: 'run_force', width: '64px', sortable: true },
  { title: t('act_table_cadence'), key: 'avg_cadence', width: '72px' },
  { title: t('act_table_stride'), key: 'avg_stride', width: '72px' },
  { title: t('act_table_contact'), key: 'avg_contact', width: '72px' },
  { title: t('act_table_fly'), key: 'avg_fly', width: '72px' },
  { title: t('act_table_vertical'), key: 'avg_vertical', width: '80px' },
  { title: t('act_table_vertical_ratio'), key: 'avg_vertical_ratio', width: '76px' },
  { title: t('act_table_power'), key: 'avg_power', width: '72px' },
  { title: t('act_table_temp'), key: 'temperature', width: '72px' },
])

const runTypeItems = computed(() =>
  Object.keys(RUN_TYPE_MAP).map((value) => ({ label: runTypeLabel(Number(value)), value: Number(value) }))
)

function runTypeLabel(type: number): string {
  const k = 'run_type_' + (type ?? 254)
  const v = t(k)
  return v !== k ? v : t('run_type_unknown')
}

function relatedTypeLabel(relatedType: string | undefined | null): string {
  if (relatedType == null || String(relatedType).trim() === '') return '--'
  const k = 'related_type_' + relatedType
  const v = t(k)
  return v !== k ? v : getRelatedTypeName(relatedType)
}

function formatOptionalInt(val: number | null | undefined, unit: string): string {
  if (val == null || (typeof val === 'number' && isNaN(val))) return '--'
  const n = Number(val)
  if (n === 0 && unit !== 'm') return '--'
  return unit ? `${n} ${unit}` : String(n)
}

function formatOptionalFloat(val: number | null | undefined, unit: string, fixed = 1): string {
  if (val == null || (typeof val === 'number' && isNaN(val))) return '--'
  const n = Number(val)
  return unit ? `${n.toFixed(fixed)}${unit}` : n.toFixed(fixed)
}

function formatStride(val: number | null | undefined): string {
  if (val == null || (typeof val === 'number' && isNaN(val))) return '--'
  const n = Number(val)
  if (n >= 1000) return `${(n / 1000).toFixed(1)} m`
  if (n > 0) return `${n} cm`
  return '--'
}

function formatRunForce(val: number | null | undefined): string {
  if (val == null || (typeof val === 'number' && isNaN(val)) || val <= 0) return '--'
  return (Number(val) / 10).toFixed(1)
}

function formatCadenceSpm(val: number | null | undefined): string {
  if (val == null || (typeof val === 'number' && isNaN(val))) return '--'
  const n = Number(val)
  if (n <= 0) return '--'
  return `${n * 2} spm`
}

function formatVerticalOscillation(val: number | null | undefined): string {
  if (val == null || (typeof val === 'number' && isNaN(val))) return '--'
  const n = Number(val)
  if (n <= 0) return '--'
  return `${(n / 10).toFixed(1)} cm`
}

// ─── DB load & client-side filter/sort/page ──────────────────────────────────

/** Load ALL records from DB into memory, then apply filter/sort/page */
async function loadFromDB() {
  loading.value = true
  try {
    localTotalCount.value = await db.activities.count()
    const hasStart = Boolean(filterForm.start_date)
    const hasEnd = Boolean(filterForm.end_date)
    if (hasStart || hasEnd) {
      const lower = hasStart ? dateStrToTs(filterForm.start_date as string) : 0
      const upper = hasEnd ? dateStrToTs(filterForm.end_date as string, true) : 4_102_444_800 // 2100-01-01
      allActivities.value = (await db.activities
        .where('sign_date')
        .between(lower, upper, true, true)
        .toArray()) as unknown as ActivityRecord[]
    } else {
      allActivities.value = (await db.activities.toArray()) as unknown as ActivityRecord[]
    }
    applyFilterAndPage()
  } finally {
    loading.value = false
  }
}

function dateStrToTs(dateStr: string, endOfDay = false): number {
  const d = new Date(dateStr)
  if (endOfDay) { d.setHours(23, 59, 59, 999) }
  return d.getTime() / 1000
}

function applyFilterAndPage() {
  let rows = [...allActivities.value]

  // Filters
  if (filterForm.start_date) {
    const ts = dateStrToTs(filterForm.start_date)
    rows = rows.filter(r => Number(r.sign_date) >= ts)
  }
  if (filterForm.end_date) {
    const ts = dateStrToTs(filterForm.end_date, true)
    rows = rows.filter(r => Number(r.sign_date) <= ts)
  }
  if (filterForm.run_type != null) rows = rows.filter(r => Number(r.run_type) === filterForm.run_type)
  if (filterForm.related_type && filterForm.related_type !== '__other__') {
    rows = rows.filter(r => r.related_type === filterForm.related_type)
  }
  if (filterForm.min_distance != null) rows = rows.filter(r => Number(r.run_km) >= filterForm.min_distance!)
  if (filterForm.max_distance != null) rows = rows.filter(r => Number(r.run_km) <= filterForm.max_distance!)
  if (filterForm.min_total_ascent != null) rows = rows.filter(r => Number(r.total_ascent) >= filterForm.min_total_ascent!)
  if (filterForm.max_total_ascent != null) rows = rows.filter(r => Number(r.total_ascent) <= filterForm.max_total_ascent!)
  if (filterForm.min_avg_heart != null) rows = rows.filter(r => Number(r.avg_heart) >= filterForm.min_avg_heart!)
  if (filterForm.max_avg_heart != null) rows = rows.filter(r => Number(r.avg_heart) <= filterForm.max_avg_heart!)

  // Sort
  const key = orderBy.value as keyof ActivityRecord
  rows.sort((a, b) => {
    const va = Number(a[key] ?? 0)
    const vb = Number(b[key] ?? 0)
    return order.value === 'desc' ? vb - va : va - vb
  })

  // Paginate
  total.value = rows.length
  const pageCount = Math.max(1, Math.ceil(total.value / limit.value))
  if (page.value > pageCount) page.value = pageCount
  if (page.value < 1) page.value = 1
  const offset = (page.value - 1) * limit.value
  activities.value = rows.slice(offset, offset + limit.value)
  selected.value = []
}

function onTableOptionsUpdate(opts: { sortBy?: { key: string; order: 'asc' | 'desc' }[]; page?: number; itemsPerPage?: number }) {
  if (opts.sortBy?.length && ALLOWED_ORDER_KEYS.includes(opts.sortBy[0].key)) {
    orderBy.value = opts.sortBy[0].key
    order.value = opts.sortBy[0].order
  }
  if (opts.page != null) page.value = opts.page
  if (opts.itemsPerPage != null) limit.value = opts.itemsPerPage
  applyFilterAndPage()
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

const syncBtnLoading = computed(() => syncState.value.running)
const syncBtnText = computed(() => {
  const s = syncState.value
  if (s.running) return s.total ? `${s.synced} / ${s.total}` : t('act_syncing')
  return t('act_sync')
})
const syncBtnIcon = computed(() => 'mdi-sync')
const syncBtnColor = computed(() => 'primary')
const syncRangeDays = computed(() => {
  if (!syncForm.start_date || !syncForm.end_date) return 0
  const s = new Date(syncForm.start_date)
  const e = new Date(syncForm.end_date)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return 0
  return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1
})
const syncRangeError = computed(() => {
  if (!syncForm.start_date || !syncForm.end_date) return t('act_sync_invalid_range')
  const s = new Date(syncForm.start_date)
  const e = new Date(syncForm.end_date)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return t('act_sync_invalid_range')
  if (syncRangeDays.value > 31) return t('act_sync_range_max_30')
  return ''
})
const hasDateFilter = computed(() => Boolean(filterForm.start_date || filterForm.end_date))

function openSyncDialog() {
  syncRuntimeError.value = ''
  setSyncDateRange('30d')
  syncDialog.value = true
}

async function confirmSync() {
  if (syncRangeError.value) return
  syncRuntimeError.value = ''
  try {
    const result = await syncActivitiesInRange(syncForm.start_date, syncForm.end_date)
    const currentHasStart = Boolean(filterForm.start_date)
    const currentHasEnd = Boolean(filterForm.end_date)
    const syncStartTs = dateStrToTs(syncForm.start_date)
    const syncEndTs = dateStrToTs(syncForm.end_date, true)
    const currentStartTs = currentHasStart ? dateStrToTs(filterForm.start_date as string) : -Infinity
    const currentEndTs = currentHasEnd ? dateStrToTs(filterForm.end_date as string, true) : Infinity
    const syncRangeCoveredByFilter = syncStartTs >= currentStartTs && syncEndTs <= currentEndTs
    syncDialog.value = false
    await loadFromDB()
    const localTotal = await db.activities.count()
    syncDoneToastText.value = `${t('act_sync_done_toast')} +${result.inserted}, ${t('act_sync_skipped')}: ${result.skipped}, ${t('act_sync_local_total')}: ${localTotal}`
    if (result.inserted > 0 && !syncRangeCoveredByFilter) {
      syncDoneToastText.value += `；${t('act_sync_filter_hint')}`
    }
    syncDoneToastOpen.value = true
  } catch (e) {
    syncRuntimeError.value = resolveApiErrorMessage(e, t, 'activityList')
  }
}

async function fetchActivities() {
  await loadFromDB()
}

async function showAllFromLocal() {
  setDateRange('clear')
  page.value = 1
  await loadFromDB()
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

async function handleFilter() {
  page.value = 1
  if (filterForm.order_by) orderBy.value = filterForm.order_by
  if (filterForm.order) order.value = filterForm.order
  await loadFromDB()
  filterDialog.value = false
}

async function handleReset() {
  Object.assign(filterForm, {
    start_date: undefined, end_date: undefined, run_type: undefined,
    related_type: undefined, min_distance: undefined, max_distance: undefined,
    min_total_ascent: undefined, max_total_ascent: undefined,
    min_avg_heart: undefined, max_avg_heart: undefined,
    order_by: 'sign_date', order: 'desc',
  })
  setDateRange('clear')
  orderBy.value = 'sign_date'
  order.value = 'desc'
  page.value = 1
  await loadFromDB()
  filterDialog.value = false
}

type ExportRow = Record<string, unknown>

function getExportData(): ExportRow[] {
  const toExport = selected.value.length > 0
    ? activities.value.filter(a => selected.value.includes(a.id))
    : activities.value
  return toExport.map(activity => ({
    ...activity,
    run_time: activity.run_time != null ? formatDurationHMS(activity.run_time) : '--',
    run_pace: (activity.run_pace != null && activity.run_pace > 0) ? formatPace(activity.run_pace) : '--',
    sign_date_formatted: activity.sign_date != null ? formatTime(activity.sign_date) : '--',
    run_km_formatted: formatDistance(activity.run_km),
    overlap_label: activity.overlap ? t('act_yes') : t('act_no'),
  } as ExportRow))
}

function getExportBasename(): string {
  return `${t('act_export_filename')}_${formatTime(Date.now() / 1000, 'YYYY-MM-DD')}`
}

function handleExportFormat(format: 'excel' | 'json' | 'md') {
  if (activities.value.length === 0) return
  const data = getExportData()
  const basename = getExportBasename()
  if (format === 'json') { downloadJSON(data, basename); return }
  if (format === 'md') {
    const keys = data.length ? Object.keys(data[0]) : []
    const fixCell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
    const md = ['| ' + keys.join(' | ') + ' |', '| ' + keys.map(() => '---').join(' | ') + ' |',
      ...data.map(row => '| ' + keys.map(k => fixCell(String(row[k] ?? ''))).join(' | ') + ' |')].join('\n')
    downloadText(md, `${basename}.md`, 'text/markdown;charset=utf-8')
    return
  }
  if (format === 'excel') {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Activities')
    XLSX.writeFile(wb, `${basename}.xlsx`)
  }
}

// Reload display whenever sync adds more records
watch(() => syncState.value.synced, async (n, o) => {
  if (n > o) await loadFromDB()
})

onMounted(async () => {
  await initSync()
  setDateRange('clear')
  await loadFromDB()
})
</script>

<style scoped>
.activities-table-card {
  overflow-x: auto;
}
.receipt-distance-link {
  cursor: pointer;
  text-decoration: none;
}
.receipt-distance-link:hover {
  text-decoration: underline;
}
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
