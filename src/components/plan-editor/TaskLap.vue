<template>
  <div class="addtask" @mouseenter="showDel()" @mouseleave="hideDel()">
    <div :id="id">
      <div :class="[vall.t_type == 'normal' ? 'col-xs-12 col-sm-12 lap_com_top ' : 'col-xs-12 col-sm-12 lap_com_top ']">
        <!-- 编号已由外侧 PlanEditor lap-header-bar 的 lap-index-badge 展示，此处不再重复 -->

        <!-- 操作按钮组（与 PlanEditor 统一；由 TaskCom 使用时由外侧标题栏展示，此处隐藏）-->
        <div class="lap-actions-group" v-if="focus && shouldShowActions && showLapActions">
          <a @click="copy" class="lap-action-btn lap-action-copy" :title="t('tasklap_copy')">
            <v-icon size="small">mdi-content-copy</v-icon>
          </a>
          <a @click="del" class="lap-action-btn lap-action-delete" :title="t('tasklap_delete')">
            <v-icon size="small">mdi-delete-outline</v-icon>
          </a>
          <span class="lap-action-btn lap-action-move handle" :title="t('tasklap_move')">
            <v-icon size="small">mdi-drag</v-icon>
          </span>
        </div>

        <div class="lap_bg">
          <span style="display:block;float:left;font-size:20px;" v-if="false">训练</span>

          <div class="col-xs-12 col-sm-12 lap_item_1">
            <label class="lap_label">{{ t('tasklap_project') }}</label>

            <select class="col-xs-1 col-sm-1 tasklap_item_lab" v-model="vall.straining_step">
              <option v-for="item in vall.straining_steps[vall.type]" :key="item.value" :value="item.value">{{ getStepTitle(item) }}</option>
            </select>

            <div class="unit-value-wrapper">
              <picktime 
                :format="computed_unit_value_Format" 
                class="tasklap_item_lab unit-value-input" 
                v-model="vall.trainig_lap.unit_value"
              />
              <select class="tasklap_item_lab unit-select" v-model="vall.trainig_lap.unit">
                <template v-for="unitItem in vall.units" :key="unitItem.value">
                  <option :value="unitItem.value" v-if="!unitItem.no || !(Array.isArray(unitItem.no) && unitItem.no.includes(vall.type))">
                    {{ getUnitTitle(unitItem) }}
                  </option>
                </template>
              </select>
            </div>

            <!-- 强度类型标签 + 范围输入（与 tasklap 一致） -->
            <span v-if="vall.straining_step == 'run' || vall.straining_step == 'ride' || vall.straining_step == 'swim' || vall.straining_step == 'other'" class="intensity-type-label">{{ intensityTypeLabel }}</span>

            <div v-if="vall.straining_step == 'run' || vall.straining_step == 'ride' || vall.straining_step == 'swim' || vall.straining_step == 'other'" class="intensity-range-row">
              <div class="range-input-wrapper range-input-compact" :style="getInputBorderStyleForMin">
                <picktime :format="computedFormat" class="range-min-input-compact" v-model="vall.trainig_lap.range_min"
                  :pace-unit="vall.trainig_lap.pace_unit" :heart-range="vall.trainig_lap.range"
                  :intensity="vall.trainig_lap.intensity" :compare-value="vall.trainig_lap.range_max"
                  :is-min="true" :likes="likesInstance" :style="getInputBorderStyleForMin">
                </picktime>
                <span v-if="getZoneInfoForMin" class="zone-indicator" :style="getZoneIndicatorStyleForMin">
                  {{ getZoneInfoForMin.zone }}
                </span>
              </div>
              <span style="font-size:14px;">{{ t('tasklap_to') }}</span>
              <div class="range-input-wrapper range-input-compact" :style="getInputBorderStyleForMax">
                <picktime :format="computedFormat" class="range-max-input-compact" v-model="vall.trainig_lap.range_max"
                  :pace-unit="vall.trainig_lap.pace_unit" :heart-range="vall.trainig_lap.range"
                  :intensity="vall.trainig_lap.intensity" :compare-value="vall.trainig_lap.range_min"
                  :is-min="false" :likes="likesInstance" :style="getInputBorderStyleForMax">
                </picktime>
                <span v-if="getZoneInfoForMax" class="zone-indicator" :style="getZoneIndicatorStyleForMax">
                  {{ getZoneInfoForMax.zone }}
                </span>
              </div>
              <!-- 配速单位选择框（与 tasklap 一致） -->
              <select v-if="computedFormat == 'hour-minute-second'" class="pace-unit-select-compact" v-model="vall.trainig_lap.pace_unit" @change="changePace" style="width: 70px;">
                <option v-for="item in distances" :key="item.value" :value="item.value">{{ getPaceUnitTitle(item) }}</option>
              </select>
              <!-- 各种换算显示（与 tasklap 一致） -->
              <span v-if="actualPaceDisplay" class="actual-pace-display">({{ actualPaceDisplay }})</span>
              <span v-if="ltZoneHint" class="lt-zone-hint" :title="ltZoneHint">{{ ltZoneHint }}</span>
              <span v-if="hrrHeartDisplay" class="actual-pace-display">({{ hrrHeartDisplay }})</span>
              <span v-else-if="showHrrPlaceholder" class="actual-pace-display actual-pace-placeholder" :title="t('tasklap_need_hr_title')">({{ t('tasklap_need_hr') }})</span>
              <span v-if="vdotPaceDisplay" class="actual-pace-display">({{ vdotPaceDisplay }})</span>
              <span v-else-if="showVdotPlaceholder" class="actual-pace-display actual-pace-placeholder" :title="t('tasklap_need_vdot_title')">({{ t('tasklap_need_vdot') }})</span>
              <span v-if="ftpPowerDisplay" class="actual-pace-display">({{ ftpPowerDisplay }})</span>
              <span v-if="cssPaceDisplay" class="actual-pace-display">({{ cssPaceDisplay }})</span>
              <span v-if="tspPaceDisplay" class="actual-pace-display">({{ tspPaceDisplay }})</span>
              <span v-if="cpPowerDisplay" class="actual-pace-display">({{ cpPowerDisplay }})</span>
              <span v-if="mhrHeartDisplay" class="actual-pace-display">({{ mhrHeartDisplay }})</span>
              <span v-if="lthrHeartDisplay" class="actual-pace-display">({{ lthrHeartDisplay }})</span>
              <!-- 警示图标（与 tasklap 一致） -->
              <span class="warning-icon-wrapper" v-if="getWarningMessage">
                <v-icon size="small" :title="getWarningMessage" style="font-size: 16px; cursor: help;">mdi-help-circle-outline</v-icon>
                <span class="warning-tooltip">{{ getWarningMessage }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 从 Vue2 Options API 转换为 Vue3 兼容格式
// 保留原有逻辑，只修改导出方式
import { defineComponent, markRaw } from 'vue'
import PickTime from './PickTime.vue'
import { useLocale } from '@/composables/useLocale'

export default defineComponent({
  name: 'TaskLap',
  components: {
    picktime: PickTime
  },
  setup() {
    const { t } = useLocale()
    return { t }
  },
  props: {
    form: Object,
    vall: Object,
    index: Number,
    type: String,
    id: String,
    color: [String, Array],
    lap_type: String,
    parent_lap_type: String,
    tPace: Number,
    likes: Object,
    likesDataVersion: Number,
    ftp: Number,
    defaultIntensity: String,
    /** 是否显示内部操作按钮（在 TaskCom 内由外侧标题栏展示时传 false） */
    showLapActions: { type: Boolean, default: true }
  },
  emits: ['func', 'createtask'],
  data() {
    return {
      lap_index: 1,
      shouldHideIntensitySelects: false,
      likesInstance: null,
      currentFtp: null,  // 用于追踪 FTP 变化
      currentHeartMax: null,  // 用于追踪最大心率变化
      currentLthr: null  // 用于追踪阈值心率变化
    }
  },
  created() {
    // 确保 vall 有必要的数据结构
    if (!this.vall) {
      console.error('TaskLap: vall prop is required')
      return
    }
    
    // 初始化 straining_steps (与 likes.js 保持一致)
    if (!this.vall.straining_steps) {
      this.vall.straining_steps = {
        run: [
          { title: '跑步', value: 'run' },
          { title: '休息', value: 'rest' },
          { title: '肌力', value: 'muscle' },
          { title: '走路', value: 'walk' },
          { title: '慢跑', value: 'jog' },
          { title: '轻松跑', value: 'ez' },
          { title: '快跑', value: 'fast' },
          { title: '开放式', value: 'open' }
        ],
        other: [
          { title: '其他有氧', value: 'other' },
          { title: '休息', value: 'rest' },
          { title: '开放式', value: 'open' }
        ],
        muscle: [
          { title: '力量', value: 'muscle' },
          { title: '休息', value: 'rest' },
          { title: '开放式', value: 'open' }
        ],
        ride: [
          { title: '骑行', value: 'ride' },
          { title: '休息', value: 'rest' },
          { title: '开放式', value: 'open' }
        ],
        swim: [
          { title: '游泳', value: 'swim' },
          { title: '休息', value: 'rest' },
          { title: '开放式', value: 'open' }
        ]
      }
    }
    
    // 初始化 units (与 likes.js 保持一致)
    if (!this.vall.units) {
      this.vall.units = [
        { title: '分', value: 'min' },
        { title: '秒', value: 's' },
        { title: '米', value: 'm', no: 'other,muscle' },
        { title: '公里', value: 'km', no: 'other,muscle' },
        { title: '英里', value: 'miles', no: 'other,muscle' },
        { title: '次', value: 'c', no: 'ride,swim' }
      ]
    }
    
    // 初始化 code_keyword (与 likes_com tasklap 一致，用于构建 task 字符串时单位后缀)
    if (!this.vall.code_keyword) {
      this.vall.code_keyword = {
        min: 'min',
        s: 's',
        c: 'c',
        m: 'm',
        km: 'km',
        miles: 'miles'
      }
    }
    
    // 初始化 intensitys (与 likes.js 保持一致)
    if (!this.vall.intensitys) {
      this.vall.intensitys = {
        run: [
          { title: '速度', value: 'pace' },
          { title: '心率', value: 'heart' },
          { title: '体力', value: 'effort' },
          { title: '乳酸阈值', value: 'lt' },
          { title: '功率', value: 'power' }
        ],
        ride: [
          { title: '功率', value: 'ftp' },
          { title: '心率', value: 'heart' }
        ],
        swim: [
          { title: '配速', value: 'pace' }
        ],
        other: [
          { title: '心率', value: 'heart' },
          { title: '卡路里', value: 'calorie' }
        ]
      }
    }
    
    // 初始化 ranges (与 likes.js 保持一致)
    if (!this.vall.ranges) {
      this.vall.ranges = {
        pace: [
          { title: '区间', value: 'range', no: 'swim' },
          { title: '绝对值', value: 'number' },
          { title: 'css区间', value: 'css', no: 'run,ride' },
          { title: 'tsp区间', value: 'tsp', no: 'run,ride' }
        ],
        effort: [
          { title: '尽力区间', value: 'range' }
        ],
        heart: [
          { title: '储备心率区间', value: 'range', no: 'ride' },
          { title: '最大心百分比', value: 'mhrrange' },
          { title: 'LT乳酸阈值心率', value: 'lthrrange', no: 'run,other' },
          { title: '绝对值', value: 'number' }
        ],
        lt: [
          { title: '区间', value: 'range' }
        ],
        ftp: [
          { title: '区间', value: 'range' },
          { title: '绝对值', value: 'number' }
        ],
        power: [
          { title: '绝对值', value: 'number' },
          { title: '区间', value: 'range' }
        ],
        calorie: [
          { title: '绝对值', value: 'number' }
        ],
        speed: [
          { title: '时速', value: 'number' }
        ]
      }
    }
    
    // 确保 trainig_lap 存在（pace_unit 与 tasklap 一致用 '1000'）
    if (!this.vall.trainig_lap) {
      this.vall.trainig_lap = {
        unit: 'min',
        unit_value: 10,
        intensity: 'pace',
        range: 'range',
        range_min: 1.0,
        range_max: 2.0,
        pace_unit: '1000'
      }
    }
    if (!this.vall.trainig_lap.pace_unit || this.vall.trainig_lap.pace_unit === '/km') {
      this.vall.trainig_lap.pace_unit = '1000'
    }
  },
  computed: {
    // 判断是否应该显示操作按钮（直接复制原版逻辑）
    shouldShowActions() {
      // 检查是否在 taskcom 内部
      if (this.parent_lap_type === 'interval') {
        return true
      }
      // 最外层的 lap，不显示按钮（按钮已在标题栏）
      return false
    },
    computed_unit_value_Format() {
      // 与 likes_com tasklap.vue 一致：根据单位返回对应格式
      if (!this.vall?.trainig_lap) return 'number'
      const unit = this.vall.trainig_lap.unit
      switch (unit) {
        case 'min': return 'timeMinute'
        case 's': return 'timeSecond'
        case 'c': return 'times'
        case 'm': return 'distance'
        case 'km':
        case 'miles': return 'distance_km'
        default: return 'number'
      }
    },
    computedFormat() {
      // 与原版 tasklap.vue 保持一致的 format 计算逻辑
      if (!this.vall || !this.vall.trainig_lap) return 'area'
      
      const intensity = this.vall.trainig_lap.intensity
      const range_format = this.vall.trainig_lap.range
      
      switch (intensity) {
        case 'pace':
          if (range_format === 'range') {
            return 'area'  // VDOT 配速区间
          } else if (range_format === 'css') {
            return 'css'  // CSS 配速
          } else if (range_format === 'tsp') {
            return 'tsp'  // TSP 配速
          } else {
            return 'hour-minute-second'  // 绝对配速值
          }
        
        case 'effort':
          return 'percent'  // 体力百分比
        
        case 'heart':
          if (range_format === 'range') {
            return 'area'  // 储备心率区间
          } else if (range_format === 'mhrrange') {
            return 'percent'  // 最大心率百分比
          } else if (range_format === 'lthrrange') {
            return 'lthr'  // LT 心率
          } else {
            return 'heart'  // 心率绝对值
          }
        
        case 'lt':
          return 'lt'  // 乳酸阈值
        
        case 'power':
          if (range_format === 'range' || range_format === 'powerrange') {
            return 'percent'  // CP 阈值功率百分比
          } else {
            return 'power'  // 功率绝对值
          }
        
        case 'ftp':
          if (range_format === 'range') {
            return 'ftp'  // FTP 百分比
          } else {
            return 'ftpvalue'  // FTP 绝对值
          }
        
        case 'calorie':
          return 'calorie'  // 卡路里
        
        default:
          return 'area'
      }
    },
    // 强度类型名称（与 tasklap 一致：心率/配速/功率/体力/恢复）
    intensityTypeLabel() {
      if (!this.vall?.trainig_lap) return ''
      const intensity = this.vall.trainig_lap.intensity
      if (intensity === 'heart' || intensity === 'hrr' || intensity === 'mhr' || intensity === 'lthr') return this.t('tasklap_intensity_heart')
      if (intensity === 'pace' || intensity === 'vdot' || intensity === 'lt' || intensity === 'css' || intensity === 'tsp') return this.t('tasklap_intensity_pace')
      if (intensity === 'ftp' || intensity === 'cp') return this.t('tasklap_intensity_power')
      if (intensity === 'rpe' || intensity === 'effort') return this.t('tasklap_intensity_effort')
      if (intensity === 'rest') return this.t('tasklap_intensity_rest')
      return ''
    },
    // Zone 显示和换算（直接复制原版所有 computed 属性）
    getZoneInfoForMin() {
      if (!this.vall?.trainig_lap) return null
      return this.getZoneInfo(this.vall.trainig_lap.range_min, true)
    },
    getZoneInfoForMax() {
      if (!this.vall?.trainig_lap) return null
      return this.getZoneInfo(this.vall.trainig_lap.range_max, false)
    },
    getZoneIndicatorStyleForMin() {
      const zone = this.getZoneInfoForMin
      if (!zone) return {}
      return {
        backgroundColor: zone.color,
        color: '#ffffff'
      }
    },
    getZoneIndicatorStyleForMax() {
      const zone = this.getZoneInfoForMax
      if (!zone) return {}
      return {
        backgroundColor: zone.color,
        color: '#ffffff'
      }
    },
    getInputBorderStyleForMin() {
      const zone = this.getZoneInfoForMin
      if (!zone?.color) {
        return { 
          '--border-color': '#d9d9d9',
          borderColor: '#d9d9d9'
        }
      }
      return { 
        '--border-color': zone.color,
        borderColor: zone.color
      }
    },
    getInputBorderStyleForMax() {
      const zone = this.getZoneInfoForMax
      if (!zone?.color) {
        return { 
          '--border-color': '#d9d9d9',
          borderColor: '#d9d9d9'
        }
      }
      return { 
        '--border-color': zone.color,
        borderColor: zone.color
      }
    },
    // 是否处于 VDOT 模式但暂无换算结果（显示占位提示）
    showVdotPlaceholder() {
      if (!this.vall?.trainig_lap) return false
      if (this.vall.trainig_lap.intensity !== 'pace' || this.vall.trainig_lap.range !== 'range') return false
      return !this.vdotPaceDisplay
    },
    // 是否处于 HRR 模式但暂无换算结果（显示占位提示）
    showHrrPlaceholder() {
      if (!this.vall?.trainig_lap) return false
      if (this.vall.trainig_lap.intensity !== 'heart' || this.vall.trainig_lap.range !== 'range') return false
      return !this.hrrHeartDisplay
    },
    // 换算显示 - VDOT 配速区间（与 likes_com tasklap.vue vdotPaceDisplay 一致）
    vdotPaceDisplay() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'pace' || this.vall.trainig_lap.range !== 'range') return ''
      const _version = this.likesDataVersion
      const likes = this.likesInstance || this.likes
      if (!likes) return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''
      
      try {
        const minRate = parseFloat(this.vall.trainig_lap.range_min)
        const maxRate = parseFloat(this.vall.trainig_lap.range_max)
        if (isNaN(minRate) || isNaN(maxRate)) return ''
        
        let paceResForCalc = likes.pace_res
        if (!paceResForCalc || (typeof paceResForCalc !== 'object' && !Array.isArray(paceResForCalc))) return ''
        if (paceResForCalc && !Array.isArray(paceResForCalc) && typeof paceResForCalc === 'object') {
          const arr = []
          Object.keys(paceResForCalc).forEach(key => {
            arr[key] = paceResForCalc[key]
          })
          paceResForCalc = arr
        }
        
        let minPaceSeconds = null
        let maxPaceSeconds = null
        if (typeof likes.getPaceByRate === 'function') {
          minPaceSeconds = likes.getPaceByRate(paceResForCalc, minRate, 'vdot')
          maxPaceSeconds = likes.getPaceByRate(paceResForCalc, maxRate, 'vdot')
        }
        if (minPaceSeconds == null || maxPaceSeconds == null || minPaceSeconds === 0 || maxPaceSeconds === 0) {
          minPaceSeconds = this.getPaceByRateLocal(paceResForCalc, minRate)
          maxPaceSeconds = this.getPaceByRateLocal(paceResForCalc, maxRate)
        }
        if (minPaceSeconds == null || maxPaceSeconds == null || minPaceSeconds === 0 || maxPaceSeconds === 0) {
          return ''
        }
        
        const formatPace = (seconds) => {
          if (isNaN(seconds) || seconds < 0) return "0'00"
          if (seconds > 3600) return "60'00"
          const minutes = Math.floor(seconds / 60)
          const secs = Math.round(seconds % 60)
          return `${minutes}'${secs.toString().padStart(2, '0')}`
        }
        
        return `${formatPace(minPaceSeconds)}-${formatPace(maxPaceSeconds)}`
      } catch (error) {
        return ''
      }
    },
    // 换算显示 - HRR 储备心率区间（与 likes_com tasklap.vue hrrHeartDisplay 一致）
    hrrHeartDisplay() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'heart' || this.vall.trainig_lap.range !== 'range') return ''
      const _version = this.likesDataVersion
      const likes = this.likesInstance || this.likes
      if (!likes) return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''
      
      try {
        const minRate = parseFloat(this.vall.trainig_lap.range_min)
        const maxRate = parseFloat(this.vall.trainig_lap.range_max)
        if (isNaN(minRate) || isNaN(maxRate)) return ''
        
        let minHeart = null
        let maxHeart = null
        if (likes.heart_res && typeof likes.getHrrByRate === 'function') {
          minHeart = likes.getHrrByRate(likes.heart_res, minRate)
          maxHeart = likes.getHrrByRate(likes.heart_res, maxRate)
        }
        if (minHeart == null || maxHeart == null || minHeart === 0 || maxHeart === 0) {
          minHeart = this.getHrrByRateLocal(likes, minRate)
          maxHeart = this.getHrrByRateLocal(likes, maxRate)
        }
        if (minHeart == null || maxHeart == null) {
          return ''
        }
        
        return `${minHeart}-${maxHeart} bpm`
      } catch (error) {
        return ''
      }
    },
    // 换算显示 - LT 阈值配速区间
    actualPaceDisplay() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'lt' || this.vall.trainig_lap.range !== 'range') return ''
      
      const likes = this.likesInstance
      const tPaceValue = this.tPace || this.vall?.tPace || likes?.tPace
      const tPaceNum = typeof tPaceValue === 'string' ? parseFloat(tPaceValue) : tPaceValue
      if (!tPaceNum || tPaceNum <= 0) return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''
      
      try {
        const parsePercent = (str) => {
          if (!str) return null
          const strValue = String(str)
          if (strValue.includes('%')) {
            return parseFloat(strValue.replace('%', '')) / 100
          }
          const num = parseFloat(strValue)
          if (isNaN(num)) return null
          if (num >= 0 && num <= 2) return num
          if (num > 2 && num <= 200) return num / 100
          return null
        }
        
        const minCoeff = parsePercent(this.vall.trainig_lap.range_min)
        const maxCoeff = parsePercent(this.vall.trainig_lap.range_max)
        if (!minCoeff || !maxCoeff) return ''
        
        const minPaceSeconds = tPaceNum / minCoeff
        const maxPaceSeconds = tPaceNum / maxCoeff
        
        const formatPace = (seconds) => {
          if (isNaN(seconds) || seconds < 0) return "0'00"
          if (seconds > 3600) return "60'00"
          const minutes = Math.floor(seconds / 60)
          const secs = Math.round(seconds % 60)
          return `${minutes}'${secs.toString().padStart(2, '0')}`
        }
        
        return `${formatPace(minPaceSeconds)}-${formatPace(maxPaceSeconds)}`
      } catch (error) {
        return ''
      }
    },
    ltZoneHint() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'lt' || this.vall.trainig_lap.range !== 'range') return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''
      
      try {
        const minZone = this.getLtZone(this.vall.trainig_lap.range_min)
        const maxZone = this.getLtZone(this.vall.trainig_lap.range_max)
        if (minZone && maxZone) return `${minZone}-${maxZone}`
      } catch (error) {
        return ''
      }
      return ''
    },
    // 换算显示 - FTP 百分比
    ftpPowerDisplay() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'ftp' || this.vall.trainig_lap.range !== 'range') return ''
      
      const likes = this.likesInstance
      const ftpValue = this.ftp || likes?.ftp
      const ftpNum = typeof ftpValue === 'string' ? parseFloat(ftpValue) : ftpValue
      if (!ftpNum || ftpNum <= 0) return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''
      
      try {
        const parsePercent = (str) => {
          if (!str) return null
          const strValue = String(str)
          if (strValue.includes('%')) return parseFloat(strValue.replace('%', '')) / 100
          const num = parseFloat(strValue)
          if (isNaN(num)) return null
          if (num >= 0 && num <= 2) return num
          if (num > 2 && num <= 200) return num / 100
          return null
        }
        
        const minPercent = parsePercent(this.vall.trainig_lap.range_min)
        const maxPercent = parsePercent(this.vall.trainig_lap.range_max)
        if (!minPercent || !maxPercent) return ''
        
        const minPower = Math.round(ftpNum * minPercent)
        const maxPower = Math.round(ftpNum * maxPercent)
        return `${minPower}-${maxPower} W`
      } catch (error) {
        return ''
      }
    },
    // 换算显示 - CSS 配速
    cssPaceDisplay() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'pace' || this.vall.trainig_lap.range !== 'css') return ''
      
      const likes = this.likesInstance
      if (!likes?.swim_css) return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''
      
      try {
        const parsePercent = (str) => {
          if (!str) return null
          const strValue = String(str)
          if (strValue.includes('%')) return parseFloat(strValue.replace('%', '')) / 100
          const num = parseFloat(strValue)
          if (isNaN(num)) return null
          if (num >= 0 && num <= 2) return num
          if (num > 2 && num <= 200) return num / 100
          return null
        }
        
        const minCoeff = parsePercent(this.vall.trainig_lap.range_min)
        const maxCoeff = parsePercent(this.vall.trainig_lap.range_max)
        if (!minCoeff || !maxCoeff) return ''
        
        const cssValue = likes.swim_css
        const minPaceSeconds = cssValue / minCoeff
        const maxPaceSeconds = cssValue / maxCoeff
        
        const formatPace = (seconds) => {
          if (isNaN(seconds) || seconds < 0) return "0'00"
          if (seconds > 3600) return "60'00"
          const minutes = Math.floor(seconds / 60)
          const secs = Math.round(seconds % 60)
          return `${minutes}'${secs.toString().padStart(2, '0')}`
        }
        
        return `${formatPace(minPaceSeconds)}-${formatPace(maxPaceSeconds)}/100m`
      } catch (error) {
        return ''
      }
    },
    // 换算显示 - TSP 配速
    tspPaceDisplay() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'pace' || this.vall.trainig_lap.range !== 'tsp') return ''
      
      const likes = this.likesInstance
      if (!likes?.tsp_pace) return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''
      
      try {
        const parsePercent = (str) => {
          if (!str) return null
          const strValue = String(str)
          if (strValue.includes('%')) return parseFloat(strValue.replace('%', '')) / 100
          const num = parseFloat(strValue)
          if (isNaN(num)) return null
          if (num >= 0 && num <= 2) return num
          if (num > 2 && num <= 200) return num / 100
          return null
        }
        
        const minCoeff = parsePercent(this.vall.trainig_lap.range_min)
        const maxCoeff = parsePercent(this.vall.trainig_lap.range_max)
        if (!minCoeff || !maxCoeff) return ''
        
        const tspValue = likes.tsp_pace
        const minPaceSeconds = tspValue / minCoeff
        const maxPaceSeconds = tspValue / maxCoeff
        
        const formatPace = (seconds) => {
          if (isNaN(seconds) || seconds < 0) return "0'00"
          if (seconds > 3600) return "60'00"
          const minutes = Math.floor(seconds / 60)
          const secs = Math.round(seconds % 60)
          return `${minutes}'${secs.toString().padStart(2, '0')}`
        }
        
        return `${formatPace(minPaceSeconds)}-${formatPace(maxPaceSeconds)}/100m`
      } catch (error) {
        return ''
      }
    },
    // 换算显示 - CP 功率百分比
    cpPowerDisplay() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'power' || this.vall.trainig_lap.range !== 'powerrange') return ''
      
      const likes = this.likesInstance
      if (!likes?.critical_power) return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''
      
      try {
        const parsePercent = (str) => {
          if (!str) return null
          const strValue = String(str)
          if (strValue.includes('%')) return parseFloat(strValue.replace('%', '')) / 100
          const num = parseFloat(strValue)
          if (isNaN(num)) return null
          if (num >= 0 && num <= 2) return num
          if (num > 2 && num <= 200) return num / 100
          return null
        }
        
        const minPercent = parsePercent(this.vall.trainig_lap.range_min)
        const maxPercent = parsePercent(this.vall.trainig_lap.range_max)
        if (!minPercent || !maxPercent) return ''
        
        const cpValue = likes.critical_power
        const minPower = Math.round(cpValue * minPercent)
        const maxPower = Math.round(cpValue * maxPercent)
        return `${minPower}-${maxPower} W`
      } catch (error) {
        return ''
      }
    },
    // 换算显示 - MHR 最大心率百分比
    mhrHeartDisplay() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'heart' || this.vall.trainig_lap.range !== 'mhrrange') return ''
      
      const likes = this.likesInstance
      let heartMax = null
      if (likes) {
        if (this.vall.straining_step === 'run') {
          heartMax = likes.heart_max
        } else if (this.vall.straining_step === 'ride') {
          heartMax = likes.ride_heart_max
        } else {
          heartMax = likes.heart_max || likes.ride_heart_max
        }
      }
      
      if (!heartMax || heartMax <= 0) return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''
      
      try {
        const parsePercent = (str) => {
          if (!str) return null
          const strValue = String(str)
          if (strValue.includes('%')) return parseFloat(strValue.replace('%', '')) / 100
          const num = parseFloat(strValue)
          if (isNaN(num)) return null
          if (num >= 0 && num <= 1) return num
          if (num > 1 && num <= 100) return num / 100
          return null
        }
        
        const minPercent = parsePercent(this.vall.trainig_lap.range_min)
        const maxPercent = parsePercent(this.vall.trainig_lap.range_max)
        if (!minPercent || !maxPercent) return ''
        
        const minHeart = Math.round(heartMax * minPercent)
        const maxHeart = Math.round(heartMax * maxPercent)
        return `${minHeart}-${maxHeart} bpm`
      } catch (error) {
        return ''
      }
    },
    // 换算显示 - LTHR 阈值心率百分比
    lthrHeartDisplay() {
      if (!this.vall?.trainig_lap) return ''
      if (this.vall.trainig_lap.intensity !== 'heart' || this.vall.trainig_lap.range !== 'lthrrange') return ''
      if (this.vall.straining_step !== 'ride') return ''

      const likes = this.likesInstance
      const lthr = likes?.ride_heart_lt
      if (!lthr || lthr <= 0) return ''
      if (!this.vall.trainig_lap.range_min || !this.vall.trainig_lap.range_max) return ''

      try {
        const parsePercent = (str) => {
          if (!str) return null
          const strValue = String(str)
          if (strValue.includes('%')) return parseFloat(strValue.replace('%', '')) / 100
          const num = parseFloat(strValue)
          if (isNaN(num)) return null
          if (num >= 0 && num <= 2) return num
          if (num > 1 && num <= 200) return num / 100
          return null
        }

        const minPercent = parsePercent(this.vall.trainig_lap.range_min)
        const maxPercent = parsePercent(this.vall.trainig_lap.range_max)
        if (!minPercent || !maxPercent) return ''

        const minHeart = Math.round(lthr * minPercent)
        const maxHeart = Math.round(lthr * maxPercent)
        return `${minHeart}-${maxHeart} bpm`
      } catch (error) {
        return ''
      }
    },
    // 警示提示消息（与 tasklap 一致）
    getWarningMessage() {
      if (!this.vall?.trainig_lap) return null
      const range = this.vall.trainig_lap.range
      const intensity = this.vall.trainig_lap.intensity
      if (range === 'range' && range !== 'mhrrange' && (intensity === 'pace' || intensity === 'heart')) {
        return this.t('tasklap_warning_range')
      }
      if (range === 'mhrrange' && intensity === 'heart') {
        return this.t('tasklap_warning_mhr') + (this.mhrHeartDisplay || '')
      }
      if (range === 'lthrrange' && intensity === 'heart') {
        return this.t('tasklap_warning_lthr') + (this.lthrHeartDisplay || '')
      }
      if (range === 'range' && intensity === 'lt') {
        const vdotMin = this.getVdot(this.vall.trainig_lap.range_min)
        const vdotMax = this.getVdot(this.vall.trainig_lap.range_max)
        return this.t('tasklap_warning_lt') + `${vdotMin}-${vdotMax}`
      }
      if (range === 'css' && intensity === 'pace') return this.t('tasklap_warning_css')
      if (range === 'tsp' && intensity === 'pace') return this.t('tasklap_warning_tsp')
      if (range === 'number' && intensity === 'pace') return this.t('tasklap_warning_pace_number')
      if (range === 'number' && intensity === 'heart') return this.t('tasklap_warning_heart_number')
      if (range === 'range' && intensity === 'effort') return this.t('tasklap_warning_effort')
      if (range === 'number' && intensity === 'power') return this.t('tasklap_warning_power_number')
      if ((range === 'range' || range === 'powerrange') && intensity === 'power') {
        return this.t('tasklap_warning_cp') + (this.cpPowerDisplay || '')
      }
      return null
    }
  },
  watch: {
    likes: {
      handler(newVal) {
        // markRaw 防止 Vue 代理 Mylikes 实例，避免访问私有字段 #vdot_lt_index 报错
        this.likesInstance = newVal ? markRaw(newVal) : null
      },
      immediate: true
    }
  },
  mounted() {
    this.lap_index = (this.index || 0) + 1
    if (this.likesInstance == null && this.likes) this.likesInstance = markRaw(this.likes)
    const pu = Number(this.vall?.trainig_lap?.pace_unit)
    if (!isNaN(pu)) this.last_pace_unit = pu
  },
  data() {
    return {
      focus: false,
      lap_index: 1,
      likesInstance: null,
      // 配速单位选项（与 tasklap 一致）
      distances: [
        { title: '/1km', value: '1000' },
        { title: '/3km', value: '3000' },
        { title: '/5km', value: '5000' },
        { title: '/1.6km', value: '1600' },
        { title: '/1miles', value: '1609.344' },
        { title: '/800m', value: '800' },
        { title: '/100m', value: '100' },
        { title: '/200m', value: '200' },
        { title: '/400m', value: '400' }
      ],
      last_pace_unit: 1000
    }
  },
  methods: {
    getStepTitle(item) {
      if (!item?.value) return item?.title ?? ''
      const key = 'tasklap_step_' + item.value
      const translated = this.t(key)
      return translated !== key ? translated : (item.title || '')
    },
    getUnitTitle(item) {
      if (!item?.value) return item?.title ?? ''
      const key = 'tasklap_unit_' + item.value
      const translated = this.t(key)
      return translated !== key ? translated : (item.title || '')
    },
    getPaceUnitTitle(item) {
      if (!item?.value) return item?.title ?? ''
      const key = 'tasklap_pace_unit_' + String(item.value).replace('.', '_')
      const translated = this.t(key)
      return translated !== key ? translated : (item.title || '')
    },
    showDel() {
      this.focus = true
    },
    hideDel() {
      this.focus = false
    },
    // 操作方法（直接复制原版）
    del() {
      this.$emit('func', {
        index: this.index,
        id: this.id,
        lap_type: this.lap_type,
        action: 'del'
      })
    },
    copy() {
      this.$emit('func', {
        index: this.index,
        id: this.id,
        lap_type: this.lap_type,
        action: 'copy'
      })
    },
    up() {
      this.$emit('func', {
        index: this.index,
        id: this.id,
        lap_type: this.lap_type,
        action: 'up'
      })
    },
    down() {
      this.$emit('func', {
        index: this.index,
        id: this.id,
        lap_type: this.lap_type,
        action: 'down'
      })
    },
    changeDefault() {
      // 强度类型变化时的处理
    },
    // 配速单位切换时换算 min/max（与 tasklap 一致）
    changePace() {
      const paceUnit = Number(this.vall.trainig_lap.pace_unit) || 1000
      const unitPrev = this.last_pace_unit || 1000
      const max = this.getPaceSecond(this.vall.trainig_lap.range_max)
      const min = this.getPaceSecond(this.vall.trainig_lap.range_min)
      if (max !== '' && !isNaN(max) && min !== '' && !isNaN(min)) {
        const newMax = Math.round(max / 1000 * paceUnit)
        const newMin = Math.round(min / 1000 * paceUnit)
        this.vall.trainig_lap.range_max = this.getSecondPace(newMax)
        this.vall.trainig_lap.range_min = this.getSecondPace(newMin)
      }
      this.last_pace_unit = paceUnit
    },
    // 配速字符串转秒数（当前单位下的秒数，与 tasklap 逻辑一致）
    getPaceSecond(str) {
      if (!str) return ''
      if (typeof str === 'number' && !isNaN(str)) return str
      const s = String(str).trim()
      if (!s) return ''
      const match = s.match(/^(\d+)[':](\d+)$/)
      if (match) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        if (!isNaN(minutes) && !isNaN(seconds)) {
          let secs = minutes * 60 + seconds
          const unit = Number(this.last_pace_unit) || 1000
          secs = secs / unit * 1000
          return secs
        }
      }
      return ''
    },
    // 秒数转配速字符串 m'ss（与 tasklap 一致）
    getSecondPace(num) {
      if (num === '' || num === null || num === undefined || isNaN(num)) return ''
      const unit = Number(this.vall?.trainig_lap?.pace_unit) || Number(this.last_pace_unit) || 1000
      const secs = (num * unit) / 1000
      const m = Math.floor(secs / 60)
      const s = Math.round(secs % 60)
      return `${m}'${String(s).padStart(2, '0')}`
    },
    // LT 系数对应配速区间显示（用于 getWarningMessage，与 tasklap getVdot 一致）
    getVdot(lt) {
      try {
        const likes = this.likesInstance
        if (likes && typeof likes.getVdotByLt === 'function') {
          return likes.getVdotByLt(lt) || '*'
        }
      } catch (_) {
        // Mylikes 被 Vue 代理时会无法访问私有字段，忽略
      }
      return '*'
    },
    // getZoneInfo 方法（直接复制原版）
    getZoneInfo(value, isMin) {
      if (!value || value === '') return null
      
      const format = this.computedFormat
      const intensity = this.vall?.trainig_lap?.intensity
      const range = this.vall?.trainig_lap?.range
      const likes = this.likesInstance
      
      if (!likes) return null
      
      // 定义 zone 按钮（与 time.vue 保持一致）
      const zoneButtons = [
        { value: 0.0, zone: 'Z0', label: '恢复区', color: '#2196F3' },
        { value: 1.0, zone: 'Z1', label: 'E 有氧区间', color: '#4CAF50' },
        { value: 2.0, zone: 'Z2', label: 'M 马拉松比赛区间', color: '#8BC34A' },
        { value: 3.0, zone: 'Z3', label: 'T 乳酸阈值区间', color: '#FFC107' },
        { value: 4.0, zone: 'Z4', label: 'A 无氧区间', color: '#FF9800' },
        { value: 5.0, zone: 'Z5', label: 'I 最大摄氧量区间', color: '#FF5722' },
        { value: 6.0, zone: 'Z6', label: 'R 速度区间', color: '#F44336' }
      ]
      
      let zone = null
      
      // area 格式（VDOT 区间、HRR 区间）
      if (format === 'area') {
        const numValue = parseFloat(value)
        if (isNaN(numValue)) return null
        
        // 找到对应的 zone
        for (let i = zoneButtons.length - 1; i >= 0; i--) {
          if (numValue >= zoneButtons[i].value) {
            zone = zoneButtons[i]
            break
          }
        }
      }
      
      return zone
    },
    // 获取 LT zone 标识（直接复制原版）
    getLtZone(value) {
      if (!value) return ''
      const likes = this.likesInstance
      if (!likes || typeof likes.getVdotByLt !== 'function') return ''
      return likes.getVdotByLt(value)
    },
    // VDOT 配速本地计算（与 Mylikes get_pace_by_rate vdot 分支一致，支持 min_second/max_second 或 left_value/right_value）
    getPaceByRateLocal(paceResForCalc, rate) {
      if (!paceResForCalc || rate == null || rate === '') return null
      const level = ['e', 'm', 't', 'a', 'i', 'r']
      const rateStr = String(rate)
      let index
      let _rate
      if (rateStr.includes('.')) {
        const rateArr = rateStr.split('.')
        index = parseInt(rateArr[0], 10)
        _rate = parseFloat('0.' + rateArr[1]) || 0
      } else {
        index = parseInt(rateStr, 10) || 0
        _rate = 0
      }
      const areaIndex = level[index - 1] || 'e'
      const zone = paceResForCalc[areaIndex]
      if (!zone) return null
      let minSecond = Number(zone.min_second ?? zone.left_value)
      let maxSecond = Number(zone.max_second ?? zone.right_value)
      if (isNaN(minSecond) || minSecond <= 0) return null
      if (!maxSecond || isNaN(maxSecond)) maxSecond = minSecond
      let diff
      if (index > 0) {
        diff = (minSecond - maxSecond) * _rate
      } else {
        const walkPace = minSecond > 480 ? minSecond : 480
        diff = -(walkPace - minSecond) * (1 - _rate)
      }
      return Math.floor(minSecond - diff)
    },
    // HRR 心率本地计算（储备心率公式：rest + (max - rest) * rate/6）
    getHrrByRateLocal(likes, rate) {
      if (!likes || rate == null || rate === '') return null
      const heartMin = likes.heart_min != null ? Number(likes.heart_min) : 60
      const heartMax = likes.heart_max != null ? Number(likes.heart_max) : 190
      const r = parseFloat(rate)
      if (isNaN(r) || r < 0) return null
      const reserve = heartMax - heartMin
      const heart = Math.round(heartMin + reserve * (r / 6))
      return Math.min(Math.max(heart, heartMin), heartMax)
    },
    // getMin/getMax（与 likes_com tasklap 一致，用于 createTask 构建 task 字符串时 min/max 的换算）
    getMin() {
      if (!this.vall?.trainig_lap) return ''
      const tl = this.vall.trainig_lap
      if (tl.range === 'number' && tl.intensity === 'pace') {
        return this.getSecondPace(this.getPaceSecond(tl.range_min))
      }
      return tl.range_min
    },
    getMax() {
      if (!this.vall?.trainig_lap) return ''
      const tl = this.vall.trainig_lap
      if (tl.range === 'number' && tl.intensity === 'pace') {
        return this.getSecondPace(this.getPaceSecond(tl.range_max))
      }
      return tl.range_max
    }
  }
})
</script>

