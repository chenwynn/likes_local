import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '@/constants'

const apiKey = ref<string>(
  // Never preload API key from build-time env in app runtime.
  // This avoids leaking packager's personal key to end users.
  localStorage.getItem(STORAGE_KEYS.API_KEY) ?? ''
)
const apiBaseUrl = ref<string>(
  localStorage.getItem(STORAGE_KEYS.API_BASE_URL) ?? (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'https://my.likes.com.cn'
)
const appName = ref<string>(
  localStorage.getItem(STORAGE_KEYS.APP_NAME) ?? (import.meta.env.VITE_APP_NAME as string | undefined) ?? 'likes'
)
const customPassword = ref<string>(
  localStorage.getItem(STORAGE_KEYS.APP_PASSWORD) ?? ''
)
const unlocked = ref<boolean>(
  sessionStorage.getItem(STORAGE_KEYS.APP_UNLOCKED) === 'true' || !customPassword.value
)

const isAuthenticated = computed(() => !!apiKey.value)
const loading = ref(false)

export function useAuth() {
  function saveSettings(opts: {
    apiKey?: string
    apiBaseUrl?: string
    appName?: string
    customPassword?: string
  }) {
    if (opts.apiKey !== undefined) {
      apiKey.value = opts.apiKey
      localStorage.setItem(STORAGE_KEYS.API_KEY, opts.apiKey)
    }
    if (opts.apiBaseUrl !== undefined) {
      apiBaseUrl.value = opts.apiBaseUrl
      localStorage.setItem(STORAGE_KEYS.API_BASE_URL, opts.apiBaseUrl)
    }
    if (opts.appName !== undefined) {
      appName.value = opts.appName
      localStorage.setItem(STORAGE_KEYS.APP_NAME, opts.appName)
    }
    if (opts.customPassword !== undefined) {
      customPassword.value = opts.customPassword
      localStorage.setItem(STORAGE_KEYS.APP_PASSWORD, opts.customPassword)
      if (!opts.customPassword) {
        unlocked.value = true
        sessionStorage.removeItem(STORAGE_KEYS.APP_UNLOCKED)
      }
    }
  }

  function unlock(password: string): boolean {
    if (password === customPassword.value) {
      unlocked.value = true
      sessionStorage.setItem(STORAGE_KEYS.APP_UNLOCKED, 'true')
      return true
    }
    return false
  }

  function logout() {
    apiKey.value = ''
    localStorage.removeItem(STORAGE_KEYS.API_KEY)
  }

  return {
    isAuthenticated,
    apiKey,
    apiBaseUrl,
    appName,
    customPassword,
    unlocked,
    loading,
    saveSettings,
    unlock,
    logout,
  }
}
