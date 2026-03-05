import Dexie, { type Table } from 'dexie'
import type { ActivityRecord, OpenProfileResponse, OpenPlanRow, RunCourseLocal } from '@/types'

/** 用户信息 */
export interface DBProfile {
  id: number          // 始终为 1（单条记录）
  data: OpenProfileResponse
  synced_at: number   // Unix ms
}

/** 运动记录（与后端 activity 列表一致） */
export interface DBActivity extends ActivityRecord {
  synced_at: number
}

/** 运动详细数据（来自 /api/open/activity/detail） */
export interface DBActivityFit {
  id: number           // activity_id
  /** mode=overview 时为 null；mode=detailed 时含完整 GPS/时序数据 */
  record?: { key: string[]; data: unknown[][] } | null
  lap?: unknown[]
  session?: unknown
  /** 是否已缓存完整详细数据（含 GPS） */
  has_detailed: boolean
  synced_at: number
}

/**
 * 运动数据详细分析结果
 * 每条对应一条 activity，存储客户端计算出的训练指标。
 */
export interface DBAnalysisDetail {
  id: number           // activity_id
  sign_date: number    // Unix timestamp（冗余，便于按日期查询）
  run_type: number
  week_key: string     // 如 "2025-W10"
  month_key: string    // 如 "2025-03"
  year: number
  run_km: number
  run_time: number     // 秒
  run_pace: number     // 秒/km（仅跑步有意义）
  avg_heart: number
  tss: number
  run_force: number
  total_ascent: number
  avg_power: number
  avg_cadence: number
  overlap: number
  aerobic_time: number
  hybrid_time: number
  velocity_time: number
  /** 有氧时间占比 0~1 */
  aerobic_pct: number
  /** 混氧时间占比 0~1 */
  hybrid_pct: number
  /** 无氧时间占比 0~1 */
  anaerobic_pct: number
  computed_at: number
}

/** 同步状态元信息 */
export interface DBSyncMeta {
  key: string
  value: unknown
}

/** 个人日历计划（来自 /api/open/plans） */
export interface DBGameTaskUser extends OpenPlanRow {
  synced_at: number
}

/** 我的课程（本地创建/编辑） */
export interface DBRunCourse extends RunCourseLocal {}

export interface DBBackupSnapshot {
  profile: DBProfile[]
  activities: DBActivity[]
  activity_fits: DBActivityFit[]
  analysis_detail: DBAnalysisDetail[]
  sync_meta: DBSyncMeta[]
  game_task_user: DBGameTaskUser[]
  runcourse: DBRunCourse[]
}

export interface DBBackup {
  id?: number
  version: string
  created_at: number
  restored_at?: number | null
  summary: {
    profile: number
    activities: number
    activity_fits: number
    analysis_detail: number
    sync_meta: number
    game_task_user: number
    runcourse: number
  }
  snapshot: DBBackupSnapshot
}

class LikesLocalDB extends Dexie {
  profile!: Table<DBProfile, number>
  activities!: Table<DBActivity, number>
  activity_fits!: Table<DBActivityFit, number>
  analysis_detail!: Table<DBAnalysisDetail, number>
  sync_meta!: Table<DBSyncMeta, string>
  game_task_user!: Table<DBGameTaskUser, number>
  runcourse!: Table<DBRunCourse, number>
  backups!: Table<DBBackup, number>

  constructor() {
    super('likes_local_db')
    this.version(1).stores({
      profile: 'id',
      activities: 'id, sign_date, run_type, overlap, synced_at',
      activity_fits: 'id, synced_at',
      analysis_detail: 'id, sign_date, run_type, week_key, month_key, year, overlap',
      sync_meta: 'key',
    })
    this.version(2).stores({
      profile: 'id',
      activities: 'id, sign_date, run_type, overlap, synced_at',
      activity_fits: 'id, synced_at',
      analysis_detail: 'id, sign_date, run_type, week_key, month_key, year, overlap',
      sync_meta: 'key',
      game_task_user: 'id, start, end, start_time, end_time, synced_at',
      runcourse: 'id, type, weight, sports, updated_at',
    })
    this.version(3).stores({
      profile: 'id',
      activities: 'id, sign_date, run_type, overlap, synced_at',
      activity_fits: 'id, synced_at',
      analysis_detail: 'id, sign_date, run_type, week_key, month_key, year, overlap',
      sync_meta: 'key',
      game_task_user: 'id, start, end, start_time, end_time, synced_at',
      runcourse: 'id, type, weight, sports, updated_at',
      backups: '++id, created_at, version, restored_at',
    })
  }
}

