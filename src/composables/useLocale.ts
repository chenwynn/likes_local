import { ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { messages, getStoredLocale, setStoredLocale, type Locale } from '@/locales'

const locale = ref<Locale>(getStoredLocale())

function applyDayjsLocale(l: Locale) {
  dayjs.locale(l === 'zh' ? 'zh-cn' : 'en')
}
applyDayjsLocale(getStoredLocale())

export function useLocale() {
  function t(key: string): string {
    return messages[locale.value][key] ?? messages.zh[key] ?? key
  }

  function setLocale(l: Locale) {
    locale.value = l
    setStoredLocale(l)
    applyDayjsLocale(l)
  }

  function toggleLocale() {
    const next: Locale = locale.value === 'zh' ? 'en' : 'zh'
    setLocale(next)
  }

  return { locale, t, setLocale, toggleLocale }
}

export function getLocaleRef() {
  return locale
}
