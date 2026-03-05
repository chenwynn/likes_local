<template>
  <v-layout>
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      class="nav-drawer-fixed"
    >
      <div class="layout-brand" :class="{ 'layout-brand-rail': rail }">
        <img src="/likes_30_logo.svg" alt="" class="brand-logo" />
        <span v-show="!rail" class="brand-text">{{ appName || 'likes' }}</span>
      </div>
      <v-list density="compact" nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.id"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="rail ? '' : (item.title ?? '')"
          rounded="lg"
          color="primary"
        />
      </v-list>
      <template #append>
        <v-divider class="my-1" />
        <v-list density="compact">
          <v-list-item @click="toggleLocale" :title="rail ? undefined : (locale === 'zh' ? 'English' : '中文')">
            <template #prepend>
              <v-icon size="20">mdi-translate</v-icon>
            </template>
          </v-list-item>
          <v-list-item @click="toggleTheme" :title="rail ? undefined : themeToggleTitle">
            <template #prepend>
              <v-icon size="20">{{ themeToggleIcon }}</v-icon>
            </template>
          </v-list-item>
          <v-list-item @click="$router.push('/settings')">
            <template #prepend>
              <v-avatar size="24" color="primary" variant="tonal" class="nav-rail-avatar rounded">
                <img v-if="navProfile?.avatar" :src="navProfile.avatar" alt="" class="nav-rail-avatar-img" />
                <span v-else class="text-caption">{{ (navProfile?.user_name || 'U').charAt(0) }}</span>
              </v-avatar>
            </template>
            <template v-if="!rail" #title>
              <span class="nowrap">{{ navProfile?.user_name || t('nav_user') }}</span>
            </template>
          </v-list-item>
          <v-list-item @click="openBackupDialog">
            <template #prepend>
              <v-icon size="20">mdi-database-export-outline</v-icon>
            </template>
            <template v-if="!rail" #title>
              <span class="text-caption">{{ t('backup_entry') }}</span>
            </template>
          </v-list-item>
          <v-list-item
            :prepend-icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            :title="rail ? undefined : t('nav_collapse')"
            @click.stop="toggleRail"
          />
        </v-list>
      </template>
    </v-navigation-drawer>
    <v-main class="main-wrapper">
      <v-container fluid class="pa-4 main-content">
        <router-view />
      </v-container>
    </v-main>

    <v-dialog v-model="apiHintDialog" max-width="560">
      <v-card>
        <v-card-title class="text-subtitle-1">{{ t('api_hint_title') }}</v-card-title>
        <v-card-text>
          <p class="text-body2 mb-3">{{ t('api_hint_desc') }}</p>
          <div class="d-flex align-center flex-wrap gap-2">
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-open-in-new"
              href="https://my.likes.com.cn/settings"
              target="_blank"
              rel="noopener noreferrer"
            >
              my.likes.com.cn/settings
            </v-btn>
            <v-btn variant="text" prepend-icon="mdi-cog" @click="goSettingsFromHint">
              {{ t('nav_settings') }}
            </v-btn>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="apiHintDialog = false">{{ t('settings_save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="backupDialog" max-width="860">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>{{ t('backup_title') }}</span>
          <v-spacer />
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-content-save-plus-outline"
            :loading="backupBusy"
            @click="createBackupNow"
          >
            {{ t('backup_create') }}
          </v-btn>
        </v-card-title>
        <v-card-text>
          <p class="text-caption text-medium-emphasis mb-3">{{ t('backup_desc') }}</p>
          <v-alert
            v-if="backupHint"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ backupHint }}
          </v-alert>
          <v-table density="compact" fixed-header height="360">
            <thead>
              <tr>
                <th>{{ t('backup_version') }}</th>
                <th>{{ t('backup_date') }}</th>
                <th>{{ t('backup_restore_date') }}</th>
                <th>{{ t('backup_count') }}</th>
                <th class="text-right">{{ t('backup_action') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in backupList" :key="row.id">
                <td>{{ row.version }}</td>
                <td>{{ formatTime(row.created_at) }}</td>
                <td>{{ row.restored_at ? formatTime(row.restored_at) : '-' }}</td>
                <td>
                  {{ row.summary.activities }}/{{ row.summary.analysis_detail }}/{{ row.summary.game_task_user }}
                </td>
                <td class="text-right">
                  <v-btn
                    size="small"
                    color="warning"
                    variant="text"
                    prepend-icon="mdi-restore"
                    :loading="backupBusy"
                    @click="restoreBackupRow(row.id)"
                  >
                    {{ t('backup_restore') }}
                  </v-btn>
                </td>
              </tr>
              <tr v-if="!backupList.length">
                <td colspan="5" class="text-center text-medium-emphasis py-6">{{ t('backup_empty') }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="backupDialog = false">{{ t('settings_cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useAuth } from '@/composables/useAuth'
import { useLocale } from '@/composables/useLocale'
import { openApi } from '@/services/api'
import { syncState, initSync } from '@/db/sync'
import { useRouter } from 'vue-router'
import { STORAGE_KEYS } from '@/constants'
import type { OpenProfileResponse } from '@/types'
import { createLocalBackup, listLocalBackups, restoreLocalBackup, type DBBackup } from '@/db'

const theme = useTheme()
const { appName } = useAuth()
const { locale, t, toggleLocale } = useLocale()
const router = useRouter()
const navProfile = ref<Pick<OpenProfileResponse, 'user_name' | 'avatar'> | null>(null)
const apiHintDialog = ref(false)
const backupDialog = ref(false)
const backupList = ref<DBBackup[]>([])
const backupBusy = ref(false)
const backupHint = ref('')

onMounted(async () => {
  try {
    const profile = await openApi.getProfile()
    navProfile.value = { user_name: profile.user_name, avatar: profile.avatar as unknown as string }
  } catch {}
  await initSync()

  const hasShown = localStorage.getItem(STORAGE_KEYS.API_HINT_SHOWN) === 'true'
  if (!hasShown) {
    apiHintDialog.value = true
    localStorage.setItem(STORAGE_KEYS.API_HINT_SHOWN, 'true')
  }
})

const drawer = ref(true)
const rail = ref(localStorage.getItem('nav-rail') === 'true')

function toggleRail() {
  rail.value = !rail.value
  localStorage.setItem('nav-rail', String(rail.value))
}

const themeOrder: Array<'light' | 'dark' | 'claude'> = ['light', 'dark', 'claude']

function toggleTheme() {
  const current = (theme.global.name.value as string) || 'light'
  const idx = themeOrder.indexOf(current as 'light' | 'dark' | 'claude')
  const next = themeOrder[(idx >= 0 ? idx + 1 : 1) % themeOrder.length]
  theme.change(next)
  localStorage.setItem('app-theme', next)
}

const themeToggleTitle = computed(() => {
  const name = (theme.global.name.value as string) || 'light'
  const idx = themeOrder.indexOf(name as 'light' | 'dark' | 'claude')
  const next = themeOrder[(idx >= 0 ? idx + 1 : 1) % themeOrder.length]
  return t(next === 'claude' ? 'nav_theme_claude' : next === 'dark' ? 'nav_theme_dark' : 'nav_theme_light')
})

const themeToggleIcon = computed(() => {
  const name = (theme.global.name.value as string) || 'light'
  if (name === 'light') return 'mdi-weather-night'
  if (name === 'dark') return 'mdi-palette-outline'
  return 'mdi-weather-sunny'
})

const menuItems = computed(() => [
  { id: 'analysis', to: '/analysis', icon: 'mdi-chart-line', title: t('nav_analysis') },
  { id: 'calendar', to: '/calendar', icon: 'mdi-calendar-month', title: t('nav_calendar') },
  { id: 'runcourse', to: '/runcourse', icon: 'mdi-book-open-page-variant', title: t('nav_runcourse') },
  { id: 'activities', to: '/activities', icon: 'mdi-format-list-bulleted', title: t('nav_activities') },
  { id: 'settings', to: '/settings', icon: 'mdi-cog', title: t('nav_settings') },
])

function goSettingsFromHint() {
  apiHintDialog.value = false
  router.push('/settings')
}

function formatTime(v: number): string {
  return new Date(v).toLocaleString()
}

async function loadBackups() {
  backupList.value = await listLocalBackups()
}

async function openBackupDialog() {
  backupDialog.value = true
  await loadBackups()
}

async function createBackupNow() {
  backupBusy.value = true
  backupHint.value = ''
  try {
    const row = await createLocalBackup()
    backupHint.value = `${t('backup_created')}: ${row.version}`
    await loadBackups()
  } finally {
    backupBusy.value = false
  }
}

async function restoreBackupRow(id?: number) {
  if (!id) return
  const ok = window.confirm(t('backup_restore_confirm'))
  if (!ok) return
  backupBusy.value = true
  backupHint.value = ''
  try {
    await restoreLocalBackup(id)
    backupHint.value = t('backup_restore_done')
    await loadBackups()
  } finally {
    backupBusy.value = false
  }
}
</script>

<style scoped>
.nav-drawer-fixed {
  height: 100vh !important;
  overflow-y: auto;
}

.layout-brand {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
}

.layout-brand-rail {
  justify-content: center;
  padding-left: 12px;
  padding-right: 12px;
}

.brand-logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: block;
}

.layout-brand:not(.layout-brand-rail) .brand-logo {
  width: 28px;
  height: 28px;
}

.brand-text {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 18px;
  font-weight: 600;
  color: rgba(var(--v-theme-primary));
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.nav-rail-avatar {
  flex-shrink: 0;
}
.nav-rail-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}
.nowrap {
  white-space: nowrap;
}

.main-wrapper {
  background: rgba(var(--v-theme-surface));
  height: 100vh;
  overflow: auto;
}

.main-content {
  min-height: 100%;
}
</style>
