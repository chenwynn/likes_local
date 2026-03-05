export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
}

export const CHART_COLORS = [
  '#3874CB', '#14C9C9', '#00A6FB', '#F91919',
  '#FFB800', '#17C13E', '#7B68EE', '#FF8C00',
]

export const RUN_TYPE_MAP: Record<number, string> = {
  1: '跑步',
  2: '骑行',
  3: '间歇跑',
  4: '长距离跑',
  5: '游泳',
  6: '比赛',
  10: '力量',
  254: '其他',
}

export const RUN_TYPE_COLORS: Record<number, string> = {
  1: '#3874CB',
  2: '#14C9C9',
  3: '#F91919',
  4: '#00A6FB',
  5: '#17C13E',
  6: '#FFB800',
  10: '#9C27B0',
  254: '#757575',
}

export const RUN_TYPE_ICONS: Record<number, string> = {
  1: 'mdi-run',
  2: 'mdi-bike',
  3: 'mdi-run',
  4: 'mdi-run',
  5: 'mdi-swim',
  6: 'mdi-run',
  10: 'mdi-weight-lifter',
  254: 'mdi-dumbbell',
}

export const RELATED_TYPE_MAP: Record<string, string> = {
  LIKES: 'LIKES',
  CodoonRoute: '咕咚',
  EdooonLocation: '益动',
  TulipFeed: '郁金香',
  LikesApp: '趣跑APP',
  HuaweiFeed: '华为运动健康',
  CorosFeed: '高驰',
  SuuntoFeed: '颂拓',
  PolarFeed: '博能',
  HuamiFeed: '华米',
  GarminFeed: 'Garmin(国际)',
  GarminCnFeed: 'Garmin(中国)',
  StravaFeed: 'Strava',
  AppleFeed: '苹果健康',
  WxApp: '手动创建',
}

export const COMMON_TIMEZONES = [
  { value: 'Asia/Shanghai', label: '中国 (UTC+8)' },
  { value: 'Asia/Hong_Kong', label: '香港 (UTC+8)' },
  { value: 'Asia/Taipei', label: '台北 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '东京 (UTC+9)' },
  { value: 'Asia/Seoul', label: '首尔 (UTC+9)' },
  { value: 'Europe/London', label: '伦敦 (UTC+0/+1)' },
  { value: 'Europe/Paris', label: '巴黎 (UTC+1/+2)' },
  { value: 'Europe/Berlin', label: '柏林 (UTC+1/+2)' },
  { value: 'America/New_York', label: '纽约 (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: '洛杉矶 (UTC-8/-7)' },
  { value: 'America/Chicago', label: '芝加哥 (UTC-6/-5)' },
  { value: 'Australia/Sydney', label: '悉尼 (UTC+10/+11)' },
  { value: 'UTC', label: 'UTC' },
]

export const STORAGE_KEYS = {
  API_KEY: 'likes_api_key',
  API_BASE_URL: 'likes_api_base_url',
  APP_PASSWORD: 'likes_app_password',
  APP_UNLOCKED: 'likes_app_unlocked',
  APP_NAME: 'likes_app_name',
  API_HINT_SHOWN: 'likes_api_hint_shown',
}
