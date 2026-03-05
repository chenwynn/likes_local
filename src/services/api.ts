import axios, { type AxiosInstance } from 'axios'
import type {
  ActivityListResponse,
  ActivityQueryParams,
  OpenProfileResponse,
  UpdateOpenProfilePayload,
  LinkedLoginsResponse,
  OpenPlansResponse,
  OpenPlanRow,
  OpenPushPlansPayload,
  OpenPushPlansResponse,
} from '@/types'
import { STORAGE_KEYS } from '@/constants'
import { db, saveActivities, saveProfile, saveActivityFit, savePlans, type DBActivityFit } from '@/db'

// ─── sessionStorage cache (short-lived, dedup within a session) ─────────────

const CACHE_TTL: Record<string, number> = {
  profile: 5 * 60 * 1000,
  linkedLogins: 5 * 60 * 1000,
  // activity pages: 90s — absorbs the v-data-table-server double-fire on mount
  // and avoids 429 when the user navigates back quickly
  activities: 90 * 1000,
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem('likes_cache_' + key)
    if (!raw) return null
    const { t, data } = JSON.parse(raw) as { t: number; data: T }
    const ttl = CACHE_TTL[key] ?? 30_000
    if (Date.now() - t > ttl) return null
    return data
  } catch {
    return null
  }
}

function cacheSet(key: string, data: unknown): void {
  try {
    sessionStorage.setItem('likes_cache_' + key, JSON.stringify({ t: Date.now(), data }))
  } catch {}
}

// ─── Axios instance ───────────────────────────────────────────────────────

function getApiKey(): string {
  // Do not read API key from build-time env in packaged/runtime app.
  // Only explicit user input stored locally is trusted.
  return localStorage.getItem(STORAGE_KEYS.API_KEY) ?? ''
}

function getBaseUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.API_BASE_URL) ?? (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'https://my.likes.com.cn'
}

let _client: AxiosInstance | null = null

function getClient(): AxiosInstance {
  if (!_client) {
    _client = axios.create({ timeout: 15000 })
    _client.interceptors.request.use((config) => {
      const key = getApiKey()
      if (key) config.headers['X-API-Key'] = key
      const base = import.meta.env.DEV ? '' : getBaseUrl()
      if (!config.url?.startsWith('http')) config.baseURL = base
      return config
    })
  }
  return _client
}

// ─── Normalisation ───────────────────────────────────────────────────────

function normalizeActivity(raw: Record<string, unknown>): Record<string, unknown> {
  const pick = (k: string, K: string) => raw[k] ?? raw[K]
  return {
    id: pick('id', 'Id') ?? pick('sign_id', 'SignId'),
    sign_date: pick('sign_date', 'SignDate'),
    created_time: pick('created_time', 'CreatedTime'),
    run_type: pick('run_type', 'RunType'),
    run_km: pick('run_km', 'RunKm'),
    run_time: pick('run_time', 'RunTime'),
    run_pace: pick('run_pace', 'RunPace'),
    avg_heart: pick('avg_heart', 'AvgHeart'),
    max_heart: pick('max_heart', 'MaxHeart'),
    total_ascent: pick('total_ascent', 'TotalAscent'),
    tss: pick('tss', 'Tss'),
    run_force: pick('run_force', 'RunForce'),
    overlap: pick('overlap', 'Overlap'),
    related_type: pick('related_type', 'RelatedType'),
    avg_cadence: pick('avg_cadence', 'AvgCadence'),
    avg_stride: pick('avg_stride', 'AvgStride'),
    avg_contact: pick('avg_contact', 'AvgContact'),
    avg_fly: pick('avg_fly', 'AvgFly'),
    avg_vertical: pick('avg_vertical', 'AvgVertical'),
    avg_vertical_ratio: pick('avg_vertical_ratio', 'AvgVerticalRatio'),
    avg_power: pick('avg_power', 'AvgPower'),
    temperature: pick('temperature', 'Temperature'),
    aerobic_time: pick('aerobic_time', 'AerobicTime'),
    hybrid_time: pick('hybrid_time', 'HybridTime'),
    velocity_time: pick('velocity_time', 'VelocityTime'),
    score: pick('score', 'Score'),
    data_source_path: pick('data_source_path', 'DataSourcePath'),
    analysis: pick('analysis', 'Analysis'),
    ...raw,
  }
}

