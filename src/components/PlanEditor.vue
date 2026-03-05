<template>
  <v-card class="plan-editor" :class="{ 'plan-editor-readonly': props.readOnly }">
    <v-card-title class="d-flex align-center justify-space-between plan-editor-title">
      <span class="text-h6">{{ props.readOnly ? t('calendar_plan_view') : (isNewPlan ? t('plan_new') : t('plan_edit')) }}</span>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- 顶部工具栏（只读时禁用交互） -->
      <div class="editor-toolbar" :class="{ 'editor-toolbar-readonly': props.readOnly }">
        <!-- 运动类型选择 -->
        <div class="toolbar-item">
          <v-icon size="small">mdi-run</v-icon>
          <select v-model="val.type" class="toolbar-select" @change="onTypeChange">
            <option value="run">{{ t('plan_run') }}</option>
            <option value="ride">{{ t('plan_ride') }}</option>
            <option value="swim">{{ t('plan_swim') }}</option>
            <option value="muscle">{{ t('plan_muscle') }}</option>
            <option value="other">{{ t('plan_other') }}</option>
          </select>
        </div>

        <!-- 默认强度类型 -->
        <div class="toolbar-item">
          <v-icon size="small">mdi-speedometer</v-icon>
          <span>{{ t('plan_intensity_type') }}:</span>
          <select v-model="default_intensity" class="toolbar-select">
            <option v-for="item in default_intensity_arr[val.type]" :key="item.value" :value="item.value">
              {{ intensityOptionTitle(item) }}
            </option>
          </select>
        </div>

        <!-- 运动参数 -->
        <div class="toolbar-item sport-params" v-if="val.type === 'run' || val.type === 'ride' || val.type === 'swim'">
          <!-- 跑步参数 -->
          <template v-if="val.type === 'run'">
            <div class="param-input" style="position: relative;">
              <label>{{ t('plan_run_force') }}:</label>
              <div style="display: inline-flex; align-items: center; gap: 2px; position: relative;">
                <input type="number" v-model.number="sportParams.vdot" @change="onVdotChange" />
                <v-icon
                  size="small"
                  class="vdot-help-icon"
                  @mouseenter="showVdotTooltip = true"
                  @mouseleave="showVdotTooltip = false"
                >
                  mdi-help-circle-outline
                </v-icon>
                <div
                  v-if="showVdotTooltip && getVdotTooltip(sportParams.vdot)"
                  class="vdot-tooltip"
                >
                  <div v-html="getVdotTooltip(sportParams.vdot)"></div>
                </div>
              </div>
            </div>
            <div class="param-input">
              <label>{{ t('plan_max_hr') }}:</label>
              <input type="number" v-model.number="sportParams.heartMax" @change="updateLikes" />
            </div>
            <div class="param-input">
              <label>{{ t('plan_rest_hr') }}:</label>
              <input type="number" v-model.number="sportParams.heartMin" @change="updateLikes" />
            </div>
            <div class="param-input param-input-tpace">
              <label>{{ t('plan_threshold_pace') }}:</label>
              <pick-time 
                format="hour-minute-second" 
                v-model="sportParams.tPace" 
                @change="updateLikes"
              />
            </div>
          </template>

          <!-- 骑车参数 -->
          <template v-if="val.type === 'ride'">
            <div class="param-input">
              <label>FTP:</label>
              <input type="number" v-model.number="sportParams.ftp" @change="updateLikes" />
            </div>
            <div class="param-input">
              <label>{{ t('plan_max_hr') }}:</label>
              <input type="number" v-model.number="sportParams.heartMax" @change="updateLikes" />
            </div>
            <div class="param-input">
              <label>{{ t('plan_rest_hr') }}:</label>
              <input type="number" v-model.number="sportParams.heartMin" @change="updateLikes" />
            </div>
          </template>

          <!-- 游泳参数 -->
          <template v-if="val.type === 'swim'">
            <div class="param-input">
              <label>CSS:</label>
              <pick-time 
                format="hour-minute-second" 
                v-model="sportParams.css" 
                @change="updateLikes"
              />
            </div>
            <div class="param-input">
              <label>{{ t('plan_max_hr') }}:</label>
              <input type="number" v-model.number="sportParams.heartMax" @change="updateLikes" />
            </div>
          </template>
        </div>

        <!-- 添加按钮（只读时不显示） -->
        <div v-if="!props.readOnly" class="toolbar-item toolbar-actions">
          <v-btn size="small" color="warning" @click="add_default_lap('com')" prepend-icon="mdi-repeat">
            {{ t('plan_add_interval') }}
          </v-btn>
          <v-btn size="small" color="success" @click="add_default_lap('normal')" prepend-icon="mdi-plus">
            {{ t('plan_add_lap') }}
          </v-btn>
        </div>
      </div>

      <!-- 课表分段列表（参考 addtask_new.vue：标题栏 + 默认折叠，点击展开编辑） -->
      <div class="laps-container">
        <ul class="laps-list">
            <li
              v-for="(item, index) in wp_laps"
              :key="lapKey(item, index)"
              :class="['lap-item', { 'lap-item-expanded': isLapExpanded(index) }]"
              :id="'lap_' + index"
              @dragover.prevent
              @drop.prevent="onLapDrop(index)"
              :data-drop-target="dragOverLapIndex === index ? '1' : '0'"
            >
              <!-- Lap 头部：编号 + 解析名称 + 展开按钮 + 操作按钮 -->
              <div class="lap-header-bar">
                <div class="lap-header-content" @click="toggleLapExpand(index)">
                  <span class="lap-index-badge" :style="{ backgroundColor: item.color || '#28a745' }">
                    {{ index + 1 }}
                  </span>
                  <span class="lap-name-display" :title="getLapName(item, false)">
                    {{ getLapName(item, true) }}
                  </span>
                  <span class="lap-expand-toggle" :class="{ 'expanded': isLapExpanded(index) }">▼</span>
                </div>
                <div v-if="!props.readOnly" class="lap-header-actions" @click.stop>
                  <a @click.stop="copyLap(index)" class="lap-action-btn lap-action-copy" :title="t('plan_copy')">
                    <v-icon size="small">mdi-content-copy</v-icon>
                  </a>
                  <a @click.stop="deleteLap(index)" class="lap-action-btn lap-action-delete" :title="t('plan_delete')">
                    <v-icon size="small">mdi-delete-outline</v-icon>
                  </a>
                  <span
                    class="lap-action-btn lap-action-move plan-drag-handle"
                    :title="t('plan_move')"
                    draggable="true"
                    @dragstart.stop="onLapDragStart(index, $event)"
                    @dragend.stop="onLapDragEnd"
                    @dragenter.prevent.stop="onLapDragEnter(index)"
                  >
                    <v-icon size="small">mdi-drag</v-icon>
                  </span>
                </div>
              </div>
              <!-- Lap 详细内容（点击头部展开/收起） -->
              <div v-show="isLapExpanded(index)" class="lap-body">
                <task-lap 
                  v-if="item.lap_type === 'normal'"
                  :key="'normal-' + lapKey(item, index)"
                  :form="item.val" 
                  :vall="item.val" 
                  :ref="item.ref" 
                  :index="index"
                  :type="item.type" 
                  :id="item.id" 
                  :color="item.color"
                  :lap_type="item.lap_type"
                  :tPace="sportParams.tPace"
                  :likes="likesInstance"
                  :likes-data-version="likesDataVersion"
                  :ftp="sportParams.ftp"
                  :default-intensity="default_intensity"
                  @func="goLap"
                />
                <task-com 
                  v-else-if="item.lap_type === 'com'"
                  :key="'taskcom-' + lapKey(item, index)"
                  :form="item.val" 
                  :index="index"
                  :type="item.type" 
                  :id="item.id" 
                  :color="item.color"
                  :lap_type="item.lap_type"
                  :tPace="sportParams.tPace"
                  :likes="likesInstance"
                  :likes-data-version="likesDataVersion"
                  :ftp="sportParams.ftp"
                  :default-intensity="default_intensity"
                  :focus="true"
                  @func="goLap"
                />
              </div>
            </li>
        </ul>
      </div>

      <!-- 标题和描述 -->
      <v-row dense class="mt-4 plan-editor-form-row">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="val.title"
            :label="t('plan_title')"
            density="compact"
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="val.training_type"
            :items="trainingTypeItems"
            item-title="title"
            item-value="value"
            :label="t('plan_course_type')"
            density="compact"
            variant="outlined"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="val.weight"
            :items="weightItems"
            item-title="name"
            item-value="value"
            :label="t('plan_weight')"
            density="compact"
            variant="outlined"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps" :title="item.raw.name">
                <template #prepend>
                  <span class="weight-dot mr-2" :style="{ backgroundColor: item.raw.color }"></span>
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <span class="weight-dot mr-2" :style="{ backgroundColor: item.raw.color }"></span>
              {{ item.raw.name }}
            </template>
          </v-select>
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="val.description"
            :label="t('plan_desc')"
            rows="2"
            density="compact"
            variant="outlined"
          ></v-textarea>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 计划图表：固定在底部、footer 上方，不随内容滚动；预计统计放在图表容器头部 -->
    <div class="echart-fixed-wrap" v-if="wp_laps.length > 0">
      <div class="echart-stats-header" v-if="val.type == 'run'">
        <span class="echart-stats-item"><v-icon size="small">mdi-clock-outline</v-icon> {{ t('plan_estimated_time') }}: {{ laps_total_time_str }}</span>
        <span class="echart-stats-item"><v-icon size="small">mdi-map-marker-distance</v-icon> {{ t('plan_estimated_distance') }}: {{ total_dist }} KM</span>
        <span class="echart-stats-item"><v-icon size="small">mdi-trending-up</v-icon> {{ t('plan_estimated_intensity') }}: {{ total_tv }}</span>
        <span class="echart-stats-item"><v-icon size="small">mdi-fire</v-icon> {{ t('plan_estimated_load') }}: {{ total_tss }}</span>
      </div>
      <div class="echart-container">
        <!-- 与日历 batch-event-chart 一致：无 gap、柱宽百分比、双 span（上空白+下着色）、同一配色 -->
        <div class="lap-bars-wrapper batch-chart-container">
          <div
            v-for="(barItem, barIdx) in echartBars"
            :key="barIdx"
            :class="['lap-bar-item', 'batch-chart-bar', { 'focuslap': lapfocus === barItem.lapIndex }]"
            :style="planEchartData ? getLapBarStyleFromEchart(barIdx).barStyle : {}"
            :title="getLapBarTooltip(barItem, barIdx)"
            @mouseover="setLapFocus(barItem.lapIndex)"
            @click="toggleLapExpand(barItem.lapIndex)"
          >
            <template v-if="planEchartData">
              <span class="batch-chart-bar-top" :style="{ height: getLapBarStyleFromEchart(barIdx).topHeight }"></span>
              <span class="batch-chart-bar-fill" :style="{ height: getLapBarStyleFromEchart(barIdx).barHeight, backgroundColor: getLapBarStyleFromEchart(barIdx).backgroundColor }"></span>
            </template>
            <div v-else class="lap-bar" :style="{ height: getLapBarHeight(barItem) + '%', backgroundColor: getLapBarColor(barItem) }"></div>
          </div>
        </div>
      </div>
    </div>

    <v-divider></v-divider>

    <v-card-actions class="pa-4">
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="$emit('close')">{{ props.readOnly ? t('calendar_close') : t('plan_cancel') }}</v-btn>
      <v-btn v-if="props.readOnly" color="primary" variant="tonal" @click="$emit('copy')">{{ t('calendar_copy') }}</v-btn>
      <template v-else>
        <v-btn color="primary" variant="elevated" @click="handleSave">{{ t('plan_save') }}</v-btn>
      </template>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, shallowRef, reactive, computed, watch, onMounted } from 'vue'
