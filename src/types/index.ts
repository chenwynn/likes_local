export interface ActivityRecord {
  id: number
  sign_date: number
  created_time: number
  run_type: number
  run_km: number
  run_time: number
  run_pace: number
  avg_heart: number
  max_heart: number
  total_ascent: number
  tss: number
  run_force: number
  overlap: number
  related_type: string
  avg_cadence: number
  avg_stride: number
  avg_contact: number
  avg_fly: number
  avg_vertical: number
  avg_vertical_ratio: number
  avg_power: number
  temperature: number
  aerobic_time: number
  hybrid_time: number
  velocity_time: number
  score: number
  analysis: unknown
  data_source_path: string
  [key: string]: unknown
}

export interface ActivityListResponse {
  list: ActivityRecord[]
  total: number
  page: number
  limit: number
}

export interface ActivityQueryParams {
  page?: number
  limit?: number
  order_by?: string
  order?: 'asc' | 'desc'
  start_date?: string
  end_date?: string
  run_type?: number
  related_type?: string
  min_distance?: number
  max_distance?: number
  min_run_time?: number
  max_run_time?: number
  min_total_ascent?: number
  max_total_ascent?: number
  min_temperature?: number
  max_temperature?: number
  min_avg_heart?: number
  max_avg_heart?: number
  min_tss?: number
  max_tss?: number
}

export interface OpenProfileResponse {
  user_name: string
  avatar: string
  slogan: string
  emergency_contact: string
  emergency_phone: string
  emergency_relation: string
  timezone: string
  map_privacy: number
  sign_log_detail: number
  allow_notice: number
  ai_coach: number
  th_affect: number
  height?: number
  weight?: number
  min_rate?: number
  max_rate?: number
  run_force?: number
  goal_m?: number
  m?: number
  goal_t?: number
  t?: number
  t_pace?: number
  critical_power?: number
  ftp?: number
  max_rate_ride?: number
  lt_ride?: number
  css?: number
  max_rate_swim?: number
  [key: string]: unknown
}

export interface UpdateOpenProfilePayload {
  user_name?: string
  slogan?: string
  emergency_contact?: string
  emergency_phone?: string
  emergency_relation?: string
  timezone?: string
  map_privacy?: number
  sign_log_detail?: number
  allow_notice?: number
  ai_coach?: number
  th_affect?: number
  height?: number
  weight?: number
  min_rate?: number
  max_rate?: number
  run_force?: number
  goal_m?: number
  m?: number
  goal_t?: number
  t?: number
  t_pace?: number
  critical_power?: number
  ftp?: number
  max_rate_ride?: number
  lt_ride?: number
  css?: number
  max_rate_swim?: number
  [key: string]: unknown
}

export interface LinkedLogin {
  provider: string
  bound: boolean
}

export interface LinkedLoginsResponse {
  wechat: boolean
  apple: boolean
  google: boolean
}

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface StatsData {
  totalDistance: number
  totalTime: number
  totalActivities: number
  avgHeartRate: number
  avgPace: number
  avgScore: number
  bestDistance: number
  bestTime: number
  trend: Array<{
    date: string
    distance: number
    time: number
    heartRate: number
    pace: number
  }>
}

export interface OpenPlanRow {
  id: number
  game_task_user_id: number
  game_id: number
  section_id: number
  task_id: number
  user_id: number
  title: string
  name: string
  description: string
  start: string
  end: string
  start_time: number
  end_time: number
  type?: string
  weight?: string
  sports?: number
  status?: number
  content?: string
  task_content?: string
  [key: string]: unknown
}

export interface OpenPlansResponse {
  total: number
  rows: OpenPlanRow[]
}

export interface OpenPlanPushItem {
  name: string
  title: string
  start: string
  weight?: string
  type?: string
  description?: string
  sports?: number
  game_id?: number
}

export interface OpenPushPlansPayload {
  plans: OpenPlanPushItem[]
  game_id?: number
  user_ids?: number[]
  overwrite?: boolean
}

export interface OpenPushPlansResultItem {
  index: number
  title: string
  start: string
  status: 'ok' | 'parse_error' | 'validate_error' | 'insert_error'
  message: string
}

export interface OpenPushPlansResponse {
  total: number
  parse_ok: number
  parse_failed: number
  inserted: number
  insert_failed: number
  results: OpenPushPlansResultItem[]
}

export interface PlanEvent extends OpenPlanRow {
  desc?: string
  start_tm?: number
}

export interface RunCourseLocal {
  id: number
  title: string
  name: string
  description: string
  content: string
  type: string
  weight: string
  sports: number
  status: number
  created_at: number
  updated_at: number
}
