type Translate = (key: string) => string

type ApiErrorScene =
  | 'generic'
  | 'activityList'
  | 'activityDetail'
  | 'plans'
  | 'plansPush'
  | 'profile'
  | 'initSync'

function toStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function pickBackendMessage(error: any): string {
  const data = error?.response?.data
  return (
    toStr(data?.message) ||
    toStr(data?.msg) ||
    toStr(data?.error) ||
    toStr(data?.detail) ||
    ''
  )
}

function lower(s: string): string {
  return String(s || '').toLowerCase()
}

export function resolveApiErrorMessage(
  error: unknown,
  t: Translate,
  scene: ApiErrorScene = 'generic'
): string {
  const e: any = error || {}
  const status = Number(e?.response?.status || 0)
  const rawMessage = toStr(e?.message)
  const backendMessage = pickBackendMessage(e)
  const msg = `${rawMessage} ${backendMessage}`
  const msgLower = lower(msg)

  if (msgLower.includes('invalid_date_range')) return t('api_err_activity_invalid_date')
  if (msgLower.includes('date_range_exceeds_30_days')) return t('api_err_activity_range')

  if (!status) {
    if (msgLower.includes('network') || msgLower.includes('timeout')) return t('api_err_network')
    return t('api_err_unknown')
  }

  if (status === 401) return t('api_err_401')
  if (status === 403) {
    if (scene === 'plansPush' || scene === 'plans') return t('api_err_plans_push_permission')
    return t('api_err_403')
  }
  if (status === 404) {
    if (scene === 'activityDetail') return t('api_err_activity_detail_404')
    return t('api_err_404')
  }
  if (status === 429) {
    if (scene === 'activityList' || scene === 'initSync') return t('api_err_429_activity')
    return t('api_err_429')
  }
  if (status >= 500) return t('api_err_500')

  if (status === 400) {
    if (scene === 'activityList' || scene === 'initSync') {
      if (
        msgLower.includes('30') ||
        msgLower.includes('31') ||
        msgLower.includes('range') ||
        msg.includes('日期范围')
      ) {
        return t('api_err_activity_range')
      }
      return t('api_err_activity_invalid_date')
    }

    if (scene === 'plansPush') {
      if (msg.includes('需传 game_id') || msgLower.includes('game_id')) return t('api_err_plans_push_group_required')
      if (msg.includes('群组不存在')) return t('api_err_plans_push_group_not_found')
      if (msg.includes('创建者或教练') || msg.includes('无权') || msgLower.includes('coach')) return t('api_err_plans_push_permission')
      if (msg.includes('非该群组成员') || msg.includes('成员')) return t('api_err_plans_push_membership')
      if (msg.includes('user_ids 不能为空') || msgLower.includes('user_ids')) return t('api_err_plans_push_user_ids_empty')
      return t('api_err_400')
    }

    if (scene === 'profile') return t('api_err_profile_validation')
    return t('api_err_400')
  }

  return t('api_err_unknown')
}