import TaskLap from './plan-editor/TaskLap.vue'
import TaskCom from './plan-editor/TaskCom.vue'
import LapEchart from './plan-editor/LapEchart.vue'
import PickTime from './plan-editor/PickTime.vue'
import type { PlanEvent } from '@/types'
import { useLocale } from '@/composables/useLocale'
import { useChartColorMode } from '@/composables/useChartColorMode'
import { getChartColorByMode } from '@/utils/chartColor'
import { openApi } from '@/services/api'

// @ts-ignore
import Mylikes from '@/utils/mylikes.js'

const { t, locale } = useLocale()
const { chartColorMode } = useChartColorMode()

interface Props {
  plan?: PlanEvent | null
  /** 只读（教练创建的计划）：仅可查看、复制，不可保存 */
  readOnly?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', plan: PlanEvent): void
  (e: 'copy'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isNewPlan = computed(() => !props.plan?.id)

// 主表单数据（type=运动类型 run/ride/swim；training_type=课程类型 qingsong/xiuxi/...，保存时作为 plan.type）
const val = reactive({
  type: 'run',
  training_type: 'other',
  title: '',
  description: '',
  weight: 'xuanxiu',
  status: 1,
  task_content: '[]'
})

// 运动参数
const sportParams = reactive({
  vdot: 50,
  tPace: 330,
  heartMax: 190,
  heartMin: 60,
  ftp: 200,
  css: 120,
  tsp: 150,
  lthr: 175,
  cp: 180
})

// Mylikes 实例（用 shallowRef 避免被深度代理，否则 Mylikes 内部 setTPace/setHeartMaxMin 等会报 "Receiver must be an instance of class Mylikes"）
const likesInstance = shallowRef<any>(null)
// 跑力值对应配速/成绩数据（runforce.json）
const runforceData = ref<any[]>([])
// 用于让 TaskLap 在 pace_res/heart_res 更新后重新计算 VDOT/HRR 显示
const likesDataVersion = ref(0)
const showVdotTooltip = ref(false)

// 强度类型选项 (与原版 addtask_new.vue 保持一致)
const default_intensity_arr = {
  run: [
    { title: '配速值', value: 'pace_value', code: 'pace+' },
    { title: '配速区间', value: 'pace_vdot', code: 'VDOT+' },
    { title: '阈值配速', value: 'pace_lt', code: 't/' },
    { title: '心率值', value: 'heart_value', code: 'HEART+' },
    { title: '储备心率区间', value: 'heart_hrr', code: 'HRR+' },
    { title: '最大心率百分比', value: 'heart_mhr', code: 'MHR+' },
    { title: '体力百分比', value: 'effort', code: 'EFFORT+' },
    { title: '功率值', value: 'power_value', code: 'POWER+' },
    { title: '阈值功率百分比', value: 'power_cp', code: 'cp/' }
  ],
  ride: [
    { title: '功率百分比', value: 'ftp_area', code: 'FTP/' },
    { title: '功率值', value: 'ftp_value', code: 'FTP+' },
    { title: '最大心率百分比', value: 'heart_mhr', code: 'MHR+' },
    { title: 'LT乳酸阈值心率', value: 'lthr', code: 'LTHR/' },
    { title: '心率值', value: 'heart_value', code: 'HEART+' }
  ],
  swim: [
    { title: '配速区间(CSS)', value: 'css_range', code: 'CSS/' },
    { title: '阈值配速区间(TSP)', value: 'tsp_range', code: 'TSP/' },
    { title: '绝对配速', value: 'css_value', code: 'pace+' },
    { title: '最大心率百分比', value: 'heart_mhr', code: 'MHR+' },
    { title: '心率值', value: 'heart_value', code: 'HEART+' }
  ],
  muscle: [
    { title: '力量训练', value: 'muscle' }
  ],
  other: [
    { title: '卡路里', value: 'calorie' },
    { title: '心率值', value: 'heart_value' },
    { title: '储备心率区间', value: 'heart_hrr' },
    { title: '最大心率百分比', value: 'heart_mhr' }
  ]
}

// 从 localStorage 恢复上次使用的强度类型（直接复制原版逻辑）
const getSavedIntensity = () => {
  const savedIntensity = localStorage.getItem(`addtask_default_intensity_${val.type}`)
  if (savedIntensity) {
    const items = default_intensity_arr[val.type as keyof typeof default_intensity_arr]
    if (items && items.find((item: any) => item.value === savedIntensity)) {
      return savedIntensity
    }
  }
  // 默认值
  switch (val.type) {
    case 'run': return 'pace_value'
    case 'ride': return 'ftp_area'
    case 'swim': return 'css_value'
    case 'muscle': return 'muscle'
    case 'other': return 'calorie'
    default: return 'pace_vdot'
  }
}

const default_intensity = ref(getSavedIntensity())

// 监听强度类型变化，保存到 localStorage（直接复制原版逻辑）
watch(default_intensity, (newVal) => {
  if (newVal) {
    localStorage.setItem(`addtask_default_intensity_${val.type}`, newVal)
  }
})

// 监听运动类型变化，更新默认强度
watch(() => val.type, () => {
  default_intensity.value = getSavedIntensity()
})

// 跑力值变化时，用 runforce 更新 Mylikes.pace_res（配速区间 min/max）
watch(() => sportParams.vdot, (newVal) => {
  if (newVal != null && !isNaN(newVal) && runforceData.value?.length && likesInstance.value) {
    updatePaceResFromVdot(newVal)
  }
})

// 课程类型（对应 plan.type）
const TRAINING_TYPE_MAP: Record<string, string> = {
  qingsong: '轻松跑',
  xiuxi: '休息日',
  e: '有氧训练',
  lsd: '长距离有氧',
  m: '马拉松定速训练',
  t: '乳酸训练',
  i: '间歇训练',
  r: '速度训练',
  ft: '法特莱克训练',
  com: '组合训练',
  ch: '变速训练',
  jili: '肌力训练',
  max: '最大心测试',
  drift: '有氧稳定测试',
  '1': '1.6公里测试',
  '7': '2公里测试',
  '2': '3公里测试',
  '3': '5公里测试',
  '4': '10公里测试',
  '5': '半马测试',
  '6': '全马测试',
  other: '其他'
}
function intensityOptionTitle(item: { value: string; title: string }): string {
  const k = 'plan_intensity_' + item.value
  const v = t(k)
  return v !== k ? v : item.title
}
const trainingTypeItems = computed(() =>
  Object.keys(TRAINING_TYPE_MAP).map((value) => ({ value, title: trainingTypeTitle(value) }))
)
function trainingTypeTitle(value: string): string {
  const k = 'plan_training_' + value
  const v = t(k)
  return v !== k ? v : (TRAINING_TYPE_MAP as Record<string, string>)[value] ?? value
}

// 权重（对应 plan.weight）
const weightItems = computed(() => [
  { value: 'q1', name: t('plan_weight_q1'), color: '#d10e36' },
  { value: 'q2', name: t('plan_weight_q2'), color: '#ce6021' },
  { value: 'q3', name: t('plan_weight_q3'), color: '#3daf58' },
  { value: 'xuanxiu', name: t('plan_weight_xuanxiu'), color: '#135297' }
])

// 分段列表
const wp_laps = ref<any[]>([])

// 图表焦点
const lapfocus = ref<number | null>(null)
const draggingLapIndex = ref<number | null>(null)
const dragOverLapIndex = ref<number | null>(null)

/** 带 repeat 倍率的项：用于总时间/总距离；普通 lap 取 repeat=1，间歇组合(com) 下每个子段取 lap.val.repeat */
const effectiveTrainigLapsWithRepeat = computed(() => {
  const list: Array<{ tl: any; repeat: number }> = []
  wp_laps.value.forEach(lap => {
    if (lap.lap_type === 'com' && lap.val?.laps_com?.length) {
      const repeat = Math.max(1, Number(lap.val.repeat) || 1)
      lap.val.laps_com.forEach((sub: any) => {
        if (sub.val?.trainig_lap) list.push({ tl: sub.val.trainig_lap, repeat })
      })
    } else if (lap.val?.trainig_lap) {
      list.push({ tl: lap.val.trainig_lap, repeat: 1 })
    }
  })
  return list
})

// 计算属性
const laps_total_time = computed(() => {
  let totalSeconds = 0
  const paceSeconds = likesInstance.value ? sportParams.tPace * 1.2 : 0
  effectiveTrainigLapsWithRepeat.value.forEach(({ tl, repeat }) => {
    const unit = tl.unit
    const value = (tl.unit_value || 0) * repeat
    if (unit === 'min') {
      totalSeconds += value * 60
    } else if (unit === 's') {
      totalSeconds += value
    } else if (unit === 'km' && paceSeconds > 0) {
      totalSeconds += value * paceSeconds
    } else if (unit === 'm' && paceSeconds > 0) {
      totalSeconds += (value / 1000) * paceSeconds
    }
  })
  return totalSeconds
})

const laps_total_time_str = computed(() => {
  const seconds = laps_total_time.value
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const total_dist = computed(() => {
  let totalKm = 0
  const paceSeconds = likesInstance.value ? sportParams.tPace * 1.2 : 0
  effectiveTrainigLapsWithRepeat.value.forEach(({ tl, repeat }) => {
    const unit = tl.unit
    const value = (tl.unit_value || 0) * repeat
    if (unit === 'km') {
      totalKm += value
    } else if (unit === 'm') {
      totalKm += value / 1000
    } else if (unit === 'min' && paceSeconds > 0) {
      totalKm += (value * 60) / paceSeconds
    }
  })
  return totalKm.toFixed(2)
})

// 使用 mylikes 的 get_tss_dist_time + training_index 计算预计压力/强度（与 addtask_new 一致，避免 range_min/range_max 单位混用导致数值过大）
const planTaskIndex = computed(() => {
  const mylikes = likesInstance.value
  if (!mylikes || typeof mylikes.get_tss_dist_time !== 'function' || typeof mylikes.training_index !== 'function') return null
  try {
    const taskContent = buildTaskContent()
    if (!taskContent || taskContent.length === 0) return null
    const lap = mylikes.getVltContent(taskContent)
    if (!lap) return null
    const lapData = mylikes.createTaskRunDataLap(lap)
    if (!lapData || !Array.isArray(lapData) || lapData.length === 0) return null
    const task_index = mylikes.get_tss_dist_time(lapData)
    const task_tv = mylikes.training_index(lapData)
    return { task_index, task_tv }
  } catch {
    return null
  }
})

const total_tv = computed(() => {
  const tv = planTaskIndex.value?.task_tv?.allTv
  if (tv != null && !Number.isNaN(Number(tv))) return Math.round(Number(tv))
  return 0
})

const total_tss = computed(() => {
  const tss = planTaskIndex.value?.task_index?.all_tss
  if (tss != null && !Number.isNaN(Number(tss))) return Math.round(Number(tss))
  return 0
})

const wk_laps = computed(() => {
  return wp_laps.value.map((lap, index) => {
    let etime = 600 // 默认10分钟
    if (lap.val?.trainig_lap) {
      const unit = lap.val.trainig_lap.unit
      const value = lap.val.trainig_lap.unit_value || 10
      
      if (unit === 'min') {
        etime = value * 60
      } else if (unit === 's') {
        etime = value
      } else if (unit === 'km') {
        // 根据配速估算时间
        const paceSeconds = sportParams.tPace * 1.2
        etime = value * paceSeconds
      }
    }
    
    return {
      ...lap,
      echart: {
        etime,
        data: generateEchartData(lap)
      }
    }
  })
})

const lap_max_speed = computed(() => 100)

// 展平后的 echart 柱子：普通 lap 1 根，间歇 lap 按 repeat × laps_com 展开为多根（呈现起伏）
const echartBars = computed(() => {
  const bars: Array<{ lap: any; subLap: any; lapIndex: number }> = []
  wp_laps.value.forEach((lap, lapIndex) => {
    if (lap.lap_type === 'normal') {
      bars.push({ lap, subLap: null, lapIndex })
    } else if (lap.lap_type === 'com' && lap.val?.laps_com?.length) {
      const repeat = Math.max(1, lap.val.repeat || 1)
      for (let r = 0; r < repeat; r++) {
        lap.val.laps_com.forEach((sub: any) => {
          bars.push({ lap, subLap: sub, lapIndex })
        })
      }
    } else {
      bars.push({ lap, subLap: null, lapIndex })
    }
  })
  return bars
})

// 使用 Mylikes.getTaskEchart 获取正确的区间颜色和强度（与日历 event 柱状图一致）
const planEchartData = computed(() => {
  if (!likesInstance.value) return null
  try {
    const taskContent = buildTaskContent()
    if (!taskContent || taskContent.length === 0) return null
    const lap = likesInstance.value.getVltContent(taskContent)
    if (!lap) return null
    const lapData = likesInstance.value.createTaskRunDataLap(lap)
    const echartRaw = likesInstance.value.getTaskEchart(lapData)
    if (!echartRaw) return null
    let data: any[] = []
    let maxVal = 1
    if (Array.isArray(echartRaw) && echartRaw.length > 0) {
      data = echartRaw
      maxVal = Math.max(1, ...data.map((item: any) => (item && item[2] != null ? Number(item[2]) : 0)))
    } else if (echartRaw?.data && Array.isArray(echartRaw.data) && echartRaw.data.length > 0) {
      data = echartRaw.data
      maxVal = echartRaw.max ?? Math.max(1, ...data.map((item: any) => (item && item[2] != null ? Number(item[2]) : 0)))
    }
    return { data, max: maxVal }
  } catch (e) {
    return null
  }
})

// 从 Mylikes echart 获取单柱样式（与日历 renderPlanChartHtml 完全一致：配色、宽度、双 span 结构）
function getLapBarStyleFromEchart(barIdx: number): {
  barStyle: Record<string, string>
  topHeight: string
  barHeight: string
  backgroundColor: string
} {
  const echart = planEchartData.value
  const fallback = {
    barStyle: { flex: '1', minWidth: '0' },
    topHeight: '80%',
    barHeight: '20%',
    backgroundColor: 'rgba(158,158,158,0.52)'
  }
  if (!echart?.data?.length || barIdx >= echart.data.length) return fallback
  const item = echart.data[barIdx]
  const max = echart.max || 1
  const speed = (item && item[2] != null) ? Number(item[2]) : (item?.speed != null ? Number(item.speed) : (item?.intensity != null ? Number(item.intensity) : 0))
  const ratio = max > 0 ? speed / max : 0
  const origColor = item?.[8] || item?.color || '#60a5fa'
  const color = getChartColorByMode(chartColorMode.value, ratio, origColor)
  // 与日历一致：柱高为 (speed/max)*100，上空白 100-barHeight
  const barHeightPct = Math.max(0, Math.min(100, Math.floor((speed / max) * 100)))
  const topHeightPct = Math.max(0, Math.min(100, Math.floor(100 - barHeightPct)))
  const widthVal = item?.[6] != null ? Number(item[6]) : (item?.width != null ? Number(item.width) : (100 / echart.data.length))
  const width = widthVal > 0 ? widthVal : (100 / echart.data.length)
  return {
    barStyle: { flex: `0 0 ${width}%`, minWidth: '0' },
    topHeight: topHeightPct + '%',
    barHeight: barHeightPct + '%',
    backgroundColor: color
  }
}

// 方法
function updateLikes() {
  if (likesInstance.value) {
    likesInstance.value.setTPace(sportParams.tPace)
    likesInstance.value.setHeartMaxMin(sportParams.heartMax, sportParams.heartMin)
    likesInstance.value.setFtp(sportParams.ftp)
    likesInstance.value.setCss(sportParams.css)
    likesDataVersion.value++
  }
}

function onVdotChange() {
  updateLikes()
  updatePaceResFromVdot(sportParams.vdot)
}

// 将时间字符串（如 "0:07:04"）转换为秒数
function parseTimeToSeconds(timeStr: string | null | undefined): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)
    const seconds = parseInt(parts[2], 10)
    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
      return hours * 3600 + minutes * 60 + seconds
    }
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10)
    const seconds = parseInt(parts[1], 10)
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds
    }
  }
  return null
}