export const db = new LikesLocalDB()

// ─── helpers ────────────────────────────────────────────────────────────────

/** 从 activity 计算 analysis_detail 字段 */
export function buildAnalysisDetail(a: ActivityRecord): DBAnalysisDetail {
  const d = new Date((Number(a.sign_date) || 0) * 1000)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  // ISO week number
  const jan4 = new Date(year, 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1)
  const weekNum = Math.ceil(((d.getTime() - startOfWeek1.getTime()) / 86400000 + 1) / 7)
  const week_key = `${year}-W${String(weekNum).padStart(2, '0')}`
  const month_key = `${year}-${String(month).padStart(2, '0')}`

  const totalZone = (Number(a.aerobic_time) || 0) + (Number(a.hybrid_time) || 0) + (Number(a.velocity_time) || 0)
  const aerobic_pct = totalZone > 0 ? (Number(a.aerobic_time) || 0) / totalZone : 0
  const hybrid_pct = totalZone > 0 ? (Number(a.hybrid_time) || 0) / totalZone : 0
  const anaerobic_pct = totalZone > 0 ? (Number(a.velocity_time) || 0) / totalZone : 0

  return {
    id: Number(a.id),
    sign_date: Number(a.sign_date) || 0,
    run_type: Number(a.run_type) || 254,
    week_key,
    month_key,
    year,
    run_km: Number(a.run_km) || 0,
    run_time: Number(a.run_time) || 0,
    run_pace: Number(a.run_pace) || 0,
    avg_heart: Number(a.avg_heart) || 0,
    tss: Number(a.tss) || 0,
    run_force: Number(a.run_force) || 0,
    total_ascent: Number(a.total_ascent) || 0,
    avg_power: Number(a.avg_power) || 0,
    avg_cadence: Number(a.avg_cadence) || 0,
    overlap: Number(a.overlap) || 0,
    aerobic_time: Number(a.aerobic_time) || 0,
    hybrid_time: Number(a.hybrid_time) || 0,
    velocity_time: Number(a.velocity_time) || 0,
    aerobic_pct,
    hybrid_pct,
    anaerobic_pct,
    computed_at: Date.now(),
  }
}

/** 批量写入 activities + analysis_detail（幂等，用 bulkPut） */
export async function saveActivities(activities: ActivityRecord[]): Promise<void> {
  if (!activities.length) return
  const now = Date.now()
  const dbRows = activities.map(a => ({ ...a, synced_at: now } as DBActivity))
  const analysisRows = activities.map(a => buildAnalysisDetail(a))
  await db.transaction('rw', db.activities, db.analysis_detail, async () => {
    await db.activities.bulkPut(dbRows)
    await db.analysis_detail.bulkPut(analysisRows)
  })
}

/** 写入 profile */
export async function saveProfile(data: OpenProfileResponse): Promise<void> {
  await db.profile.put({ id: 1, data, synced_at: Date.now() })
}

/** 写入 activity 详情（overview 或 detailed） */
export async function saveActivityFit(
  id: number,
  data: { record?: DBActivityFit['record']; lap?: unknown[]; session?: unknown },
  hasDetailed = false,
): Promise<void> {
  await db.activity_fits.put({ id, ...data, has_detailed: hasDetailed, synced_at: Date.now() })
}

/** 读取 sync meta */
export async function getSyncMeta<T>(key: string): Promise<T | null> {
  const row = await db.sync_meta.get(key)
  return row ? (row.value as T) : null
}

export async function setSyncMeta(key: string, value: unknown): Promise<void> {
  await db.sync_meta.put({ key, value })
}