function normalizeProfile(raw: Record<string, unknown>): OpenProfileResponse {
  const out: Record<string, unknown> = {}
  const put = (targetKey: string, keys: string[], parser?: (v: unknown) => unknown) => {
    for (const key of keys) {
      if (raw[key] !== undefined) {
        out[targetKey] = parser ? parser(raw[key]) : raw[key]
        return
      }
    }
  }
  const toNum = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }

  put('user_name', ['user_name', 'UserName'])
  put('avatar', ['avatar', 'Avatar'])
  put('slogan', ['slogan', 'Slogan'])
  put('emergency_contact', ['emergency_contact', 'EmergencyContact', 'contact', 'Contact'])
  put('emergency_phone', ['emergency_phone', 'EmergencyPhone', 'contact_phone', 'ContactPhone'])
  put('emergency_relation', ['emergency_relation', 'EmergencyRelation', 'jj_user_gx', 'JJUserGx'])
  put('timezone', ['timezone', 'Timezone'])
  put('map_privacy', ['map_privacy', 'MapPrivacy', 'location_privacy', 'LocationPrivacy'], toNum)
  put('sign_log_detail', ['sign_log_detail', 'SignLogDetail', 'signlog_detail', 'SignlogDetail'], toNum)
  put('allow_notice', ['allow_notice', 'AllowNotice'], toNum)
  put('ai_coach', ['ai_coach', 'AiCoach'], toNum)
  put('th_affect', ['th_affect', 'ThAffect'], toNum)

  put('height', ['height', 'Height'], toNum)
  put('weight', ['weight', 'Weight'], toNum)
  put('min_rate', ['min_rate', 'MinRate'], toNum)
  put('max_rate', ['max_rate', 'MaxRate'], toNum)
  put('run_force', ['run_force', 'RunForce'], toNum)
  put('goal_m', ['goal_m', 'GoalM'], toNum)
  put('m', ['m', 'M'], toNum)
  put('goal_t', ['goal_t', 'GoalT'], toNum)
  put('t', ['t', 'T'], toNum)
  put('t_pace', ['t_pace', 'TPace'], toNum)
  put('critical_power', ['critical_power', 'CriticalPower'], toNum)
  put('ftp', ['ftp', 'Ftp'], toNum)
  put('max_rate_ride', ['max_rate_ride', 'MaxRateRide'], toNum)
  put('lt_ride', ['lt_ride', 'LtRide'], toNum)
  put('css', ['css', 'Css'], toNum)
  put('max_rate_swim', ['max_rate_swim', 'MaxRateSwim'], toNum)

  return out as OpenProfileResponse
}

function normalizePlan(raw: Record<string, unknown>): OpenPlanRow {
  const pick = (k: string, K: string) => raw[k] ?? raw[K]
  return {
    id: Number(pick('id', 'Id') ?? 0),
    game_task_user_id: Number(pick('game_task_user_id', 'GameTaskUserId') ?? 0),
    game_id: Number(pick('game_id', 'GameId') ?? 0),
    section_id: Number(pick('section_id', 'SectionId') ?? 0),
    task_id: Number(pick('task_id', 'TaskId') ?? 0),
    user_id: Number(pick('user_id', 'UserId') ?? 0),
    title: String(pick('title', 'Title') ?? ''),
    name: String(pick('name', 'Name') ?? ''),
    description: String(pick('description', 'Description') ?? ''),
    start: String(pick('start', 'Start') ?? ''),
    end: String(pick('end', 'End') ?? ''),
    start_time: Number(pick('start_time', 'StartTime') ?? 0),
    end_time: Number(pick('end_time', 'EndTime') ?? 0),
    type: String(pick('type', 'Type') ?? ''),
    weight: String(pick('weight', 'Weight') ?? ''),
    sports: Number(pick('sports', 'Sports') ?? 1),
    status: Number(pick('status', 'Status') ?? 1),
    content: String(pick('content', 'Content') ?? ''),
    task_content: String(pick('task_content', 'TaskContent') ?? ''),
  }
}

// ─── Open API ────────────────────────────────────────────────────────────