// 将秒数格式化为配速字符串（如 424 -> "07:04"）
function formatSecondsToPace(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return ''
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 获取下一个区间键 E->M->T->A->I->R
function getNextZoneKey(zoneKey: string): string | null {
  const zoneOrder = ['E', 'M', 'T', 'A', 'I', 'R']
  const index = zoneOrder.indexOf(zoneKey)
  return index < zoneOrder.length - 1 ? zoneOrder[index + 1] : null
}

// 根据跑力值从 runforce 更新 Mylikes.pace_res（配速区间 min/max）
function updatePaceResFromVdot(vdot: number) {
  if (!runforceData.value?.length || !likesInstance.value) return
  const vdotInt = Math.floor(vdot)
  const vdotData = runforceData.value.find((item: any) => item.ability === vdotInt)
  if (!vdotData) return
  const zoneMap: Record<string, string> = {
    E: 'e', M: 'm', T: 't', A: 'a', I: 'i', R: 'r'
  }
  const paceRes: any[] = []
  ;(['E', 'M', 'T', 'A', 'I', 'R'] as const).forEach((zoneKey) => {
    const paceStr = vdotData[zoneKey]
    if (paceStr) {
      const paceSeconds = parseTimeToSeconds(paceStr)
      if (paceSeconds !== null) {
        const zoneId = zoneMap[zoneKey]
        const nextZoneKey = getNextZoneKey(zoneKey)
        let minSecond = paceSeconds
        let maxSecond = paceSeconds
        if (nextZoneKey && vdotData[nextZoneKey]) {
          const nextPaceSeconds = parseTimeToSeconds(vdotData[nextZoneKey])
          if (nextPaceSeconds !== null) maxSecond = nextPaceSeconds
        } else {
          maxSecond = Math.floor(paceSeconds * 0.9)
        }
        paceRes[zoneId as any] = {
          id: zoneId,
          min_second: minSecond,
          max_second: maxSecond,
          min_value: formatSecondsToPace(minSecond),
          max_value: formatSecondsToPace(maxSecond)
        }
      }
    }
  })
  likesInstance.value.pace_res = paceRes
  likesDataVersion.value++
}

// 跑力值问号悬浮：各区间配速 + 各距离成绩（与 addtask_new.vue 一致）
function getVdotTooltip(vdot: number): string {
  if (vdot == null || isNaN(vdot) || !runforceData.value?.length) return ''
  const vdotInt = Math.floor(vdot)
  const vdotData = runforceData.value.find((item: any) => item.ability === vdotInt)
  if (!vdotData) return ''
  const paceZones: Record<string, string> = {
    E: 'E (轻松跑)',
    M: 'M (马拉松配速)',
    T: 'T (乳酸阈值)',
    A: 'A (无氧耐力)',
    I: 'I (间歇跑)',
    R: 'R (冲刺)'
  }
  const distanceLabels: Record<string, string> = {
    marathon: '马拉松',
    half_marathon: '半程马拉松',
    '10km': '10公里',
    '5km': '5公里',
    '3km': '3公里',
    '1600m': '1600米'
  }
  let html = `<div style="font-weight: bold; margin-bottom: 8px; font-size: 13px;">跑力值 ${vdotInt} 目标成绩</div>`
  html += `<div style="font-weight: bold; margin-top: 8px; margin-bottom: 4px; font-size: 12px; color: #059669;">配速区间:</div>`
  ;(['E', 'M', 'T', 'A', 'I', 'R'] as const).forEach((key) => {
    if (vdotData[key]) html += `<div style="margin: 2px 0; font-size: 11px;">${paceZones[key]}: ${vdotData[key]}</div>`
  })
  html += `<div style="font-weight: bold; margin-top: 8px; margin-bottom: 4px; font-size: 12px; color: #059669;">目标成绩:</div>`
  Object.keys(distanceLabels).forEach((key) => {
    if (vdotData[key]) html += `<div style="margin: 2px 0; font-size: 11px;">${distanceLabels[key]}: ${vdotData[key]}</div>`
  })
  return html
}

function onTypeChange() {
  // 切换运动类型时，更新默认强度
  const options = default_intensity_arr[val.type as keyof typeof default_intensity_arr]
  if (options && options.length > 0) {
    default_intensity.value = options[0].value
  }
}

// 默认 lap 值配置 - 与原版 addtask_new.vue 保持一致
const default_lap_value: Record<string, any> = {
  pace_value: {
    range_min: 390,  // 6'30 = 390秒
    range_max: 330,  // 5'30 = 330秒
    intensity: 'pace',
    range: 'number',
    unit_value: 5,
    unit: 'min',
    pace_unit: '1000'
  },
  pace_vdot: {
    range_min: 1.0,
    range_max: 2.0,
    intensity: 'pace',
    range: 'range',
    unit_value: 5,
    unit: 'min'
  },
  pace_lt: {
    range_min: 0.89,
    range_max: 0.98,
    intensity: 'lt',
    range: 'range',
    unit_value: 5,
    unit: 'min'
  },
  heart_value: {
    range_min: 130,
    range_max: 150,
    intensity: 'heart',
    range: 'number',
    unit_value: 5,
    unit: 'min'
  },
  heart_hrr: {
    range_min: 1.0,
    range_max: 2.0,
    intensity: 'heart',
    range: 'range',
    unit_value: 5,
    unit: 'min'
  },
  heart_mhr: {
    range_min: 0.6,
    range_max: 0.75,
    intensity: 'heart',
    range: 'mhrrange',
    unit_value: 5,
    unit: 'min'
  },
  lthr: {
    range_min: 0.6,
    range_max: 0.75,
    intensity: 'heart',
    range: 'lthrrange',
    unit_value: 5,
    unit: 'min'
  },
  effort: {
    range_min: 0.6,
    range_max: 0.75,
    intensity: 'effort',
    range: 'range',
    unit_value: 5,
    unit: 'min'
  },
  power_value: {
    range_min: 120,
    range_max: 130,
    intensity: 'power',
    range: 'number',
    unit_value: 5,
    unit: 'min'
  },
  power_cp: {
    range_min: 0.79,
    range_max: 1.0,
    intensity: 'power',
    range: 'powerrange',
    unit_value: 5,
    unit: 'min'
  },
  ftp_area: {
    range_min: 0.6,
    range_max: 0.7,
    intensity: 'ftp',
    range: 'range',
    unit_value: 30,
    unit: 'min'
  },
  ftp_value: {
    range_min: 120,
    range_max: 140,
    intensity: 'ftp',
    range: 'number',
    unit_value: 30,
    unit: 'min'
  },
  css_range: {
    range_min: 0.6,
    range_max: 0.7,
    intensity: 'pace',
    range: 'css',
    unit_value: 5,
    unit: 'min'
  },
  css_value: {
    range_min: 1155,  // 19'15 = 1155秒
    range_max: 1160,  // 19'20 = 1160秒
    intensity: 'pace',
    range: 'number',
    unit_value: 5,
    unit: 'min',
    pace_unit: '1000'
  },
  tsp_range: {
    range_min: 0.89,
    range_max: 1.0,
    intensity: 'pace',
    range: 'tsp',
    unit_value: 5,
    unit: 'min'
  },
  muscle: {
    range_min: 135,  // 2'15 = 135秒
    range_max: 140,  // 2'20 = 140秒
    intensity: 'muscle',
    content: '深蹲',
    unit_value: 10,
    unit: 'c'
  },
  calorie: {
    range_min: 300,
    range_max: 400,
    intensity: 'calorie',
    range: 'number',
    unit_value: 5,
    unit: 'min'
  }
}

function add_default_lap(type: 'normal' | 'com') {
  // 获取当前强度类型的默认值
  const defaultLapConfig = default_lap_value[default_intensity.value] || default_lap_value.pace_vdot
  
  const newLap: any = {
    _uid: `lapuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    id: `lap_${Date.now()}_${Math.random()}`,
    ref: `lap_ref_${Date.now()}`,
    type: val.type,
    lap_type: type,
    color: getRandomColor(),
    expanded: false,
    val: {
      type: val.type,
      straining_step: val.type,
      t_type: type,
      tPace: sportParams.tPace,
      ftp: sportParams.ftp,
      cp: sportParams.cp,
      trainig_lap: {
        ...defaultLapConfig,  // 使用默认配置
        unit: defaultLapConfig.unit || 'min',
        unit_value: type === 'com' ? 5 : (defaultLapConfig.unit_value || 10)
      },
      straining_steps: {
        run: [{ value: 'run', title: '跑步' }],
        ride: [{ value: 'ride', title: '骑车' }],
        swim: [{ value: 'swim', title: '游泳' }],
        muscle: [{ value: 'muscle', title: '力量' }],
        other: [{ value: 'other', title: '其他' }]
      },
      units: [
        { value: 'min', title: '分钟' },
        { value: 'km', title: '公里' },
        { value: 's', title: '秒' },
        { value: 'm', title: '米' },
        { value: 'c', title: '次' }
      ],
      intensitys: {
        run: [
          { value: 'HRR', title: '心率储备' },
          { value: 'HRmax', title: '最大心率' },
          { value: 'Pace', title: '配速' }
        ],
        ride: [
          { value: 'FTP', title: '功率' },
          { value: 'HRR', title: '心率储备' }
        ],
        swim: [
          { value: 'CSS', title: 'CSS配速' },
          { value: 'HRR', title: '心率储备' }
        ]
      },
      ranges: {
        HRR: [
          { value: '1', title: '区间1' },
          { value: '2', title: '区间2' },
          { value: '3', title: '区间3' },
          { value: '4', title: '区间4' },
          { value: '5', title: '区间5' },
          { value: 'custom', title: '自定义' }
        ],
        HRmax: [
          { value: '1', title: '区间1' },
          { value: '2', title: '区间2' },
          { value: '3', title: '区间3' },
          { value: '4', title: '区间4' },
          { value: '5', title: '区间5' }
        ],
        Pace: [
          { value: '1', title: 'E配速' },
          { value: '2', title: 'M配速' },
          { value: '3', title: 'T配速' },
          { value: '4', title: 'I配速' },
          { value: '5', title: 'R配速' }
        ],
        FTP: [
          { value: '1', title: 'Z1' },
          { value: '2', title: 'Z2' },
          { value: '3', title: 'Z3' },
          { value: '4', title: 'Z4' },
          { value: '5', title: 'Z5' }
        ],
        CSS: [
          { value: '1', title: 'Z1' },
          { value: '2', title: 'Z2' },
          { value: '3', title: 'Z3' }
        ]
      }
    }
  }

  // 添加间歇组合时，初始化 laps_com 和默认子段落
  if (type === 'com') {
    newLap.val.repeat = 4
    
    // 创建两个默认子段落：快速段和慢速段
    const fastLapConfig = default_lap_value[default_intensity.value] || default_lap_value.pace_vdot
    const slowLapConfig = { ...fastLapConfig }
    
    // 快速段：使用默认配置
    const fastLap = {
      _uid: `sublapuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      id: `sublap_${Date.now()}_1`,
      ref: `sublap_ref_${Date.now()}_1`,
      type: val.type,
      lap_type: 'normal',
      color: getRandomColor(),
      val: {
        type: val.type,
        straining_step: val.type,
        t_type: 'normal',
        tPace: sportParams.tPace,
        ftp: sportParams.ftp,
        cp: sportParams.cp,
        trainig_lap: {
          ...fastLapConfig,
          unit: fastLapConfig.unit || 'min',
          unit_value: 3
        },
        straining_steps: newLap.val.straining_steps,
        units: newLap.val.units,
        intensitys: newLap.val.intensitys,
        ranges: newLap.val.ranges
      }
    }
    
    // 慢速段：使用较低的强度值
    const slowLap = {
      _uid: `sublapuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      id: `sublap_${Date.now()}_2`,
      ref: `sublap_ref_${Date.now()}_2`,
      type: val.type,
      lap_type: 'normal',
      color: getRandomColor(),
      val: {
        type: val.type,
        straining_step: val.type,
        t_type: 'normal',
        tPace: sportParams.tPace,
        ftp: sportParams.ftp,
        cp: sportParams.cp,
        trainig_lap: {
          ...slowLapConfig,
          unit: slowLapConfig.unit || 'min',
          unit_value: 2,
          // 慢速段使用较低的强度
          range_min: typeof slowLapConfig.range_min === 'number' ? slowLapConfig.range_min * 0.7 : slowLapConfig.range_min,
          range_max: typeof slowLapConfig.range_max === 'number' ? slowLapConfig.range_max * 0.7 : slowLapConfig.range_max
        },
        straining_steps: newLap.val.straining_steps,
        units: newLap.val.units,
        intensitys: newLap.val.intensitys,
        ranges: newLap.val.ranges
      }
    }
    
    newLap.val.laps_com = [fastLap, slowLap]
  }

  wp_laps.value.push(newLap)
}

function getRandomColor() {
  const colors = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4']
  return colors[Math.floor(Math.random() * colors.length)]
}

function generateEchartData(lap: any) {
  const points = 30
  const data = []
  const minIntensity = (lap.val?.trainig_lap?.range_min || 1) * 30 // 转换为百分比强度
  const maxIntensity = (lap.val?.trainig_lap?.range_max || 2) * 30
  const avgIntensity = (minIntensity + maxIntensity) / 2
  
  for (let i = 0; i < points; i++) {
    // 生成接近平均值的波动数据
    const variation = (Math.random() - 0.5) * (maxIntensity - minIntensity) * 0.3
    const intensity = Math.max(minIntensity, Math.min(maxIntensity, avgIntensity + variation))
    
    data.push({
      intensity,
      value: intensity
    })
  }
  
  return data
}

function setLapFocus(index: number) {
  lapfocus.value = index
}

function isLapExpanded(index: number): boolean {
  return wp_laps.value[index]?.expanded === true
}

function toggleLapExpand(index: number) {
  if (wp_laps.value[index]) {
    wp_laps.value[index].expanded = !wp_laps.value[index].expanded
  }
}

// 解析 lap 标题（参考 addtask_new.vue getLapName）；根据当前语言显示中文或英文
function getLapName(item: any, useShortTitle = true): string {
  const useChinese = locale.value === 'zh'
  if (!item?.val) return t('plan_unnamed')
  if (item.val.task_name && item.val.task_name !== 'N/A') {
    return useChinese ? replaceCodeWithChinese(item.val.task_name) : replaceCodeWithLocale(item.val.task_name)
  }
  if (item.lap_type === 'com') {
    const repeat = item.val.repeat || 1
    const subs = (item.val.laps_com || []).map((sub: any) => {
      const tl = sub?.val?.trainig_lap
      if (!tl) return '?'
      const u = tl.unit === 'min' ? 'min' : tl.unit === 's' ? 's' : tl.unit === 'km' ? 'km' : tl.unit || 'min'
      return `${tl.unit_value ?? 0}${u}`
    })
    return `${t('plan_interval')} ${repeat}× (${subs.join(' + ')})`
  }
  const lap = item.val.trainig_lap || {}
  const unit = lap.unit || 'min'
  const unitValue = lap.unit_value ?? 0
  const intensity = lap.intensity || ''
  const range = lap.range || ''
  const isPaceValue = intensity === 'pace' && range === 'number'
  const rangeMin = isPaceValue ? formatPaceRangeForOutput(lap.range_min) : (lap.range_min ?? '')
  const rangeMax = isPaceValue ? formatPaceRangeForOutput(lap.range_max) : (lap.range_max ?? '')
  const unitStr = unit === 'min' ? 'min' : unit === 's' ? 's' : unit === 'km' ? 'km' : unit === 'm' ? 'm' : unit === 'c' ? 'c' : unit
  const codeStr = getIntensityCode(intensity, range)
  let name = ''
  if (rangeMin !== '' && rangeMax !== '') {
    name = `${unitValue}${unitStr}@(${codeStr}${rangeMin}~${rangeMax})`
  } else if (rangeMin !== '' || rangeMax !== '') {
    name = `${unitValue}${unitStr}@(${codeStr}${rangeMin || rangeMax})`
  } else if (codeStr) {
    name = `${unitValue}${unitStr}@(${codeStr})`
  } else {
    name = `${unitValue}${unitStr}`
  }
  return useChinese ? replaceCodeWithChinese(name) : replaceCodeWithLocale(name)
}

function getIntensityCode(intensity: string, range: string): string {
  if (intensity === 'heart' && range === 'range') return 'HRR+'
  if (intensity === 'heart' && range === 'mhrrange') return 'MHR+'
  if (intensity === 'heart' && range === 'lthrrange') return 'LTHR/'
  if (intensity === 'heart' && range === 'number') return 'HEART+'
  if (intensity === 'lt' && range === 'range') return 't/'
  if (intensity === 'pace' && range === 'range') return 'VDOT+'
  if (intensity === 'pace' && range === 'css') return 'CSS/'
  if (intensity === 'pace' && range === 'tsp') return 'TSP/'
  if (intensity === 'pace' && range === 'number') return 'pace+'
  if (intensity === 'power' && range === 'powerrange') return 'cp/'
  if (intensity === 'power' && range === 'number') return 'POWER+'
  if (intensity === 'ftp' && range === 'range') return 'FTP/'
  if (intensity === 'ftp' && range === 'number') return 'FTP+'
  if (intensity === 'effort' && range === 'range') return 'EFFORT+'
  if (intensity === 'rest') return 'rest'
  if (intensity) {
    const opt = ['range', 'mhrrange', 'powerrange', 'lthrrange', 'css', 'tsp'].includes(range) ? '/' : '+'
    return intensity.toUpperCase() + opt
  }
  return ''
}

function replaceCodeWithChinese(str: string): string {
  const codeMap: Array<{ code: string; chinese: string }> = []
  const types = ['run', 'ride', 'swim', 'muscle', 'other'] as const
  types.forEach(ty => {
    const arr = default_intensity_arr[ty]
    if (arr) arr.forEach((item: any) => { if (item.code && item.title) codeMap.push({ code: item.code, chinese: item.title }) })
  })
  codeMap.sort((a, b) => b.code.length - a.code.length)
  let result = str
  codeMap.forEach(({ code, chinese }) => {
    result = result.replace(new RegExp(code.replace(/[+/]/g, '\\$&'), 'g'), chinese)
  })
  return result
}

// 将课表代码替换为当前语言的强度名称（与 replaceCodeWithChinese 对应，用于英文等）
function replaceCodeWithLocale(str: string): string {
  const codeMap: Array<{ code: string; key: string }> = []
  const types = ['run', 'ride', 'swim', 'muscle', 'other'] as const
  types.forEach(ty => {
    const arr = default_intensity_arr[ty]
    if (arr) arr.forEach((item: any) => { if (item.code && item.value) codeMap.push({ code: item.code, key: 'plan_intensity_' + item.value }) })
  })
  codeMap.push({ code: 'rest', key: 'plan_intensity_rest' })
  codeMap.sort((a, b) => b.code.length - a.code.length)
  let result = str
  codeMap.forEach(({ code, key }) => {
    const label = t(key)
    result = result.replace(new RegExp(code.replace(/[+/]/g, '\\$&'), 'g'), label)
  })
  return result
}

function copyLap(index: number) {
  if (!wp_laps.value[index]) return
  goLap({ id: wp_laps.value[index].id, action: 'copy', index, lap_type: wp_laps.value[index].lap_type })
}

function deleteLap(index: number) {
  if (!wp_laps.value[index]) return
  goLap({ id: wp_laps.value[index].id, action: 'del', index, lap_type: wp_laps.value[index].lap_type })
}

function lapKey(item: any, index: number): string {
  if (item && item._uid) return String(item._uid)
  if (item && item.id != null) return `id-${String(item.id)}-${index}`
  return `idx-${index}`
}

function onLapDragStart(index: number, event: DragEvent) {
  if (props.readOnly) return
  draggingLapIndex.value = index
  dragOverLapIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onLapDragEnter(index: number) {
  if (draggingLapIndex.value == null || props.readOnly) return
  dragOverLapIndex.value = index
}

function onLapDragEnd() {
  draggingLapIndex.value = null
  dragOverLapIndex.value = null
}

function onLapDrop(targetIndex: number) {
  if (props.readOnly) return
  const sourceIndex = draggingLapIndex.value
  if (sourceIndex == null || sourceIndex === targetIndex) {
    onLapDragEnd()
    return
  }
  if (sourceIndex < 0 || sourceIndex >= wp_laps.value.length) {
    onLapDragEnd()
    return
  }
  const moved = wp_laps.value.splice(sourceIndex, 1)[0]
  const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
  wp_laps.value.splice(insertIndex, 0, moved)
  onLapDragEnd()
}

// goLap 函数 - 处理 lap 的所有操作（直接复制原版逻辑）
function goLap(obj: any) {
  const { id, action, index, lap_type } = obj
  const laps = wp_laps.value
  
  if (action === 'del') {
    // 删除
    laps.splice(index, 1)
  } else if (action === 'copy') {
    // 复制
    const copyLap = JSON.parse(JSON.stringify(laps[index]))
    copyLap._uid = `lapuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    copyLap.id = `lap_${Date.now()}_${Math.random()}`
    copyLap.ref = `lap_ref_${Date.now()}`
    laps.splice(index + 1, 0, copyLap)
  } else if (action === 'up') {
    // 上移
    if (index > 0) {
      const temp = laps[index]
      laps[index] = laps[index - 1]
      laps[index - 1] = temp
    }
  } else if (action === 'down') {
    // 下移
    if (index < laps.length - 1) {
      const temp = laps[index]
      laps[index] = laps[index + 1]
      laps[index + 1] = temp
    }
  }
}

// Echart 柱状图相关方法（barItem 含 lap / subLap，间歇时用 subLap 呈现起伏）
function getTrainigLap(barItem: { lap: any; subLap: any }): any {
  if (barItem.subLap?.val?.trainig_lap) return barItem.subLap.val.trainig_lap
  return barItem.lap?.val?.trainig_lap
}

function getLapBarHeight(barItem: { lap: any; subLap: any }): number {
  const tl = getTrainigLap(barItem)
  if (!tl) return 20
  const minIntensity = (tl.range_min ?? 1) * 30
  const maxIntensity = (tl.range_max ?? 2) * 30
  const avgIntensity = (minIntensity + maxIntensity) / 2
  return Math.min(100, Math.max(10, avgIntensity))
}

function getLapBarColor(barItem: { lap: any; subLap: any }): string {
  const tl = getTrainigLap(barItem)
  if (!tl) return getChartColorByMode(chartColorMode.value, 0.2, '#4caf50')
  const minIntensity = (tl.range_min ?? 1) * 30
  const maxIntensity = (tl.range_max ?? 2) * 30
  const avgIntensity = (minIntensity + maxIntensity) / 2
  const ratio = Math.max(0, Math.min(1, avgIntensity / 100))
  let origColor = '#4caf50'
  if (avgIntensity < 30) origColor = '#4caf50'
  else if (avgIntensity < 50) origColor = '#2196f3'
  else if (avgIntensity < 70) origColor = '#ff9800'
  else origColor = '#f44336'
  return getChartColorByMode(chartColorMode.value, ratio, origColor)
}

function getLapBarTooltip(barItem: { lap: any; subLap: any }, index: number): string {
  const tl = getTrainigLap(barItem)
  if (!tl) return `${t('plan_segment')} ${index + 1}`
  const unit = tl.unit || 'min'
  const value = tl.unit_value ?? 0
  const min = tl.range_min ?? 0
  const max = tl.range_max ?? 0
  return `${t('plan_segment')} ${index + 1}: ${value}${unit} @ ${min}-${max}`
}

/** 秒数转配速字符串 5'30（与 addtask_new/tasklap 保存格式一致） */
function secondsToPaceStr(sec: number): string {
  if (sec == null || isNaN(sec) || sec < 0) return "0'00"
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}'${String(s).padStart(2, '0')}`
}

