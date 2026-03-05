<template>
  <div class="settings-page">
    <h1 class="text-h5 font-weight-bold mb-4">{{ t('settings_title') }}</h1>

    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-body1 font-weight-medium pa-4 pb-2">{{ t('settings_local') }}</v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6"><v-text-field v-model="localForm.appName" :label="t('settings_app_name')" :placeholder="t('settings_app_name_placeholder')" variant="outlined" density="compact" hide-details /></v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="localForm.apiBaseUrl" :label="t('settings_baseurl_title')" :placeholder="t('settings_baseurl_placeholder')" variant="outlined" density="compact" hide-details /></v-col>
          <v-col cols="12">
            <div class="d-flex align-center gap-2">
              <v-text-field v-model="localForm.apiKey" :label="t('settings_apikey_title')" :placeholder="t('settings_apikey_placeholder')" :type="showApiKey ? 'text' : 'password'" variant="outlined" density="compact" hide-details :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showApiKey = !showApiKey" />
              <v-btn variant="text" size="small" @click="copyApiKey">{{ apiKeyCopied ? t('settings_apikey_copied') : t('settings_apikey_copy') }}</v-btn>
            </div>
          </v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="localForm.customPassword" :label="t('settings_password_title')" :placeholder="t('settings_password_placeholder')" type="password" variant="outlined" density="compact" hide-details /></v-col>
        </v-row>
        <v-btn color="primary" class="mt-3" @click="saveLocalSettings" :loading="localSaving">{{ t('settings_save') }}</v-btn>
        <v-divider class="my-4" />
        <div class="d-flex align-center flex-wrap gap-2">
          <v-btn
            variant="tonal"
            prepend-icon="mdi-open-in-new"
            href="https://my.likes.com.cn/settings"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('settings_get_api_key') }}
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-connection" :loading="testingApi" @click="testApiConnection">
            {{ t('settings_test_connection') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-database-sync"
            :loading="initSyncLoading"
            :disabled="initSyncDisabled"
            @click="runInitSync"
          >
            {{ t('settings_init_sync') }}
          </v-btn>
        </div>
        <p v-if="initSyncDisabled" class="text-caption text-warning mt-2 mb-0">{{ t('settings_init_sync_disabled') }}</p>
        <p v-if="initSyncHint" class="text-caption text-medium-emphasis mt-2 mb-0">{{ initSyncHint }}</p>
      </v-card-text>
    </v-card>

    <v-card variant="outlined" class="mb-4">
      <v-card-title class="d-flex align-center text-subtitle-1 font-weight-bold settings-basic-header">
        <v-avatar size="40" color="primary" variant="tonal" class="me-3">
          <img v-if="profileForm.avatar" :src="String(profileForm.avatar)" alt="" class="settings-user-avatar" />
          <span v-else class="text-body1">{{ String(profileForm.user_name || 'U').charAt(0) }}</span>
        </v-avatar>
        {{ profileForm.user_name || t('settings_profile') }}
        <v-spacer />
        <v-btn
          size="small"
          variant="text"
          prepend-icon="mdi-cloud-sync-outline"
          :loading="profileSyncing"
          @click.stop="forceReloadProfile"
        >
          {{ t('settings_sync_remote') }}
        </v-btn>
      </v-card-title>
      <v-card-text class="settings-card-content px-4">
        <div class="setting-grid">
          <v-text-field v-model="profileForm.user_name" :label="t('settings_name')" variant="outlined" density="compact" hide-details />
          <v-text-field v-model="profileForm.slogan" :label="t('settings_slogan')" variant="outlined" density="compact" hide-details />
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4" variant="outlined">
      <v-card-title class="d-flex align-center text-subtitle-1 font-weight-bold"><v-icon size="20" class="me-2">mdi-human-handsdown</v-icon>{{ t('settings_body_hr') }}</v-card-title>
      <v-card-text class="settings-card-content px-4">
        <div class="setting-grid">
          <v-text-field v-model.number="profileForm.height" :label="t('settings_height')" suffix="cm" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="profileForm.weight" :label="t('settings_weight')" suffix="kg" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="profileForm.min_rate" :label="t('settings_rest_hr')" suffix="bpm" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="profileForm.max_rate" :label="t('settings_max_hr')" suffix="bpm" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="profileForm.run_force" :label="t('settings_run_force')" variant="outlined" density="compact" hide-details />
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4" variant="outlined">
      <v-card-title class="d-flex align-center text-subtitle-1 font-weight-bold"><v-icon size="20" class="me-2">mdi-run</v-icon>{{ t('settings_run_pace') }}</v-card-title>
      <v-card-text class="settings-card-content px-4">
        <div class="setting-grid">
          <v-text-field :model-value="paceDisplay(profileForm.goal_m, '/km')" :label="t('settings_goal_marathon_pace')" variant="outlined" density="compact" hide-details readonly append-inner-icon="mdi-pencil-outline" @click:append-inner="openPaceEdit('goal_m', t('settings_goal_marathon_pace'))" />
          <v-text-field :model-value="paceDisplay(profileForm.m, '/km')" :label="t('settings_cur_marathon_pace')" variant="outlined" density="compact" hide-details readonly append-inner-icon="mdi-pencil-outline" @click:append-inner="openPaceEdit('m', t('settings_cur_marathon_pace'))" />
          <v-text-field :model-value="paceDisplay(profileForm.goal_t, '/km')" :label="t('settings_goal_lt_pace')" variant="outlined" density="compact" hide-details readonly append-inner-icon="mdi-pencil-outline" @click:append-inner="openPaceEdit('goal_t', t('settings_goal_lt_pace'))" />
          <v-text-field :model-value="paceDisplay(profileForm.t_pace, '/km')" :label="t('settings_threshold_pace')" variant="outlined" density="compact" hide-details readonly append-inner-icon="mdi-pencil-outline" @click:append-inner="openPaceEdit('t_pace', t('settings_threshold_pace'))" />
          <v-text-field v-model.number="profileForm.critical_power" :label="t('settings_power_cp')" suffix="W" variant="outlined" density="compact" hide-details />
        </div>
        <div class="sport-zone-blocks mt-3">
          <div class="zone-block">
            <p class="zone-block-title text-caption font-weight-bold mb-2">{{ t('settings_pace_zones') }}</p>
            <div class="zone-table-compact"><div v-for="z in runPaceZones" :key="'pace_' + z.name" class="zone-row"><span class="zone-bubble" :style="{ backgroundColor: zoneColor(z.name) }">{{ z.name }}</span><span>{{ z.range }}</span><span>{{ z.pace }}</span></div></div>
          </div>
          <div class="zone-block">
            <p class="zone-block-title text-caption font-weight-bold mb-2">{{ t('settings_hr_reserve_zones') }}</p>
            <div class="zone-table-compact"><div v-for="z in runHrReserveZones" :key="'hrr_' + z.name" class="zone-row"><span class="zone-bubble" :style="{ backgroundColor: zoneColor(z.name) }">{{ z.name }}</span><span>{{ z.range }}</span><span>{{ z.hr }}</span></div></div>
          </div>
          <div class="zone-block">
            <p class="zone-block-title text-caption font-weight-bold mb-2">{{ t('settings_hr_max_zones') }}</p>
            <div class="zone-table-compact"><div v-for="z in runHrMaxZones" :key="'hrm_' + z.name" class="zone-row"><span class="zone-bubble" :style="{ backgroundColor: zoneColor(z.name) }">{{ z.name }}</span><span>{{ z.range }}</span><span>{{ z.hr }}</span></div></div>
          </div>
          <div class="zone-block">
            <p class="zone-block-title text-caption font-weight-bold mb-2">{{ t('settings_power_zones') }}</p>
            <div class="zone-table-compact"><div v-for="z in runCpZones" :key="'cp_' + z.name" class="zone-row"><span class="zone-bubble" :style="{ backgroundColor: zoneColor(z.name) }">{{ z.name }}</span><span>{{ z.range }}</span><span>{{ z.watts }}</span></div></div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4" variant="outlined">
      <v-card-title class="d-flex align-center text-subtitle-1 font-weight-bold"><v-icon size="20" class="me-2">mdi-bike</v-icon>{{ t('settings_ride') }}</v-card-title>
      <v-card-text class="settings-card-content px-4">
        <div class="setting-grid">
          <v-text-field v-model.number="profileForm.ftp" :label="t('settings_ftp')" suffix="W" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="profileForm.max_rate_ride" :label="t('settings_ride_max_hr')" variant="outlined" density="compact" hide-details />
          <v-text-field v-model.number="profileForm.lt_ride" :label="t('settings_ride_lt_hr')" variant="outlined" density="compact" hide-details />
        </div>
        <div class="sport-zone-blocks mt-3">
          <div class="zone-block">
            <p class="zone-block-title text-caption font-weight-bold mb-2">{{ t('settings_power_zones') }}</p>
            <div class="zone-table-compact"><div v-for="z in rideFtpZones" :key="'rftp_' + z.name" class="zone-row"><span class="zone-bubble" :style="{ backgroundColor: zoneColor(z.name) }">{{ z.name }}</span><span>{{ z.range }}</span><span>{{ z.watts }}</span></div></div>
          </div>
          <div class="zone-block">
            <p class="zone-block-title text-caption font-weight-bold mb-2">{{ t('settings_hr_max_zones') }}</p>
            <div class="zone-table-compact"><div v-for="z in rideHrMaxZones" :key="'rhr_' + z.name" class="zone-row"><span class="zone-bubble" :style="{ backgroundColor: zoneColor(z.name) }">{{ z.name }}</span><span>{{ z.range }}</span><span>{{ z.hr }}</span></div></div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4" variant="outlined">
      <v-card-title class="d-flex align-center text-subtitle-1 font-weight-bold"><v-icon size="20" class="me-2">mdi-swim</v-icon>{{ t('settings_swim') }}</v-card-title>
      <v-card-text class="settings-card-content px-4">
        <div class="setting-grid">
          <v-text-field :model-value="paceDisplay(profileForm.css, '/100m')" :label="t('settings_swim_css')" variant="outlined" density="compact" hide-details readonly append-inner-icon="mdi-pencil-outline" @click:append-inner="openPaceEdit('css', t('settings_swim_css'))" />
          <v-text-field v-model.number="profileForm.max_rate_swim" :label="t('settings_swim_max_hr')" variant="outlined" density="compact" hide-details />
        </div>
        <div class="sport-zone-blocks mt-3">
          <div class="zone-block">
            <p class="zone-block-title text-caption font-weight-bold mb-2">{{ t('settings_css_zones') }}</p>
            <div class="zone-table-compact"><div v-for="z in swimCssZones" :key="'scss_' + z.name" class="zone-row"><span class="zone-bubble" :style="{ backgroundColor: zoneColor(z.name) }">{{ z.name }}</span><span>{{ z.range }}</span><span>{{ z.pace }}</span></div></div>
          </div>
          <div class="zone-block">
            <p class="zone-block-title text-caption font-weight-bold mb-2">{{ t('settings_hr_max_zones') }}</p>
            <div class="zone-table-compact"><div v-for="z in swimHrMaxZones" :key="'shr_' + z.name" class="zone-row"><span class="zone-bubble" :style="{ backgroundColor: zoneColor(z.name) }">{{ z.name }}</span><span>{{ z.range }}</span><span>{{ z.hr }}</span></div></div>
          </div>
        </div>
        <v-btn color="primary" class="mt-4" @click="saveProfile" :loading="profileSaving" :disabled="profileLoading">{{ t('settings_save') }}</v-btn>
      </v-card-text>
    </v-card>

    <PaceModal
      v-model="paceModalOpen"
      :value-seconds="paceEditValue"
      :title="paceEditTitle"
      :hint="paceEditKey === 'css' ? '每100米 分:秒' : '配速以每公里 分:秒 存储'"
      @confirm="onPaceConfirm"
    />

    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-body1 font-weight-medium pa-4 pb-2">{{ t('settings_local_db') }}</v-card-title>
      <v-card-text>
        <p class="text-body2 text-medium-emphasis mb-3">{{ t('settings_local_db_desc') }}</p>
        <v-row dense class="mb-3">
          <v-col cols="6" sm="3"><div class="text-h6 font-weight-bold">{{ dbStats.activities }}</div><div class="text-caption text-medium-emphasis">{{ t('settings_db_activities') }}</div></v-col>
          <v-col cols="6" sm="3"><div class="text-h6 font-weight-bold">{{ dbStats.fits }}</div><div class="text-caption text-medium-emphasis">{{ t('settings_db_fits') }}</div></v-col>
          <v-col cols="6" sm="3"><div class="text-h6 font-weight-bold">{{ dbStats.analysis }}</div><div class="text-caption text-medium-emphasis">{{ t('settings_db_analysis') }}</div></v-col>
        </v-row>
        <v-btn variant="outlined" color="error" size="small" prepend-icon="mdi-delete-outline" :loading="clearingDb" @click="clearDb">{{ t('settings_db_clear') }}</v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useLocale } from '@/composables/useLocale'
import { openApi } from '@/services/api'
import { db, hasAnyLocalData } from '@/db'
import { resetSync, startSync } from '@/db/sync'
import PaceModal from '@/components/Settings/PaceModal.vue'
import { formatPace, getThresholdPaceZones, getHrReserveZones, getHrMaxZones, getFtpZones, getSwimCssZones } from '@/utils'
import type { OpenProfileResponse } from '@/types'

const { saveSettings, apiKey, apiBaseUrl, appName, customPassword } = useAuth()
const { t } = useLocale()

const localForm = reactive({ appName: appName.value, apiKey: apiKey.value, apiBaseUrl: apiBaseUrl.value, customPassword: customPassword.value })
const showApiKey = ref(false)
const apiKeyCopied = ref(false)
const localSaving = ref(false)
const testingApi = ref(false)
const initSyncLoading = ref(false)
const initSyncHint = ref('')
const initSyncDisabled = ref(false)

function copyApiKey() {
  navigator.clipboard.writeText(localForm.apiKey).then(() => {
    apiKeyCopied.value = true
    setTimeout(() => (apiKeyCopied.value = false), 2000)
  })
}
async function saveLocalSettings() {
  localSaving.value = true
  saveSettings({ appName: localForm.appName, apiKey: localForm.apiKey.trim(), apiBaseUrl: localForm.apiBaseUrl.trim(), customPassword: localForm.customPassword })
  await new Promise(r => setTimeout(r, 200))
  localSaving.value = false
}

async function testApiConnection() {
  testingApi.value = true
  try {
    await openApi.getProfile(true)
    initSyncHint.value = t('settings_test_ok')
  } catch {
    initSyncHint.value = t('settings_test_failed')
  } finally {
    testingApi.value = false
  }
}

async function runInitSync() {
  if (initSyncDisabled.value) return
  initSyncLoading.value = true
  try {
    // 1) Profile
    await openApi.getProfile(true)
    // 2) Plans
    await db.game_task_user.clear()
    await openApi.syncPlansToLocal({})
    // 3) Activities (full background sync, first page immediately)
    await resetSync()
    await startSync()
    await loadDbStats()
    await refreshInitSyncDisabled()
    initSyncHint.value = t('settings_init_sync_started')
  } catch {
    initSyncHint.value = t('settings_init_sync_failed')
  } finally {
    initSyncLoading.value = false
  }
}

const profileLoading = ref(false)
const profileSaving = ref(false)
const profileSyncing = ref(false)
const paceModalOpen = ref(false)
const paceEditKey = ref<'' | 'goal_m' | 'm' | 'goal_t' | 't_pace' | 'css'>('')
const paceEditTitle = ref('')
const paceEditValue = ref(0)
const profileForm = reactive<Partial<OpenProfileResponse>>({
  user_name: '', slogan: '',
  height: undefined, weight: undefined, min_rate: undefined, max_rate: undefined, run_force: undefined,
  goal_m: undefined, m: undefined, goal_t: undefined, t: undefined, t_pace: undefined, critical_power: undefined,
  ftp: undefined, max_rate_ride: undefined, lt_ride: undefined,
  css: undefined, max_rate_swim: undefined,
})
async function loadProfile() {
  profileLoading.value = true
  try {
    // local-first: immediate render from IndexedDB
    const local = await db.profile.get(1)
    if (local?.data) Object.assign(profileForm, local.data)
    // then refresh from API (and save back to DB in openApi)
    const p = await openApi.getProfile(true)
    Object.assign(profileForm, p)
  } catch {
    // fallback to local profile if API fails
    const local = await db.profile.get(1)
    if (local?.data) Object.assign(profileForm, local.data)
  } finally {
    profileLoading.value = false
  }
}
async function saveProfile() {
  profileSaving.value = true
  try {
    const numOrUndef = (v: unknown): number | undefined => {
      if (v === '' || v === null || v === undefined) return undefined
      const n = Number(v)
      return Number.isFinite(n) ? n : undefined
    }
    await openApi.updateProfile({
      user_name: profileForm.user_name,
      slogan: profileForm.slogan,
      height: numOrUndef(profileForm.height),
      weight: numOrUndef(profileForm.weight),
      min_rate: numOrUndef(profileForm.min_rate),
      max_rate: numOrUndef(profileForm.max_rate),
      run_force: numOrUndef(profileForm.run_force),
      goal_m: numOrUndef(profileForm.goal_m),
      m: numOrUndef(profileForm.m),
      goal_t: numOrUndef(profileForm.goal_t),
      // Keep backend t aligned with threshold pace to avoid duplicated semantics in UI
      t: numOrUndef(profileForm.t_pace),
      t_pace: numOrUndef(profileForm.t_pace),
      critical_power: numOrUndef(profileForm.critical_power),
      ftp: numOrUndef(profileForm.ftp),
      max_rate_ride: numOrUndef(profileForm.max_rate_ride),
      lt_ride: numOrUndef(profileForm.lt_ride),
      css: numOrUndef(profileForm.css),
      max_rate_swim: numOrUndef(profileForm.max_rate_swim),
    })
  } finally {
    profileSaving.value = false
  }
}

async function forceReloadProfile() {
  profileSyncing.value = true
  try {
    sessionStorage.removeItem('likes_cache_profile')
    const p = await openApi.getProfile(true)
    Object.assign(profileForm, p)
  } finally {
    profileSyncing.value = false
  }
}

function paceDisplay(v: unknown, unit = '/km'): string {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return '?'
  return `${formatPace(n)}${unit}`
}

function openPaceEdit(
  key: 'goal_m' | 'm' | 'goal_t' | 't_pace' | 'css',
  title: string
) {
  paceEditKey.value = key
  paceEditTitle.value = title
  const current = Number(profileForm[key])
  paceEditValue.value = Number.isFinite(current) && current > 0 ? current : 0
  paceModalOpen.value = true
}

function onPaceConfirm(totalSeconds: number) {
  const key = paceEditKey.value
  if (!key) return
  profileForm[key] = totalSeconds
}

const runPaceZones = computed(() => getThresholdPaceZones(Number(profileForm.t_pace) || 0))
const runHrReserveZones = computed(() => getHrReserveZones(Number(profileForm.max_rate) || 0, Number(profileForm.min_rate) || 0))
const runHrMaxZones = computed(() => getHrMaxZones(Number(profileForm.max_rate) || 0))
const runCpZones = computed(() => getFtpZones(Number(profileForm.critical_power) || 0))
const rideFtpZones = computed(() => getFtpZones(Number(profileForm.ftp) || 0))
const rideHrMaxZones = computed(() => getHrMaxZones(Number(profileForm.max_rate_ride) || Number(profileForm.max_rate) || 0))
const swimCssZones = computed(() => getSwimCssZones(Number(profileForm.css) || 0))
const swimHrMaxZones = computed(() => getHrMaxZones(Number(profileForm.max_rate_swim) || Number(profileForm.max_rate) || 0))

const ZONE_COLORS: Record<string, string> = {
  Z0: '#2196F3', Z1: '#4CAF50', Z2: '#8BC34A', Z3: '#FFC107',
  Z4: '#FF9800', Z5: '#FF5722', Z6: '#F44336', Z7: '#E91E63',
  E: '#4CAF50', M: '#8BC34A', T: '#FFC107', A: '#FF9800', I: '#FF5722', R: '#F44336',
}
function zoneColor(name: string): string { return ZONE_COLORS[name] ?? '#9E9E9E' }

const dbStats = reactive({ activities: 0, fits: 0, analysis: 0 })
const clearingDb = ref(false)
async function loadDbStats() {
  dbStats.activities = await db.activities.count()
  dbStats.fits = await db.activity_fits.count()
  dbStats.analysis = await db.analysis_detail.count()
}
async function refreshInitSyncDisabled() {
  initSyncDisabled.value = await hasAnyLocalData()
}
async function clearDb() {
  const ok = window.confirm(t('settings_db_clear_confirm'))
  if (!ok) return
  clearingDb.value = true
  try {
    await resetSync()
    await db.activity_fits.clear()
    await db.profile.clear()
    await db.game_task_user.clear()
    await db.runcourse.clear()
    await loadDbStats()
    await refreshInitSyncDisabled()
  } finally {
    clearingDb.value = false
  }
}

onMounted(async () => {
  await loadProfile()
  await loadDbStats()
  await refreshInitSyncDisabled()
})
</script>

<style scoped>
.settings-page { max-width: 1000px; }
.settings-card-content { padding-left: 16px; padding-right: 16px; }
.settings-basic-header { flex-wrap: wrap; }
.settings-user-avatar { width: 100%; height: 100%; object-fit: cover; }
.setting-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.sport-zone-blocks { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 20px; }
.zone-block { width: max-content; max-width: 100%; padding: 12px; background: rgba(var(--v-theme-surface), 0.42); border-radius: 8px; border: 1px solid rgba(var(--v-border-color), 0.06); }
.zone-bubble { display: inline-block; min-width: 24px; padding: 2px 6px; border-radius: 4px; color: #fff; font-weight: 600; text-align: center; }
.zone-table-compact { font-size: 12px; }
.zone-row { display: grid; grid-template-columns: 32px 90px 1fr; gap: 8px; padding: 2px 0; border-bottom: 1px solid rgba(var(--v-border-color), 0.06); }
.zone-row:last-child { border-bottom: none; }
.settings-page :deep(.v-card.v-card--variant-outlined) { border-color: rgba(var(--v-border-color), 0.16) !important; }
.settings-page :deep(.v-field--variant-outlined .v-field__outline) { --v-field-border-opacity: 0.22; }
@media (max-width: 960px) { .setting-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .setting-grid { grid-template-columns: 1fr; } }
</style>