export const openApi = {
  /** 获取活动列表（session 缓存 90s + 写入本地 DB） */
  async getActivities(
    params: ActivityQueryParams = {},
    options: { persist?: boolean } = {}
  ): Promise<ActivityListResponse> {
    const cacheKey = 'activities_' + JSON.stringify(params)
    const cached = cacheGet<ActivityListResponse>(cacheKey)
    if (cached) return cached

    const res = await getClient().get('/api/open/activity', { params })
    const data = res.data?.data ?? res.data
    const list = (data?.list ?? data?.List ?? []).map(normalizeActivity)
    const result: ActivityListResponse = {
      list: list as any,
      total: data?.total ?? data?.Total ?? 0,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    }
    cacheSet(cacheKey, result)
    // Write-through to local DB — awaited so Analysis page can read immediately after
    if (options.persist !== false) {
      await saveActivities(result.list).catch(() => {})
    }
    return result
  },

  /**
   * 获取活动详情 — 优先读本地 DB
   * mode='overview'：快速加载（record=null，含 lap/session）
   * mode='detailed'：完整数据（含 GPS 轨迹/时序，较慢）
   */
  async getActivityDetail(
    id: number,
    mode: 'overview' | 'detailed' = 'overview',
  ): Promise<DBActivityFit | null> {
    const cached = await db.activity_fits.get(id)

    // DB 命中：overview 模式直接返回；detailed 模式需要有完整 record
    if (cached) {
      if (mode === 'overview') return cached
      if (mode === 'detailed' && cached.has_detailed) return cached
    }

    try {
      const res = await getClient().get('/api/open/activity/detail', {
        params: { id, mode },
      })
      const data = res.data?.data ?? res.data
      if (!data) return cached ?? null   // 返回已有的 overview（如有）

      const fit: DBActivityFit = {
        id,
        record: data.record ?? null,
        lap: data.lap ?? data.Lap ?? [],
        session: data.session ?? data.Session ?? null,
        has_detailed: mode === 'detailed',
        synced_at: Date.now(),
      }
      await saveActivityFit(id, fit, mode === 'detailed')
      return fit
    } catch {
      return cached ?? null  // 网络失败时返回已缓存的 overview（如有）
    }
  },

  /** @deprecated 使用 getActivityDetail 代替 */
  async getActivityFitJson(id: number): Promise<DBActivityFit | null> {
    return this.getActivityDetail(id, 'detailed')
  },

  /** 获取用户 profile（同时写入本地 DB） */
  async getProfile(force = false): Promise<OpenProfileResponse> {
    const cached = !force ? cacheGet<OpenProfileResponse>('profile') : null
    if (cached) return cached

    // 先读本地 DB 作为兜底（接口失败时仍可展示）
    const local = await db.profile.get(1)
    try {
      const res = await getClient().get('/api/open/profile')
      const data = normalizeProfile((res.data?.data ?? res.data) as Record<string, unknown>)
      // 合并：服务端数据覆盖本地，保留本地已有但服务端未返回的扩展字段
      const merged = { ...(local?.data ?? {}), ...(data ?? {}) } as OpenProfileResponse
      cacheSet('profile', merged)
      await saveProfile(merged).catch(() => {})
      return merged
    } catch {
      if (local?.data) {
        cacheSet('profile', local.data)
        return local.data
      }
      throw new Error('Failed to load profile')
    }
  },

  async updateProfile(payload: UpdateOpenProfilePayload): Promise<OpenProfileResponse> {
    const local = await db.profile.get(1)
    const base = (local?.data ?? {}) as Record<string, unknown>
    const optimistic = { ...base, ...payload } as OpenProfileResponse
    // 先本地保存，保证 UI 立即显示
    await saveProfile(optimistic).catch(() => {})
    try {
      const res = await getClient().put('/api/open/profile', payload)
      sessionStorage.removeItem('likes_cache_profile')
      const data = normalizeProfile((res.data?.data ?? res.data) as Record<string, unknown>)
      const merged = { ...optimistic, ...(data ?? {}) } as OpenProfileResponse
      await saveProfile(merged).catch(() => {})
      cacheSet('profile', merged)
      return merged
    } catch {
      cacheSet('profile', optimistic)
      return optimistic
    }
  },

  async getLinkedLogins(): Promise<LinkedLoginsResponse> {
    const cached = cacheGet<LinkedLoginsResponse>('linkedLogins')
    if (cached) return cached

    const res = await getClient().get('/api/open/linked-logins')
    const data = res.data?.data ?? res.data
    cacheSet('linkedLogins', data)
    return data
  },

  async getPlans(params: { start?: string; game_id?: number } = {}): Promise<OpenPlansResponse> {
    const res = await getClient().get('/api/open/plans', { params })
    const data = res.data?.data ?? res.data
    const rows = ((data?.rows ?? data?.Rows ?? []) as Record<string, unknown>[]).map(normalizePlan)
    const total = Number(data?.total ?? data?.Total ?? rows.length)
    return { total, rows }
  },

  async syncPlansToLocal(params: { start?: string; game_id?: number } = {}): Promise<number> {
    const planRes = await this.getPlans(params)
    await savePlans(planRes.rows)
    return planRes.rows.length
  },

  async pushPlans(payload: OpenPushPlansPayload): Promise<OpenPushPlansResponse> {
    const res = await getClient().post('/api/open/plans/push', payload)
    return (res.data?.data ?? res.data) as OpenPushPlansResponse
  },
}