<style scoped>
/* 保留原有样式 */
.addtask {
  position: relative;
  margin-bottom: 10px;
}

.lap_com_top {
  padding: 10px;
  background: rgb(var(--v-theme-surface));
  border-radius: 4px;
  position: relative;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-weight: bold;
}

.lap_bg {
  margin-left: 40px;
}

/* 操作按钮组（与 PlanEditor 统一：复制、删除、移动）*/
.lap-actions-group {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}

.lap-actions-group .lap-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgba(var(--v-theme-on-surface), 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.lap-actions-group .lap-action-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.lap-action-copy:hover {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
}

.lap-action-delete:hover {
  border-color: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-error));
}

.lap-action-move.handle {
  cursor: move;
}

/* Zone 指示器样式 - 确保在输入框之上且不被遮挡 */
.zone-indicator {
  position: absolute;
  top: -8px;
  right: 4px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 100;
  pointer-events: none;
}

.range-input-wrapper {
  position: relative;
  display: inline-block;
  padding-right: 28px;
  box-sizing: border-box;
}

.range-input-wrapper :deep(.picktime-wrapper) {
  max-width: 100%;
  box-sizing: border-box;
}
.range-input-wrapper :deep(.picktime-input) {
  max-width: 100%;
  box-sizing: border-box;
}

