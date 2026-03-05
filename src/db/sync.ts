/**
 * 后台同步引擎
 *
 * 活动列表接口：每个 API Key 每 1 分钟最多 1 次（429 超限）
 * 策略：
 *  - 每次同步获取一页（100条），间隔 62 秒后再取下一页
 *  - 已存入 DB 的直接跳过（幂等）
 *  - 同步状态写入 sync_meta：next_page / total / last_sync_at / is_complete
 */
import { ref, readonly } from 'vue'
import { openApi } from '@/services/api'
import { db, saveActivities, getSyncMeta, setSyncMeta } from '@/db'
import type { ActivityRecord } from '@/types'

const PAGE_SIZE = 100
const RATE_LIMIT_MS = 62_000   // 62 秒，略超 1 分钟

export interface SyncState {
  running: boolean
  total: number | null
  synced: number
  nextPage: number
  isComplete: boolean
  lastSyncAt: number | null
  error: string | null
}

const state = ref<SyncState>({
  running: false,
  total: null,
  synced: 0,
  nextPage: 1,
  isComplete: false,
  lastSyncAt: null,
  error: null,
})

export const syncState = readonly(state)

let syncTimer: ReturnType<typeof setTimeout> | null = null
let abortFlag = false
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 初始化：从 DB 读取上次同步状态 */
export async function initSync(): Promise<void> {
  const meta = await getSyncMeta<{
    next_page: number
    total: number | null
    is_complete: boolean
    last_sync_at: number | null
  }>('activity_sync')
  const count = await db.activities.count()
  if (meta) {
    state.value.nextPage = meta.next_page
    state.value.total = meta.total
    state.value.isComplete = meta.is_complete
    state.value.lastSyncAt = meta.last_sync_at
  }
  state.value.synced = count
}

/** 同步一页，返回是否还有更多 */
async function syncOnePage(): Promise<boolean> {
  const page = state.value.nextPage
  const res = await openApi.getActivities({
    page,
    limit: PAGE_SIZE,
    order_by: 'sign_date',
    order: 'desc',
  })

  const total = res.total
  state.value.total = total

  if (res.list.length > 0) {
    await saveActivities(res.list)
    state.value.synced = await db.activities.count()
  }

  const hasMore = res.list.length === PAGE_SIZE && state.value.synced < total
  const nextPage = hasMore ? page + 1 : page
  const isComplete = !hasMore

  state.value.nextPage = nextPage
  state.value.isComplete = isComplete
  state.value.lastSyncAt = Date.now()

  await setSyncMeta('activity_sync', {
    next_page: nextPage,
    total,
    is_complete: isComplete,
    last_sync_at: Date.now(),
  })

  return hasMore
}

/** 开始/继续后台同步（每页间隔 62 秒） */
export async function startSync(): Promise<void> {
  if (state.value.running) return
  abortFlag = false
  state.value.running = true
  state.value.error = null

  const run = async () => {
    if (abortFlag) {
      state.value.running = false
      return
    }
    try {
      const hasMore = await syncOnePage()
      if (hasMore && !abortFlag) {
        syncTimer = setTimeout(run, RATE_LIMIT_MS)
      } else {
        state.value.running = false
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      state.value.error = msg
      // 429 速率限制：等待后重试
      if (msg.includes('429') || (e as any)?.response?.status === 429) {
        syncTimer = setTimeout(run, RATE_LIMIT_MS)
      } else {
        state.value.running = false
      }
    }
  }

  await run()
}

/** 停止同步 */
export function stopSync(): void {
  abortFlag = true
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }
  state.value.running = false
}

/** 重置同步（从第 1 页重新开始）*/
export async function resetSync(): Promise<void> {
  stopSync()
  await db.activities.clear()
  await db.analysis_detail.clear()
  await setSyncMeta('activity_sync', {
    next_page: 1,
    total: null,
    is_complete: false,
    last_sync_at: null,
  })
  state.value.nextPage = 1
  state.value.total = null
  state.value.synced = 0
  state.value.isComplete = false
  state.value.lastSyncAt = null
}

/** 只取第一页（快速首次同步，让 Analysis 有数据显示） */
export async function quickSync(): Promise<void> {
  if (state.value.running) return
  const count = await db.activities.count()
  if (count > 0) return   // 已有数据，不重复
  state.value.running = true
  state.value.error = null
  try {
    await syncOnePage()
  } catch (e: unknown) {
    state.value.error = e instanceof Error ? e.message : String(e)
  } finally {
    state.value.running = false
  }
}

export async function syncActivitiesInRange(
  startDate: string,
  endDate: string
): Promise<{ fetched: number; inserted: number; skipped: number }> {
  if (state.value.running) {
    return { fetched: 0, inserted: 0, skipped: 0 }
  }
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('invalid_date_range')
  }
  const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
  if (days > 30) {
    throw new Error('date_range_exceeds_30_days')
  }

  abortFlag = false
  state.value.running = true
  state.value.error = null

  let page = 1
  let fetched = 0
  let inserted = 0
  let skipped = 0

  try {
    while (!abortFlag) {
      try {
        const res = await openApi.getActivities(
          {
            page,
            limit: PAGE_SIZE,
            order_by: 'sign_date',
            order: 'desc',
            start_date: startDate,
            end_date: endDate,
          },
          { persist: false }
        )
        state.value.total = res.total

        const rows = (res.list ?? []) as ActivityRecord[]
        fetched += rows.length
        if (rows.length > 0) {
          const ids = rows.map((r) => Number(r.id))
          const existing = await db.activities.bulkGet(ids)
          const saveRows: ActivityRecord[] = []
          rows.forEach((row, idx) => {
            const isDuplicate = Number(row.overlap) === 1 || Boolean(existing[idx])
            if (isDuplicate) {
              skipped += 1
              return
            }
            saveRows.push(row)
          })
          if (saveRows.length) {
            await saveActivities(saveRows)
            inserted += saveRows.length
            state.value.synced = await db.activities.count()
          }
        }

        const hasMore = rows.length === PAGE_SIZE && page * PAGE_SIZE < Number(res.total || 0)
        if (!hasMore) break
        page += 1
        await sleep(RATE_LIMIT_MS)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        state.value.error = msg
        if (msg.includes('429') || (e as any)?.response?.status === 429) {
          await sleep(RATE_LIMIT_MS)
          continue
        }
        throw e
      }
    }
  } finally {
    state.value.running = false
    state.value.lastSyncAt = Date.now()
    state.value.isComplete = true
    state.value.synced = await db.activities.count()
  }

  return { fetched, inserted, skipped }
}