export async function savePlans(rows: OpenPlanRow[]): Promise<void> {
  const now = Date.now()
  const list = rows.map((r) => ({ ...r, id: Number(r.id), synced_at: now } as DBGameTaskUser))
  await db.game_task_user.bulkPut(list)
}

export async function saveRunCourse(
  row: Omit<DBRunCourse, 'id' | 'created_at' | 'updated_at'> & { id?: number }
): Promise<number> {
  const now = Date.now()
  if (row.id) {
    const prev = await db.runcourse.get(row.id)
    await db.runcourse.put({
      ...row,
      id: row.id,
      updated_at: now,
      created_at: prev?.created_at ?? now,
    } as DBRunCourse)
    return row.id
  }
  const id = now
  await db.runcourse.put({ ...row, id, created_at: now, updated_at: now } as DBRunCourse)
  return id
}

function makeBackupVersion(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `backup-${y}${m}${day}-${hh}${mm}${ss}`
}

export async function hasAnyLocalData(): Promise<boolean> {
  const [profile, activities, fits, analysis, plans, courses] = await Promise.all([
    db.profile.count(),
    db.activities.count(),
    db.activity_fits.count(),
    db.analysis_detail.count(),
    db.game_task_user.count(),
    db.runcourse.count(),
  ])
  return profile + activities + fits + analysis + plans + courses > 0
}

export async function createLocalBackup(): Promise<DBBackup> {
  const [
    profile,
    activities,
    activity_fits,
    analysis_detail,
    sync_meta,
    game_task_user,
    runcourse,
  ] = await Promise.all([
    db.profile.toArray(),
    db.activities.toArray(),
    db.activity_fits.toArray(),
    db.analysis_detail.toArray(),
    db.sync_meta.toArray(),
    db.game_task_user.toArray(),
    db.runcourse.toArray(),
  ])

  const created_at = Date.now()
  const backup: DBBackup = {
    version: makeBackupVersion(created_at),
    created_at,
    restored_at: null,
    summary: {
      profile: profile.length,
      activities: activities.length,
      activity_fits: activity_fits.length,
      analysis_detail: analysis_detail.length,
      sync_meta: sync_meta.length,
      game_task_user: game_task_user.length,
      runcourse: runcourse.length,
    },
    snapshot: {
      profile,
      activities,
      activity_fits,
      analysis_detail,
      sync_meta,
      game_task_user,
      runcourse,
    },
  }
  const id = await db.backups.add(backup)
  return { ...backup, id }
}

export async function listLocalBackups(): Promise<DBBackup[]> {
  return db.backups.orderBy('created_at').reverse().toArray()
}

export async function restoreLocalBackup(backupId: number): Promise<void> {
  const backup = await db.backups.get(backupId)
  if (!backup) throw new Error('Backup not found')
  const s = backup.snapshot
  await db.transaction(
    'rw',
    db.profile,
    db.activities,
    db.activity_fits,
    db.analysis_detail,
    db.sync_meta,
    db.game_task_user,
    db.runcourse,
    db.backups,
    async () => {
      await db.profile.clear()
      await db.activities.clear()
      await db.activity_fits.clear()
      await db.analysis_detail.clear()
      await db.sync_meta.clear()
      await db.game_task_user.clear()
      await db.runcourse.clear()
      if (s.profile.length) await db.profile.bulkPut(s.profile)
      if (s.activities.length) await db.activities.bulkPut(s.activities)
      if (s.activity_fits.length) await db.activity_fits.bulkPut(s.activity_fits)
      if (s.analysis_detail.length) await db.analysis_detail.bulkPut(s.analysis_detail)
      if (s.sync_meta.length) await db.sync_meta.bulkPut(s.sync_meta)
      if (s.game_task_user.length) await db.game_task_user.bulkPut(s.game_task_user)
      if (s.runcourse.length) await db.runcourse.bulkPut(s.runcourse)
      await db.backups.update(backupId, { restored_at: Date.now() })
    }
  )
}

export type { Dexie }