/** 配速字符串 5'30 或 5:30 转秒数（解析旧数据用） */
function parsePaceToSeconds(str: string | number): number {
  if (str == null) return 0
  if (typeof str === 'number' && !isNaN(str)) return str
  const s = String(str).trim()
  const match = s.match(/^(\d+)[':](\d+)$/)
  if (match) {
    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)
    if (!isNaN(minutes) && !isNaN(seconds)) return minutes * 60 + seconds
  }
  const num = parseFloat(s)
  return isNaN(num) ? 0 : num
}

/** 配速值(pace+) 的 range 输出格式：内部可能是秒数或 "5'30"，统一输出 5'30 */
function formatPaceRangeForOutput(val: unknown): string {
  if (val == null) return "0'00"
  if (typeof val === 'string' && (val.includes("'") || val.includes(':'))) return val
  const sec = typeof val === 'number' ? val : parsePaceToSeconds(String(val))
  return secondsToPaceStr(sec)
}

/** 解析 content 中的 min/max：若是 5'30 格式则转秒数，否则转数字 */
function parseMinMaxForLap(minStr: unknown, maxStr: unknown, intensity: string, range: string): { min: number | string; max: number | string } {
  const isPaceNumber = intensity === 'pace' && range === 'number'
  const parseOne = (v: unknown): number | string => {
    if (v == null) return isPaceNumber ? 0 : 1
    const s = String(v).trim()
    if (isPaceNumber && (s.includes("'") || s.includes(':'))) return parsePaceToSeconds(s)
    const n = parseFloat(s)
    return isNaN(n) ? (isPaceNumber ? 0 : 1) : n
  }
  return { min: parseOne(minStr), max: parseOne(maxStr) }
}

/** 根据 unit 返回时长展示后缀（米/公里/分钟/秒/次），避免 5000m 被写成 5000分钟 */
function unitToDurationSuffix(unit: string): string {
  const u = (unit || 'min').toLowerCase()
  if (u === 'm') return '米'
  if (u === 'km') return '公里'
  if (u === 's') return '秒'
  if (u === 'c') return '次'
  if (u === 'miles') return '英里'
  return '分钟'
}

/** 参考 addtask_new createLapintensity：根据 intensity/range 返回 type 和 opt */
function createLapIntensityType(intensity: string, range: string): { type: string; opt: string } {
  let type = intensity || 'pace'
  let opt = '+'
  const i = (intensity || '').toLowerCase()
  const r = (range || '').toLowerCase()
  if (i === 'heart') {
    if (r === 'mhrrange') type = 'MHR'
    else if (r === 'range') type = 'HRR'
    else if (r === 'number') type = 'HEART'
    else if (r === 'lthrrange') { type = 'LTHR'; opt = '/' }
  } else if (i === 'pace') {
    if (r === 'range') type = 'VDOT'
    else if (r === 'number') type = 'PACE'
    else if (r === 'css') { type = 'CSS'; opt = '/' }
    else if (r === 'tsp') { type = 'TSP'; opt = '/' }
  } else if (i === 'lt' && r === 'range') { type = 't'; opt = '/' }
  else if (i === 'ftp') { type = 'FTP'; opt = r === 'range' ? '/' : '+' }
  else if (i === 'power') {
    if (r === 'powerrange') { type = 'CP'; opt = '/' }
    else if (r === 'number') type = 'POWER'
  } else if (i === 'effort' && r === 'range') type = 'EFFORT'
  else if (i === 'rest' || i === 'jog' || i === 'open' || i === 'fast') type = i
  return { type, opt }
}

/** 参考 addtask_new createTask_new：从 trainig_lap 创建 task 对象 */
function createTaskFromTrainigLap(tl: any, strainingStep?: string): any {
  let intensity = tl.intensity || 'pace'
  let range = tl.range || 'range'
  if (strainingStep === 'rest') intensity = 'rest'
  if (strainingStep === 'open') intensity = 'open'
  if (strainingStep === 'jog') intensity = 'jog'
  if (strainingStep === 'fast') intensity = 'fast'
  if (strainingStep === 'easy') intensity = 'ez'
  if (strainingStep === 'muscle') intensity = 'muscle'
  const { type, opt } = createLapIntensityType(intensity, range)
  const suffix = unitToDurationSuffix(tl.unit || 'min')
  const isPaceValue = intensity === 'pace' && range === 'number'
  const minStr = isPaceValue ? formatPaceRangeForOutput(tl.range_min) : String(tl.range_min ?? 1)
  const maxStr = isPaceValue ? formatPaceRangeForOutput(tl.range_max) : String(tl.range_max ?? 2)
  return {
    theory: 'vlt',
    duration: `${tl.unit_value ?? 0}${suffix}`,
    duration_value: parseInt(String(tl.unit_value ?? 0), 10),
    name: intensity === 'rest' ? '休息' : intensity,
    resttime: '',
    times: 1,
    content: tl.content || '',
    type,
    min: minStr,
    max: maxStr,
    desc: '',
    unit: tl.unit || 'min',
    tip: tl.tip || '',
    opt,
    sports: parseInt(getSportsNumber(val.type), 10)
  }
}

/** 参考 addtask_new createDescString：生成 lap 描述字符串 */
function createDescStringFromTasks(tasks: any[], group: number): string {
  const taskString = tasks.map((task: any) => {
    const taskType = (task.type || '').toLowerCase()
    if (['rest', 'fast', 'open', 'jog'].includes(taskType)) {
      return `${task.duration_value}${task.unit}@(${taskType})`
    }
    if (taskType === 'muscle') {
      return `${task.duration_value}${task.unit}@(${task.content || 'muscle'})`
    }
    const hasOperator = taskType && (taskType.endsWith('+') || taskType.endsWith('/'))
    const operator = hasOperator ? '' : (task.opt || '+')
    return `${task.duration_value}${task.unit}@(${taskType}${operator}${task.min}~${task.max})`
  }).join(';')
  return group > 1 ? `{${taskString}}x${group}` : taskString
}

/** 参考 addtask_new createTaskContentJson：构建与 addtask_new 一致的 content 结构 */
function buildTaskContent(): any[] {
  const childElements: any[] = []
  let overallDesc = ''

  wp_laps.value.forEach((lap) => {
    const isInterval = lap.lap_type === 'com'
    const group = isInterval ? Math.max(1, lap.val?.repeat || 1) : 1

    const tasks = isInterval
      ? (lap.val?.laps_com || []).map((sub: any) => createTaskFromTrainigLap(sub?.val?.trainig_lap || {}, sub?.val?.straining_step))
      : [createTaskFromTrainigLap(lap.val?.trainig_lap || {}, lap.val?.straining_step)]

    const descString = createDescStringFromTasks(tasks, group)

    overallDesc += (overallDesc ? ';' : '') + descString
    childElements.push({
      name: descString,
      type: '',
      times: 1,
      group,
      resttime: 0,
      tasks
    })
  })

  const taskStr = {
    name: 'NM',
    task_name: overallDesc || 'N/A',
    sports: parseInt(getSportsNumber(val.type), 10),
    nameTxt: val.title || '主课',
    desc: val.description || '',
    child: childElements
  }

  return [taskStr]
}

function getSportsNumber(type: string): string {
  const map: Record<string, string> = {
    run: '1',
    ride: '2',
    swim: '5',
    muscle: '3',
    other: '254'
  }
  return map[type] || '1'
}

function handleSave() {
  const taskContent = buildTaskContent()
  const now = Math.floor(Date.now() / 1000)

  // 合成的 name = task_str.task_name（与 addtask_new 一致）
  const taskStr = taskContent[0]
  const synthesizedName = (taskStr?.task_name && taskStr.task_name !== 'N/A') ? taskStr.task_name : (val.title || '')

  const savedPlan: PlanEvent = {
    id: props.plan?.id || 0,
    game_task_user_id: props.plan?.game_task_user_id || 0,
    game_id: props.plan?.game_id || 0,
    section_id: props.plan?.section_id || 0,
    task_id: props.plan?.task_id || 0,
    user_id: props.plan?.user_id || 0,
    title: val.title || '主课',
    name: synthesizedName,
    description: val.description,
    desc: val.description,
    content: JSON.stringify(taskContent),
    task_content: JSON.stringify(taskContent),
    type: val.training_type,
    weight: val.weight,
    sports: parseInt(getSportsNumber(val.type)),
    status: val.status,
    start: props.plan?.start || '',
    end: props.plan?.end || '',
    start_time: props.plan?.start_time || now,
    end_time: props.plan?.end_time || now + 86399,
    start_tm: props.plan?.start_tm || now,
  }

  emit('save', savedPlan)
}

// 加载 runforce.json（跑力值对应配速/成绩）
async function loadRunforceData() {
  try {
    const url = new URL(`${import.meta.env.BASE_URL}runforce.json`, window.location.href).toString()
    const res = await fetch(url)
    if (res.ok) {
      runforceData.value = await res.json()
      if (likesInstance.value && sportParams.vdot != null) {
        updatePaceResFromVdot(sportParams.vdot)
      }
    }
  } catch (_) {
    // 静默失败
  }
}

// 初始化
onMounted(async () => {
  // 先用当前用户信息填充运动参数（跑力、最大/静息心率、阈值配速等），避免写死默认值
  try {
    const userProfile = await openApi.getProfile()
    if (userProfile) {
      const p = userProfile as unknown as Record<string, unknown>
      if (p.run_force != null) {
        const rf = Number(p.run_force)
        sportParams.vdot = rf >= 100 ? Math.round(rf / 10) : Math.round(rf)
      }
      if (p.max_rate != null) sportParams.heartMax = Number(p.max_rate)
      if (p.min_rate != null) sportParams.heartMin = Number(p.min_rate)
      if (p.t_pace != null) sportParams.tPace = Number(p.t_pace)
      if (p.ftp != null) sportParams.ftp = Number(p.ftp)
      if (p.css != null) sportParams.css = Number(p.css)
      if (p.critical_power != null) sportParams.cp = Number(p.critical_power)
      if (p.lt_ride != null) sportParams.lthr = Number(p.lt_ride)
    }
  } catch (_) {
    // 未登录或接口失败时保留默认值
  }

  // 创建 Mylikes 实例（使用顶部栏：跑力 vdot、阈值配速 tPace、最大/最小心率、FTP 等）
  likesInstance.value = new Mylikes({
    tPace: sportParams.tPace,       // 阈值配速，用于 LT 区间换算
    heartMax: sportParams.heartMax,
    heartMin: sportParams.heartMin,
    ftp: sportParams.ftp,
    css: sportParams.css,
    tsp: sportParams.tsp
  })
  // 立即用当前顶部栏参数同步到 Mylikes（setTPace/setHeartMaxMin 等），并触发 TaskLap 重新计算 VDOT/HRR/实际配速
  updateLikes()
  await loadRunforceData()
  if (runforceData.value?.length && sportParams.vdot != null) {
    updatePaceResFromVdot(sportParams.vdot)
  }

  // 如果是编辑模式，加载数据
  if (props.plan) {
    val.type = getPlanTypeFromSports(props.plan.sports)
    val.training_type = props.plan.type && TRAINING_TYPE_MAP[props.plan.type] != null ? props.plan.type : 'other'
    val.title = props.plan.title || ''
    val.description = props.plan.description || props.plan.desc || ''
    val.weight = props.plan.weight || 'xuanxiu'
    val.status = props.plan.status ?? 1

    // 解析单位：保留 m=米、km=公里，避免把 m 误当成 min（空字符串视为未设置，不返回 min）
    function parseUnit(u: any): string {
      const s = u != null ? String(u).trim() : ''
      if (!s) return '' // 空字符串表示“未设置”，由 parseDurationAndUnit 从 duration 推断
      if (s === 'm' || s === 'meters' || s === '米') return 'm'
      if (s === 'km' || s === 'kilometers' || s === '公里') return 'km'
      if (s === 'min' || s === 'minutes' || s === '分') return 'min'
      if (s === 's' || s === 'sec' || s === '秒') return 's'
      if (s === 'c' || s === '次') return 'c'
      if (s === 'miles') return 'miles'
      return s
    }

    // 从 duration 字符串解析出数值和单位（如 "1200米" / "5000米" -> { value: 1200, unit: 'm' }），接口可能不存 unit 只存 duration 中文
    function parseDurationAndUnit(duration: any, durationValue: any): { value: number; unit: string } {
      const numVal = Number(durationValue)
      const fallbackNum = !isNaN(numVal) ? numVal : 0
      if (duration == null || duration === '') return { value: fallbackNum, unit: 'min' }
      if (typeof duration === 'string') {
        const m = duration.match(/^([\d.]+)\s*(米|公里|分钟|秒|次|英里|min|m|km|s|c|miles)?$/i)
        if (m) {
          const value = parseFloat(m[1])
          if (!isNaN(value)) {
            const suffix = (m[2] || '').trim().toLowerCase()
            if (suffix === '米' || suffix === 'm') return { value, unit: 'm' }
            if (suffix === '公里' || suffix === 'km') return { value, unit: 'km' }
            if (suffix === '分钟' || suffix === '分' || suffix === 'min') return { value, unit: 'min' }
            if (suffix === '秒' || suffix === 's') return { value, unit: 's' }
            if (suffix === '次' || suffix === 'c') return { value, unit: 'c' }
            if (suffix === '英里' || suffix === 'miles') return { value, unit: 'miles' }
            return { value, unit: 'min' }
          }
        }
      }
      return { value: fallbackNum, unit: 'min' }
    }

    // 根据 task.type 推断 intensity 和 range (与原版 createLap 保持一致)
    function parseTaskIntensityAndRange(task: any) {
      const taskType = (task.type || '').toLowerCase()
      let intensity = 'pace'
      let range = 'range'
      
      switch (taskType) {
        case 'vdot':
          intensity = 'pace'
          range = 'range'
          break
        case 'pace':
          intensity = 'pace'
          range = 'number'
          break
        case 't':
        case 'i':
        case 'm':
          intensity = 'lt'
          range = 'range'
          break
        case 'heart':
          intensity = 'heart'
          range = 'number'
          break
        case 'lthr':
          intensity = 'heart'
          range = 'lthrrange'
          break
        case 'hrr':
          intensity = 'heart'
          range = 'range'
          break
        case 'mhr':
          intensity = 'heart'
          range = 'mhrrange'
          break
        case 'effort':
          intensity = 'effort'
          range = 'range'
          break
        case 'power':
          intensity = 'power'
          range = 'number'
          break
        case 'ftp':
          intensity = 'ftp'
          // 根据 opt 判断是区间还是绝对值
          range = (task.opt === '/' || task.opt === 'range') ? 'range' : 'number'
          break
        case 'css':
          intensity = 'pace'
          range = 'css'
          break
        case 'tsp':
          intensity = 'pace'
          range = 'tsp'
          break
        case 'cp':
          intensity = 'power'
          range = 'powerrange'
          break
        default:
          // 默认使用 HRR
          intensity = 'heart'
          range = 'range'
      }
      
      return { intensity, range }
    }
    
    // 解析 task_content (与原版 editTaskLap 逻辑保持一致)
    try {
      const content = JSON.parse(props.plan.content || props.plan.task_content || '[]')
      if (content.length > 0 && content[0].child) {
        wp_laps.value = content[0].child.map((child: any, index: number) => {
          // 判断是否为间歇组合：child.tasks.length > 1 或 child.group > 1
          const isInterval = child.tasks && (child.tasks.length > 1 || parseInt(child.group || 1) > 1)
          
          if (isInterval) {
            // 间歇组合 (多段组合)
            return {
              _uid: `lapuid_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
              id: `lap_${index}`,
              ref: `lap_ref_${index}`,
              type: val.type,
              lap_type: 'com',
              color: getRandomColor(),
              expanded: false,
              task_name: child.name || '',
              val: {
                type: val.type,
                t_type: 'interval',
                repeat: parseInt(child.group || child.times || 1),
                laps_com: (child.tasks || []).map((subtask: any, subIndex: number) => {
                  const { intensity, range } = parseTaskIntensityAndRange(subtask)
                  const { value: unitValue, unit: parsedUnit } = parseDurationAndUnit(subtask.duration, subtask.duration_value)
                  const { min: parsedMin, max: parsedMax } = parseMinMaxForLap(subtask.min, subtask.max, intensity, range)
                  const unitStr = (subtask.unit != null && subtask.unit !== '' || subtask.duration_unit) ? parseUnit(subtask.unit || subtask.duration_unit) : parsedUnit
                  return {
                    _uid: `sublapuid_${Date.now()}_${index}_${subIndex}_${Math.random().toString(36).slice(2, 8)}`,
                    id: `sublap_${index}_${subIndex}`,
                    ref: `sublap_ref_${index}_${subIndex}`,
                    type: val.type,
                    lap_type: 'normal',
                    color: getRandomColor(),
                    val: {
                      type: val.type,
                      straining_step: val.type,
                      trainig_lap: {
                        unit_value: unitValue || 1,
                        unit: unitStr || 'min',
                        intensity,
                        range,
                        range_min: parsedMin,
                        range_max: parsedMax,
                        pace_unit: subtask.pace_unit || '/km'
                      }
                    }
                  }
                })
              }
            }
          } else {
            // 普通分段 (单段)
            const task = child.tasks?.[0] || {}
            const { intensity, range } = parseTaskIntensityAndRange(task)
            const { value: unitValue, unit: parsedUnit } = parseDurationAndUnit(task.duration, task.duration_value)
            const { min: parsedMin, max: parsedMax } = parseMinMaxForLap(task.min, task.max, intensity, range)
            const unitStr = (task.unit != null && task.unit !== '' || task.duration_unit) ? parseUnit(task.unit || task.duration_unit) : parsedUnit
            return {
              _uid: `lapuid_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
              id: `lap_${index}`,
              ref: `lap_ref_${index}`,
              type: val.type,
              lap_type: 'normal',
              color: getRandomColor(),
              expanded: false,
              task_name: child.name || '',
              val: {
                type: val.type,
                t_type: 'normal',
                straining_step: val.type,
                trainig_lap: {
                  unit_value: unitValue || 10,
                  unit: unitStr || 'min',
                  intensity,
                  range,
                  range_min: parsedMin,
                  range_max: parsedMax,
                  pace_unit: task.pace_unit || '/km'
                }
              }
            }
          }
        })
      }
    } catch (err) {
      console.error('Failed to parse task_content:', err)
    }

    // 加载运动参数
    if ((props.plan as any).mylikesoption) {
      const opts = (props.plan as any).mylikesoption
      sportParams.vdot = opts.vdot || sportParams.vdot
      sportParams.tPace = opts.tPace || sportParams.tPace
      sportParams.heartMax = opts.heartMax || sportParams.heartMax
      sportParams.heartMin = opts.heartMin || sportParams.heartMin
      sportParams.ftp = opts.ftp || sportParams.ftp
      sportParams.css = opts.css || sportParams.css
      updateLikes()
    }
  }
})

function getPlanTypeFromSports(sports?: number): string {
  switch (sports) {
    case 2: return 'ride'
    case 5: return 'swim'
    case 3: return 'muscle'
    case 254: return 'other'
    default: return 'run'
  }
}
</script>

<style scoped>
.plan-editor {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

/* 仅主内容区滚动，图表和 footer 固定在底部 */
.plan-editor :deep(.v-card-text) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.plan-editor-title {
  background-color: rgba(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

/* 下方标题/课程类型/权重/描述：浅色模式下边框为浅灰；深色模式下不覆盖，与顶部一致 */
.plan-editor-form-row :deep(.v-field--variant-outlined .v-field__outline__start),
.plan-editor-form-row :deep(.v-field--variant-outlined .v-field__outline__notch::before),
.plan-editor-form-row :deep(.v-field--variant-outlined .v-field__outline__end),
.plan-editor-form-row :deep(.v-field__outline) {
  --v-border-opacity: 0.22;
  color: rgba(0, 0, 0, 0.22);
}
.v-theme--dark .plan-editor-form-row :deep(.v-field__outline) {
  --v-border-opacity: unset;
  color: unset;
}
.vdot-help-icon {
  color: rgba(var(--v-theme-on-surface), 0.6);
  cursor: help;
  margin-left: 2px;
}
.vdot-tooltip {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 220px;
  max-width: 280px;
  white-space: normal;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface));
}

.echart-fixed-wrap {
  flex-shrink: 0;
  width: 100%;
  padding: 0 16px 12px;
  background: rgba(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.echart-stats-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 16px 24px;
  padding: 8px 16px 10px;
  background: rgba(var(--v-theme-primary), 0.08);
  border-radius: 6px 6px 0 0;
  margin-bottom: 8px;
}

.echart-stats-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
}

@media (max-width: 767px) {
  .echart-stats-header {
    flex-wrap: nowrap;
    gap: 8px;
    padding: 6px 8px 6px;
    margin-bottom: 6px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .echart-stats-item {
    font-size: 10px;
    gap: 2px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .echart-stats-item .v-icon {
    font-size: 12px !important;
  }
  .echart-container {
    height: 28px;
    padding: 4px 6px;
  }
  /* 顶部工具栏：跑力值、最大心等文字与输入框缩小，减少占用高度 */
  .editor-toolbar {
    padding: 8px 10px;
    gap: 8px;
    margin-bottom: 10px;
    position: relative;
    padding-right: 150px;
  }
  .editor-toolbar .toolbar-actions {
    position: absolute;
    top: 8px;
    right: 10px;
    margin-left: 0;
    display: flex;
    flex-shrink: 0;
    gap: 6px;
  }
  .editor-toolbar .toolbar-item {
    gap: 4px;
  }
  .editor-toolbar .toolbar-select {
    padding: 4px 8px;
    font-size: 12px;
  }
  .editor-toolbar .sport-params {
    gap: 6px;
  }
  .editor-toolbar .param-input {
    gap: 2px;
  }
  .editor-toolbar .param-input label {
    font-size: 11px;
  }
  .editor-toolbar .param-input input {
    width: 52px;
    padding: 2px 6px;
    font-size: 12px;
  }
  .editor-toolbar .param-input-tpace :deep(.picktime-input) {
    min-width: 42px !important;
    max-width: 48px !important;
    width: 48px !important;
    font-size: 12px;
  }
  .editor-toolbar .toolbar-actions .v-btn {
    font-size: 12px;
    min-height: 28px;
    padding: 0 8px;
  }
  .plan-editor :deep(.v-card-text) {
    padding: 12px !important;
  }
  .plan-editor .plan-editor-title {
    font-size: 1rem !important;
    padding: 12px 16px !important;
  }
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: rgba(var(--v-theme-surface), 0.6);
  border-radius: 8px;
  margin-bottom: 16px;
}

.editor-toolbar-readonly {
  pointer-events: none;
  opacity: 0.9;
}

.toolbar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-select {
  padding: 6px 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: 14px;
}

.sport-params {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.weight-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.param-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.param-input label {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  white-space: nowrap;
}

.param-input input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

/* 阈值配速输入框缩小，避免按钮换行 */
.param-input-tpace :deep(.picktime-input) {
  min-width: 50px !important;
  max-width: 58px !important;
  width: 58px !important;
}

.toolbar-actions {
  margin-left: auto;
}

.task-total {
  display: flex;
  gap: 24px;
  padding: 12px;
  background: rgba(var(--v-theme-primary), 0.08);
  border-radius: 6px;
  margin-bottom: 16px;
}

.total-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.echart-container {
  width: 100%;
  max-width: 100%;
  height: 100px;
  background: rgba(var(--v-theme-surface), 0.8);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  padding: 12px 16px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  box-sizing: border-box;
}

/* 与日历 batch-event-chart 一致：无 gap、柱宽百分比、双 span 结构、同配色 */
.lap-bars-wrapper.batch-chart-container {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  min-width: 0;
  gap: 0;
  padding: 0;
  box-sizing: border-box;
}

.lap-bar-item.batch-chart-bar {
  height: 100%;
  min-width: 2px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s;
}

.lap-bar-item.batch-chart-bar:hover {
  transform: translateY(-2px);
}

.lap-bar-item.batch-chart-bar.focuslap {
  transform: translateY(-3px);
}

.lap-bar-item .batch-chart-bar-top {
  display: block;
  flex-shrink: 0;
}

.lap-bar-item .batch-chart-bar-fill {
  display: block;
  flex-shrink: 0;
  border-radius: 4px 4px 0 0;
}

.lap-bar-item .lap-bar {
  width: 100%;
  min-height: 10%;
  border-radius: 4px 4px 0 0;
  transition: opacity 0.2s;
}

.laps-container {
  min-height: 200px;
  background: rgb(var(--v-theme-surface));
  border-radius: 6px;
  padding: 16px;
}

.laps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lap-item {
  margin-bottom: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s;
}

.lap-item-expanded {
  background: rgba(var(--v-theme-surface), 0.5);
}

/* 浅色模式下分段内容区与展开项背景为白色 */
.v-theme--light .plan-editor .lap-body,
.v-theme--light .plan-editor .lap-item-expanded {
  background: #fff;
}
.v-theme--light .plan-editor .lap-body :deep(.lap_com_top) {
  background: #fff;
}

.lap-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(var(--v-theme-surface), 0.6);
  cursor: pointer;
  user-select: none;
  min-height: 40px;
}

.lap-header-bar:hover {
  background: rgba(var(--v-theme-surface), 0.9);
}

.lap-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.lap-index-badge {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 4px;
  color: #fff; /* keep white for contrast on custom-colored badge */
  font-size: 12px;
  font-weight: 600;
}

.lap-name-display {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lap-expand-toggle {
  flex-shrink: 0;
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  transition: transform 0.2s;
}

.lap-expand-toggle.expanded {
  transform: rotate(-180deg);
}

.lap-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.lap-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.lap-action-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.lap-action-copy:hover { color: rgb(var(--v-theme-primary)); }
.lap-action-delete:hover { color: rgb(var(--v-theme-error)); }
.lap-action-move.handle {
  cursor: move;
}

.lap-body {
  padding: 12px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