.intensity-range-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
}

.intensity-type-label {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

/* 换算值显示样式 */
.actual-pace-display {
  margin-left: 8px;
  font-size: 12px;
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  white-space: nowrap;
}

.actual-pace-placeholder {
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.lt-zone-hint {
  margin-left: 6px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
}

.lap_item_1 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.lap_label {
  font-weight: 500;
  margin-right: 8px;
}

.tasklap_item_lab {
  padding: 4px 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.unit-value-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 警示图标与悬浮提示（与 tasklap 一致）*/
.warning-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.warning-icon-wrapper .warning-tooltip {
  visibility: hidden;
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 4px;
  padding: 6px 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface));
  white-space: normal;
  word-wrap: break-word;
  word-break: normal;
  writing-mode: horizontal-tb;
  text-align: left;
  max-width: 320px;
  min-width: 120px;
  z-index: 10000;
}
.warning-icon-wrapper:hover .warning-tooltip {
  visibility: visible;
}

/* 移动端：强度/范围行垂直排列，输入框 100% 宽度、左对齐 */
@media (max-width: 767px) {
  .lap_item_1 {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .lap_item_1 .lap_label {
    margin-right: 0;
  }
  .lap_item_1 select.tasklap_item_lab {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .lap_item_1 .unit-value-wrapper {
    width: 100%;
  }
  .lap_item_1 .unit-value-wrapper .unit-value-input,
  .lap_item_1 .unit-value-wrapper .unit-select {
    flex: 1;
    min-width: 0;
  }
  .lap_item_1 .intensity-type-label {
    margin-left: 0;
  }
  .intensity-range-row {
    flex-direction: column;
    align-items: stretch;
    margin-left: 0;
    width: 100%;
    gap: 8px;
  }
  .intensity-range-row .range-input-wrapper {
    width: 100%;
    max-width: 100%;
    padding-right: 8px;
  }
  .intensity-range-row .range-input-wrapper :deep(.picktime-wrapper),
  .intensity-range-row .range-input-wrapper :deep(.picktime-input) {
    width: 100%;
    max-width: 100%;
  }
  .intensity-range-row .pace-unit-select-compact {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
}
</style>
