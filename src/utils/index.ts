import dayjs from 'dayjs'
import { RUN_TYPE_MAP, RELATED_TYPE_MAP, RUN_TYPE_ICONS } from '@/constants'

export const formatTime = (timestamp: number, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs.unix(timestamp).format(format)
}

export const formatDuration = (seconds: number | undefined | null): string => {
  if (seconds == null || typeof seconds !== 'number' || isNaN(seconds)) return '--'
  const totalSec = Math.round(seconds)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }
  return `${minutes}:${sec.toString().padStart(2, '0')}`
}

export const formatDurationHMS = (seconds: number | undefined | null): string => {
  if (seconds == null || typeof seconds !== 'number' || isNaN(seconds)) return '0:00:00'
  const totalSec = Math.round(Math.max(0, seconds))
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  return `${hours}:${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export const formatPace = (paceInSeconds: number | undefined | null): string => {
  if (paceInSeconds == null || typeof paceInSeconds !== 'number' || isNaN(paceInSeconds)) return '--'
  const totalSec = Math.round(paceInSeconds)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}'${seconds.toString().padStart(2, '0')}`
}

export const formatDistance = (km: number | undefined | null, precision = 2): string => {
  if (km == null || typeof km !== 'number' || isNaN(km)) return '--'
  return `${km.toFixed(precision)} km`
}

export const getRunTypeName = (type: number): string => {
  return RUN_TYPE_MAP[type] || '未知类型'
}

export const getRunTypeIcon = (type: number | undefined | null): string => {
  if (type == null) return RUN_TYPE_ICONS[1] ?? 'mdi-run'
  return RUN_TYPE_ICONS[type] ?? RUN_TYPE_ICONS[254] ?? 'mdi-dumbbell'
}

export const getRelatedTypeName = (relatedType: string | undefined | null): string => {
  if (relatedType == null || String(relatedType).trim() === '') return '--'
  return RELATED_TYPE_MAP[relatedType] ?? relatedType
}

export const downloadJSON = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`)
}

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const downloadText = (content: string, filename: string, mimeType = 'text/plain;charset=utf-8'): void => {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType })
  downloadBlob(blob, filename)
}

type ZonePct = { name: string; pctMin: number; pctMax: number }
const DEFAULT_ZONE_CONFIG = {
  HR_RESERVE: [
    { name: 'E', pctMin: 59, pctMax: 74 },
    { name: 'M', pctMin: 74, pctMax: 84 },
    { name: 'T', pctMin: 84, pctMax: 88 },
    { name: 'A', pctMin: 88, pctMax: 95 },
    { name: 'I', pctMin: 95, pctMax: 100 },
  ],
  HR_MAX: [
    { name: 'Z1', pctMin: 0, pctMax: 50 },
    { name: 'Z2', pctMin: 50, pctMax: 60 },
    { name: 'Z3', pctMin: 60, pctMax: 70 },
    { name: 'Z4', pctMin: 70, pctMax: 80 },
    { name: 'Z5', pctMin: 80, pctMax: 90 },
    { name: 'Z6', pctMin: 90, pctMax: 100 },
  ],
  FTP: [
    { name: 'Z1', pctMin: 0, pctMax: 55 },
    { name: 'Z2', pctMin: 56, pctMax: 75 },
    { name: 'Z3', pctMin: 76, pctMax: 90 },
    { name: 'Z4', pctMin: 91, pctMax: 105 },
    { name: 'Z5', pctMin: 106, pctMax: 120 },
    { name: 'Z6', pctMin: 120, pctMax: 120 },
  ],
  CSS: [
    { name: 'Z1', pctMin: 30, pctMax: 89 },
    { name: 'Z2', pctMin: 90, pctMax: 95 },
    { name: 'Z3', pctMin: 95, pctMax: 100 },
    { name: 'Z4', pctMin: 105, pctMax: 110 },
    { name: 'Z5', pctMin: 111, pctMax: 111 },
  ],
}
const THRESHOLD_PACE_ZONES: ZonePct[] = [
  { name: 'E', pctMin: 79, pctMax: 92 },
  { name: 'M', pctMin: 92, pctMax: 100 },
  { name: 'T', pctMin: 100, pctMax: 103 },
  { name: 'A', pctMin: 103, pctMax: 109 },
  { name: 'I', pctMin: 109, pctMax: 117 },
  { name: 'R', pctMin: 117, pctMax: 120 },
]
const ZONE_CONFIG = DEFAULT_ZONE_CONFIG
function pad2(n: number) { return Math.round(n).toString().padStart(2, '0') }

export function getThresholdPaceZones(tPaceSec: number | undefined | null): { name: string; range: string; pace: string }[] {
  if (tPaceSec == null || tPaceSec <= 0) return []
  const t = Math.round(tPaceSec)
  return THRESHOLD_PACE_ZONES.map((z) => {
    const range = z.pctMax >= 120 ? `${z.pctMin}%+` : `${z.pctMin}-${z.pctMax}%`
    const minSec = Math.round((t * 100) / z.pctMax)
    const maxSec = Math.round((t * 100) / z.pctMin)
    const pace = `${formatPace(minSec)}-${formatPace(maxSec)}/km`
    return { name: z.name, range, pace }
  })
}

export function getHrReserveZones(maxHr: number, minHr: number): { name: string; range: string; hr: string }[] {
  if (!maxHr || maxHr <= minHr) return []
  return ZONE_CONFIG.HR_RESERVE.map((z) => {
    const hrMin = minHr + ((maxHr - minHr) * z.pctMin) / 100
    const hrMax = minHr + ((maxHr - minHr) * z.pctMax) / 100
    return { name: z.name, range: `${z.pctMin}-${z.pctMax}%`, hr: `${Math.round(hrMin)}-${Math.round(hrMax)}` }
  })
}

export function getHrMaxZones(maxHr: number): { name: string; range: string; hr: string }[] {
  if (!maxHr) return []
  return ZONE_CONFIG.HR_MAX.map((z) => {
    const hrMin = (maxHr * z.pctMin) / 100
    const hrMax = (maxHr * z.pctMax) / 100
    return { name: z.name, range: `${z.pctMin}-${z.pctMax}%`, hr: `${Math.round(hrMin)}-${Math.round(hrMax)}` }
  })
}

export function getFtpZones(ftp: number | undefined | null): { name: string; range: string; watts: string }[] {
  if (ftp == null || ftp <= 0) return []
  return ZONE_CONFIG.FTP.map((z) => {
    const wMin = (ftp * z.pctMin) / 100
    const wMax = (ftp * z.pctMax) / 100
    return { name: z.name, range: `${z.pctMin}-${z.pctMax}%`, watts: `${Math.round(wMin)}-${Math.round(wMax)}w` }
  })
}

export function getSwimCssZones(cssSec: number | undefined | null): { name: string; range: string; pace: string }[] {
  if (cssSec == null || cssSec <= 0) return []
  return ZONE_CONFIG.CSS.map((z) => {
    const paceMax = cssSec / (z.pctMin / 100)
    const paceMin = cssSec / (z.pctMax / 100)
    const fmt = (s: number) => `${Math.floor(s / 60)}:${pad2(s % 60)}`
    return { name: z.name, range: `${z.pctMin}-${z.pctMax}%`, pace: `${fmt(paceMax)}-${fmt(paceMin)}/100m` }
  })
}
