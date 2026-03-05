<template>
  <div class="picktime-wrapper" ref="picktimeWrapper" v-click-outside="clickOutsideArgs">
    <!-- 显示输入框 - 点击弹出选择器 -->
    <input 
      type="text"
      :value="displayValue"
      @click="openPicker"
      class="picktime-input"
      :class="{ 'picker-open': isOpen }"
      :placeholder="getPlaceholder"
      readonly
    />
    
    <!-- 弹出选择器：挂到 body 顶层，避免被父容器盖住 -->
    <Teleport to="body">
      <div
        ref="pickerDropdownRef"
        v-show="isOpen"
        class="picker-dropdown picker-dropdown-teleport"
        :style="dropdownStyle"
        @mousedown.stop
      >
      <!-- 配速区间 (area - VDOT)：区间快捷 + 快捷数字 + 自定义 -->
      <template v-if="format === 'area'">
        <div class="zone-buttons">
          <button 
            v-for="zone in areaZoneButtons" 
            :key="zone.value"
            @click="selectZone(zone.value)"
            :class="['zone-btn', { 'active': isZoneValueEqual(modelValue, zone.value) }]"
            :style="{ backgroundColor: zone.color }"
            :title="zone.label">
            {{ zone.zone }}
          </button>
        </div>
        <div class="zone-quick-numbers">
          <span class="zone-quick-label">{{ t('picktime_quick') }}:</span>
          <button v-for="n in areaQuickNumbers" :key="n" class="quick-btn" :class="{ active: isZoneValueEqual(modelValue, n) }" @click="selectZone(n)">{{ n }}</button>
        </div>
        <div class="zone-custom-input">
          <label>{{ t('picktime_custom_area') }}</label>
          <input type="number" v-model.number="customValue" step="0.1" min="0.5" max="6" class="custom-number-input" @keyup.enter="selectCustom" />
          <button @click="selectCustom" class="confirm-btn">{{ t('picktime_confirm') }}</button>
        </div>
      </template>
      
      <!-- FTP 功率百分比：区间 + 快捷数字 + 自定义 -->
      <template v-else-if="format === 'ftp'">
        <div class="zone-buttons">
          <button v-for="zone in ftpZoneButtons" :key="zone.value" @click="selectZone(zone.value)" :class="['zone-btn', { 'active': isZoneValueEqual(modelValue, zone.value) }]" :style="{ backgroundColor: zone.color }" :title="zone.label">{{ zone.zone }}</button>
        </div>
        <div class="zone-quick-numbers">
          <span class="zone-quick-label">{{ t('picktime_quick') }}:</span>
          <button v-for="n in percentQuickNumbers" :key="n" class="quick-btn" :class="{ active: isZoneValueEqual(modelValue, n) }" @click="selectZone(n)">{{ Math.round(n * 100) }}%</button>
        </div>
        <div class="zone-custom-input">
          <label>{{ t('picktime_custom_percent') }}</label>
          <input type="number" v-model.number="customValuePercent" step="1" min="0" max="150" class="custom-number-input" @keyup.enter="selectCustom" />
          <button @click="selectCustom" class="confirm-btn">{{ t('picktime_confirm') }}</button>
        </div>
      </template>
      
      <!-- CSS 配速：区间 + 快捷数字 + 自定义 -->
      <template v-else-if="format === 'css'">
        <div class="zone-buttons">
          <button 
            v-for="zone in cssZoneButtons" 
            :key="zone.value"
            @click="selectZone(zone.value)"
            :class="['zone-btn', { 'active': isZoneValueEqual(modelValue, zone.value) }]"
            :style="{ backgroundColor: zone.color }"
            :title="zone.label">
            {{ zone.zone }}
          </button>
        </div>
        <div class="zone-quick-numbers">
          <span class="zone-quick-label">{{ t('picktime_quick') }}:</span>
          <button v-for="n in cssQuickNumbers" :key="n" class="quick-btn" :class="{ active: isZoneValueEqual(modelValue, n) }" @click="selectZone(n)">{{ (n * 100) }}%</button>
        </div>
        <div class="zone-custom-input">
          <label>{{ t('picktime_custom_percent') }}</label>
          <input type="number" v-model.number="customValuePercent" step="1" min="60" max="120" class="custom-number-input" @keyup.enter="selectCustom" />
          <button @click="selectCustom" class="confirm-btn">{{ t('picktime_confirm') }}</button>
        </div>
      </template>
      
      <!-- TSP 配速：区间 + 快捷数字 + 自定义 -->
      <template v-else-if="format === 'tsp'">
        <div class="zone-buttons">
          <button 
            v-for="zone in tspZoneButtons" 
            :key="zone.value"
            @click="selectZone(zone.value)"
            :class="['zone-btn', { 'active': isZoneValueEqual(modelValue, zone.value) }]"
            :style="{ backgroundColor: zone.color }"
            :title="zone.label">
            {{ zone.zone }}
          </button>
        </div>
        <div class="zone-quick-numbers">
          <span class="zone-quick-label">{{ t('picktime_quick') }}:</span>
          <button v-for="n in tspQuickNumbers" :key="n" class="quick-btn" :class="{ active: isZoneValueEqual(modelValue, n) }" @click="selectZone(n)">{{ (n * 100) }}%</button>
        </div>
        <div class="zone-custom-input">
          <label>{{ t('picktime_custom_percent_85') }}</label>
          <input type="number" v-model.number="customValuePercent" step="1" min="85" max="110" class="custom-number-input" @keyup.enter="selectCustom" />
          <button @click="selectCustom" class="confirm-btn">{{ t('picktime_confirm') }}</button>
        </div>
      </template>
      
      <!-- 乳酸阈值 (lt/lthr)：区间 + 快捷数字 + 自定义 -->
      <template v-else-if="format === 'lt' || format === 'lthr'">
        <div class="zone-buttons">
          <button 
            v-for="zone in ltZoneButtons" 
            :key="zone.value"
            @click="selectZone(zone.value)"
            :class="['zone-btn', { 'active': isZoneValueEqual(modelValue, zone.value) }]"
            :style="{ backgroundColor: zone.color }"
            :title="zone.label">
            {{ zone.zone }}
          </button>
        </div>
        <div class="zone-quick-numbers">
          <span class="zone-quick-label">{{ t('picktime_quick') }}:</span>
          <button v-for="n in ltQuickNumbers" :key="n" class="quick-btn" :class="{ active: isZoneValueEqual(modelValue, n) }" @click="selectZone(n)">{{ Math.round(n * 100) }}%</button>
        </div>
        <div class="zone-custom-input">
          <label>{{ t('picktime_custom_lt') }}</label>
          <input type="number" v-model.number="customValuePercent" step="1" min="79" max="117" class="custom-number-input" @keyup.enter="selectCustom" />
          <button @click="selectCustom" class="confirm-btn">{{ t('picktime_confirm') }}</button>
        </div>
      </template>
      
      <!-- 最大心率百分比 (percent)：区间 + 快捷数字 + 自定义 -->
      <template v-else-if="format === 'percent'">
        <div class="zone-buttons">
          <button 
            v-for="zone in percentZoneButtons" 
            :key="zone.value"
            @click="selectZone(zone.value)"
            :class="['zone-btn', { 'active': isZoneValueEqual(modelValue, zone.value) }]"
            :style="{ backgroundColor: zone.color }"
            :title="zone.label">
            {{ zone.zone }}
          </button>
        </div>
        <div class="zone-quick-numbers">
          <span class="zone-quick-label">{{ t('picktime_quick') }}:</span>
          <button v-for="n in percentQuickNumbers" :key="n" class="quick-btn" :class="{ active: isZoneValueEqual(modelValue, n) }" @click="selectZone(n)">{{ Math.round(n * 100) }}%</button>
        </div>
        <div class="zone-custom-input">
          <label>{{ t('picktime_custom_percent') }}</label>
          <input type="number" v-model.number="customValuePercent" step="1" min="0" max="100" class="custom-number-input" @keyup.enter="selectCustom" />
          <button @click="selectCustom" class="confirm-btn">{{ t('picktime_confirm') }}</button>
        </div>
      </template>
      
      <!-- 心率绝对值快捷按钮 -->
      <div v-else-if="format === 'heart'" class="quick-numbers">
        <button 
          v-for="hr in heartQuickValues" 
          :key="hr"
          @click="selectNumber(hr)"
          :class="['quick-btn', { 'active': modelValue === hr }]">
          {{ hr }}
        </button>
      </div>
      
      <!-- 配速绝对值 (hour-minute-second) -->
      <div v-else-if="format === 'hour-minute-second'" class="pace-input-section">
        <div class="quick-paces">
          <button 
            v-for="pace in paceQuickValues" 
            :key="pace"
            @click="selectPace(pace)"
            :class="['quick-btn', { 'active': isPaceActive(pace) }]">
            {{ pace }}
          </button>
        </div>
        <div class="pace-custom-input">
          <label>{{ t('picktime_min') }}:</label>
          <input 
            type="number" 
            v-model.number="paceMinutes"
            min="0"
            max="59"
            class="pace-number-input"
          />
          <label>{{ t('picktime_sec') }}:</label>
          <input 
            type="number" 
            v-model.number="paceSeconds"
            min="0"
            max="59"
            class="pace-number-input"
          />
          <button @click="selectCustomPace" class="confirm-btn">{{ t('picktime_confirm') }}</button>
        </div>
      </div>
      
      <!-- 功率/FTP 绝对值 -->
      <div v-else-if="format === 'power' || format === 'ftpvalue'" class="number-input-section">
        <div class="quick-numbers">
          <button 
            v-for="num in powerQuickValues" 
            :key="num"
            @click="selectNumber(num)"
            :class="['quick-btn', { 'active': modelValue === num }]">
            {{ num }}
          </button>
        </div>
        <div class="custom-input">
          <label>{{ t('picktime_custom') }}</label>
          <input 
            type="number" 
            v-model.number="customValue"
            @keyup.enter="selectCustom"
            class="custom-number-input"
          />
          <button @click="selectCustom" class="confirm-btn">{{ t('picktime_confirm') }}</button>
        </div>
      </div>
      
      <!-- 通用数字输入 -->
      <div v-else class="number-input-section">
        <div class="quick-numbers">
          <button 
            v-for="num in getQuickNumbers" 
            :key="num"
            @click="selectNumber(num)"
            :class="['quick-btn', { 'active': modelValue === num }]">
            {{ num }}
          </button>
        </div>
        <div class="custom-input">
          <label>{{ t('picktime_custom') }}</label>
          <input 
            type="number" 
            v-model.number="customValue"
            @keyup.enter="selectCustom"
            :step="getStep"
            class="custom-number-input"
          />
          <button @click="selectCustom" class="confirm-btn">{{ t('picktime_confirm') }}</button>
        </div>
      </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick } from 'vue'
import { useLocale } from '@/composables/useLocale'

export default defineComponent({
  name: 'PickTime',
  props: {
    modelValue: {
      type: [Number, String],
      default: 0
    },
    format: {
      type: String,
      default: 'number'
    }
  },
  emits: ['update:modelValue'],
  directives: {
    'click-outside': {
      mounted(el: any, binding: any) {
        el.clickOutsideEvent = (event: Event) => {
          const target = event.target as Node
          if (el.contains(target)) return
          const opts = binding.value
          const excludeRef = opts?.excludeRef
          if (excludeRef?.value && (excludeRef.value as HTMLElement).contains(target)) return
          const close = typeof opts === 'function' ? opts : opts?.close
          if (close) close(event)
        }
        document.addEventListener('click', el.clickOutsideEvent)
      },
      unmounted(el: any) {
        document.removeEventListener('click', el.clickOutsideEvent)
      }
    }
  },
  setup(props, { emit }) {
    const { t } = useLocale()
    const isOpen = ref(false)
    const customValue = ref(0)
    /** 百分比类格式的自定义输入用 0-100 显示（如 80 表示 80%），不除以 100 */
    const customValuePercent = ref(0)
    const paceMinutes = ref(5)
    const paceSeconds = ref(0)
    const picktimeWrapper = ref<HTMLElement | null>(null)
    const pickerDropdownRef = ref<HTMLElement | null>(null)
    const dropdownPosition = ref({ top: 0, left: 0 })

    // 显示值
    const displayValue = computed(() => {
      const val = props.modelValue
      
      // 配速绝对值 (hour-minute-second)
      if (props.format === 'hour-minute-second') {
        if (typeof val === 'string' && val.includes("'")) {
          return val  // 已经是 "5'30" 格式
        }
        if (typeof val === 'number') {
          const mins = Math.floor(val / 60)
          const secs = val % 60
          return `${mins}'${secs.toString().padStart(2, '0')}`
        }
        return "0'00"
      }
      
      // 百分比格式 (ftp, css, tsp, lt, lthr, percent)
      if (['ftp', 'css', 'tsp', 'lt', 'lthr', 'percent'].includes(props.format)) {
        let num: number
        if (typeof val === 'number') {
          num = val
        } else {
          const s = String(val)
          if (s.includes('%')) {
            num = parseFloat(s.replace('%', '')) / 100
          } else {
            num = parseFloat(s)
          }
        }
        if (!isNaN(num)) {
          // 值 > 1 且 <= 2 视为小数形式 (如 1.17 表示 117%)
          const pct = num > 1 && num <= 2 ? num : (num > 2 && num <= 200 ? num / 100 : num)
          return `${Math.round(pct * 100)}%`
        }
        return '0%'
      }
      
      // 区间格式 (area) - VDOT/HRR 等，支持 string "1.0"
      if (props.format === 'area') {
        const num = typeof val === 'number' ? val : parseFloat(String(val))
        if (!isNaN(num)) {
          return num.toFixed(1)
        }
        return '1.0'
      }
      
      // 单位类格式 (timeMinute, timeSecond, times, distance, distance_km) - 与 likes_com time.vue 一致
      if (['timeMinute', 'timeSecond', 'times', 'distance', 'distance_km'].includes(props.format)) {
        const num = typeof val === 'number' ? val : parseFloat(String(val))
        if (!isNaN(num)) {
          if (props.format === 'distance_km' && num % 1 !== 0) return String(num)
          return String(Math.floor(num))
        }
        return '0'
      }
      
      // 其他数字格式
      if (typeof val === 'number') {
        return val.toString()
      }
      
      return val || '0'
    })

    const getStep = computed(() => {
      if (props.format === 'area') return 0.1
      if (props.format === 'distance_km') return 0.1
      return 1
    })

    const dropdownStyle = computed(() => ({
      position: 'fixed' as const,
      top: `${dropdownPosition.value.top}px`,
      left: `${dropdownPosition.value.left}px`,
      zIndex: 10001
    }))

    const getPlaceholder = computed(() => {
      const key = 'picktime_placeholder_' + props.format
      const v = t(key)
      return v !== key ? v : t('picktime_click_select')
    })

    const areaZoneLabelKeys = ['picktime_zone_Z0', 'picktime_zone_Z1_e', 'picktime_zone_Z2_m', 'picktime_zone_Z3_t', 'picktime_zone_Z4_a', 'picktime_zone_Z5_i', 'picktime_zone_Z6_r']
    const areaZoneButtons = computed(() => {
      const base = [
        { value: 0.0, zone: 'Z0', color: '#2196F3' },
        { value: 1.0, zone: 'Z1', color: '#4CAF50' },
        { value: 2.0, zone: 'Z2', color: '#8BC34A' },
        { value: 3.0, zone: 'Z3', color: '#FFC107' },
        { value: 4.0, zone: 'Z4', color: '#FF9800' },
        { value: 5.0, zone: 'Z5', color: '#FF5722' },
        { value: 6.0, zone: 'Z6', color: '#F44336' }
      ]
      return base.map((z, i) => ({ ...z, label: t(areaZoneLabelKeys[i]) }))
    })

    const ftpZoneLabelKeys = ['picktime_zone_ftp_Z0', 'picktime_zone_ftp_Z1', 'picktime_zone_ftp_Z2', 'picktime_zone_ftp_Z3', 'picktime_zone_ftp_Z4', 'picktime_zone_ftp_Z5', 'picktime_zone_ftp_Z6']
    const ftpZoneButtons = computed(() => {
      const base = [
        { value: 0.0, zone: 'Z0', color: '#2196F3' },
        { value: 0.55, zone: 'Z1', color: '#4CAF50' },
        { value: 0.75, zone: 'Z2', color: '#8BC34A' },
        { value: 0.90, zone: 'Z3', color: '#FFC107' },
        { value: 1.05, zone: 'Z4', color: '#FF9800' },
        { value: 1.20, zone: 'Z5', color: '#FF5722' },
        { value: 1.50, zone: 'Z6', color: '#F44336' }
      ]
      return base.map((z, i) => ({ ...z, label: t(ftpZoneLabelKeys[i]) }))
    })

    // CSS 配速
    const cssZoneLabelKeys = ['picktime_zone_css_Z0', 'picktime_zone_css_Z1', 'picktime_zone_css_Z2', 'picktime_zone_css_Z3', 'picktime_zone_css_Z4', 'picktime_zone_css_Z5', 'picktime_zone_css_Z6']
    const cssZoneButtons = computed(() => {
      const base = [
        { value: 0.0, zone: 'Z0', color: '#2196F3' },
        { value: 0.80, zone: 'Z1', color: '#4CAF50' },
        { value: 0.90, zone: 'Z2', color: '#8BC34A' },
        { value: 1.00, zone: 'Z3', color: '#FFC107' },
        { value: 1.05, zone: 'Z4', color: '#FF9800' },
        { value: 1.10, zone: 'Z5', color: '#FF5722' },
        { value: 1.15, zone: 'Z6', color: '#F44336' }
      ]
      return base.map((z, i) => ({ ...z, label: t(cssZoneLabelKeys[i]) }))
    })

    // TSP 配速
    const tspZoneLabelKeys = ['picktime_zone_tsp_Z0', 'picktime_zone_tsp_Z1', 'picktime_zone_tsp_Z2', 'picktime_zone_tsp_Z3', 'picktime_zone_tsp_Z4', 'picktime_zone_tsp_Z5']
    const tspZoneButtons = computed(() => {
      const base = [
        { value: 0.0, zone: 'Z0', color: '#2196F3' },
        { value: 0.85, zone: 'Z1', color: '#4CAF50' },
        { value: 0.95, zone: 'Z2', color: '#8BC34A' },
        { value: 1.00, zone: 'Z3', color: '#FFC107' },
        { value: 1.03, zone: 'Z4', color: '#FF9800' },
        { value: 1.06, zone: 'Z5', color: '#FF5722' }
      ]
      return base.map((z, i) => ({ ...z, label: t(tspZoneLabelKeys[i]) }))
    })

    // 乳酸阈值
    const ltZoneLabelKeys = ['picktime_zone_lt_Z0', 'picktime_zone_lt_Z1', 'picktime_zone_lt_Z2', 'picktime_zone_lt_Z3', 'picktime_zone_lt_Z4', 'picktime_zone_lt_Z5', 'picktime_zone_lt_Z6']
    const ltZoneButtons = computed(() => {
      const base = [
        { value: 0.0, zone: 'Z0', color: '#2196F3' },
        { value: 0.79, zone: 'Z1', color: '#4CAF50' },
        { value: 0.92, zone: 'Z2', color: '#8BC34A' },
        { value: 1.00, zone: 'Z3', color: '#FFC107' },
        { value: 1.03, zone: 'Z4', color: '#FF9800' },
        { value: 1.09, zone: 'Z5', color: '#FF5722' },
        { value: 1.17, zone: 'Z6', color: '#F44336' }
      ]
      return base.map((z, i) => ({ ...z, label: t(ltZoneLabelKeys[i]) }))
    })

    const percentZoneLabelKeys = ['picktime_zone_percent_Z0', 'picktime_zone_percent_Z1', 'picktime_zone_percent_Z2', 'picktime_zone_percent_Z3', 'picktime_zone_percent_Z4', 'picktime_zone_percent_Z5']
    const percentZoneButtons = computed(() => {
      const base = [
        { value: 0.50, zone: 'Z0', color: '#2196F3' },
        { value: 0.60, zone: 'Z1', color: '#4CAF50' },
        { value: 0.70, zone: 'Z2', color: '#8BC34A' },
        { value: 0.80, zone: 'Z3', color: '#FFC107' },
        { value: 0.90, zone: 'Z4', color: '#FF9800' },
        { value: 0.95, zone: 'Z5', color: '#FF5722' }
      ]
      return base.map((z, i) => ({ ...z, label: t(percentZoneLabelKeys[i]) }))
    })

    // 区间(area)快捷数字 1.0-6.0
    const areaQuickNumbers = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0]
    // 百分比/FTP 快捷数字 (0-1)
    const percentQuickNumbers = [0.5, 0.55, 0.6, 0.7, 0.75, 0.8, 0.9, 1.0]
    // CSS 配速快捷数字 (0.8-1.15)
    const cssQuickNumbers = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15]
    // TSP 配速快捷数字
    const tspQuickNumbers = [0.85, 0.9, 0.95, 1.0, 1.03, 1.06]
    // 乳酸阈值 lt/lthr 快捷数字
    const ltQuickNumbers = [0.79, 0.92, 1.0, 1.03, 1.09, 1.17]

    // 将 modelValue 规范为数字（支持 "90%" 或 0.9 或 90）
    const normalizeZoneValue = (val: number | string): number => {
      if (typeof val === 'number') {
        return val > 1 && val <= 200 ? val / 100 : val
      }
      const s = String(val)
      if (s.includes('%')) return parseFloat(s.replace('%', '')) / 100
      const n = parseFloat(s)
      return !isNaN(n) && n > 1 && n <= 200 ? n / 100 : n
    }
    const isZoneValueEqual = (a: number | string, b: number): boolean => {
      const na = normalizeZoneValue(a)
      if (isNaN(na)) return false
      return Math.abs(na - b) < 0.001
    }

    // 心率快捷值
    const heartQuickValues = [120, 130, 140, 150, 155, 160, 170, 175, 180, 185]

    // 配速快捷值
    const paceQuickValues = ["3'00", "3'30", "4'00", "4'30", "5'00", "5'30", "6'00", "6'30", "7'00", "8'00", "9'00", "10'00"]

    // 功率快捷值
    const powerQuickValues = [150, 200, 250, 300, 350, 400, 450, 500]

    // 通用快捷数字 / 单位类快捷值 (与 likes_com time.vue 一致)
    const getQuickNumbers = computed(() => {
      if (props.format === 'timeMinute') return [1, 2, 3, 5, 10, 15, 20, 30, 45, 60]
      if (props.format === 'timeSecond') return [30, 60, 90, 120, 180, 300]
      if (props.format === 'times') return [5, 10, 15, 20, 30, 50]
      if (props.format === 'distance') return [100, 200, 400, 800, 1000, 2000]
      if (props.format === 'distance_km') return [1, 2, 5, 10, 21.097, 42.195]
      return [1, 2, 3, 4, 5, 10, 15, 20, 30, 50]
    })

    const isPercentFormat = () => ['ftp', 'css', 'tsp', 'lt', 'lthr', 'percent'].includes(props.format)

    const openPicker = () => {
      isOpen.value = true
      const rawVal = props.modelValue
      if (props.format === 'area') {
        const n = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal))
        customValue.value = isNaN(n) ? 1 : n
      } else if (isPercentFormat()) {
        const n = normalizeZoneValue(rawVal)
        customValue.value = isNaN(n) ? 0 : n
        customValuePercent.value = Math.round((isNaN(n) ? 0 : n) * 100)
      } else {
        customValue.value = typeof rawVal === 'number' ? rawVal : (parseFloat(String(rawVal)) || 0)
      }
      if (props.format === 'hour-minute-second') {
        const val = props.modelValue
        if (typeof val === 'number') {
          paceMinutes.value = Math.floor(val / 60)
          paceSeconds.value = val % 60
        } else if (typeof val === 'string' && val.includes("'")) {
          const parts = val.split("'")
          paceMinutes.value = parseInt(parts[0]) || 0
          paceSeconds.value = parseInt(parts[1]) || 0
        }
      }
      nextTick(() => {
        const el = picktimeWrapper.value
        if (el) {
          const rect = el.getBoundingClientRect()
          dropdownPosition.value = {
            top: rect.bottom + 4,
            left: rect.left
          }
        }
      })
    }

    const closePicker = () => {
      isOpen.value = false
    }

    const selectZone = (value: number) => {
      emit('update:modelValue', value)
      closePicker()
    }

    const selectNumber = (value: number) => {
      emit('update:modelValue', value)
      closePicker()
    }

    const selectPace = (pace: string) => {
      const parts = pace.split("'")
      const mins = parseInt(parts[0])
      const secs = parseInt(parts[1])
      const totalSeconds = mins * 60 + secs
      emit('update:modelValue', totalSeconds)
      closePicker()
    }

    const selectCustomPace = () => {
      const totalSeconds = paceMinutes.value * 60 + paceSeconds.value
      emit('update:modelValue', totalSeconds)
      closePicker()
    }

    const selectCustom = () => {
      if (isPercentFormat()) {
        const pct = customValuePercent.value
        const n = (typeof pct === 'number' && !isNaN(pct) ? pct : 0) / 100
        emit('update:modelValue', n)
      } else {
        emit('update:modelValue', customValue.value)
      }
      closePicker()
    }

    const isPaceActive = (pace: string) => {
      const parts = pace.split("'")
      const mins = parseInt(parts[0])
      const secs = parseInt(parts[1])
      const totalSeconds = mins * 60 + secs
      return props.modelValue === totalSeconds
    }

    const clickOutsideArgs = { close: closePicker, excludeRef: pickerDropdownRef }

    return {
      t,
      isOpen,
      customValue,
      customValuePercent,
      paceMinutes,
      paceSeconds,
      picktimeWrapper,
      pickerDropdownRef,
      clickOutsideArgs,
      dropdownStyle,
      displayValue,
      getStep,
      getPlaceholder,
      areaZoneButtons,
      areaQuickNumbers,
      percentQuickNumbers,
      cssQuickNumbers,
      tspQuickNumbers,
      ltQuickNumbers,
      ftpZoneButtons,
      cssZoneButtons,
      tspZoneButtons,
      ltZoneButtons,
      percentZoneButtons,
      isZoneValueEqual,
      heartQuickValues,
      paceQuickValues,
      powerQuickValues,
      getQuickNumbers,
      openPicker,
      closePicker,
      selectZone,
      selectNumber,
      selectPace,
      selectCustomPace,
      selectCustom,
      isPaceActive
    }
  }
})
</script>

<style scoped>
.picktime-wrapper {
  position: relative;
  display: inline-block;
  z-index: 9999;
}

.picktime-input {
  padding: 6px 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  font-size: 14px;
  min-width: 70px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition: border-color 0.2s;
}

.picktime-input:hover {
  border-color: rgb(var(--v-theme-primary));
}

.picktime-input.picker-open {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

.picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  z-index: 10000;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 280px;
  max-width: 400px;
  padding: 12px;
}

.zone-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.zone-btn {
  flex: 0 0 calc(25% - 5px);
  padding: 8px 4px;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.zone-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.zone-btn.active {
  box-shadow: 0 0 0 3px rgba(255,255,255,0.5), 0 4px 8px rgba(0,0,0,0.3);
}

.zone-quick-numbers {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.zone-quick-label {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-right: 4px;
  flex-shrink: 0;
}

.zone-quick-numbers .quick-btn {
  min-width: 44px;
}

.zone-custom-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.zone-custom-input label {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  flex-shrink: 0;
}

.zone-custom-input .custom-number-input {
  flex: 1;
  min-width: 0;
}

.number-input-section,
.pace-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-numbers,
.quick-paces {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.quick-btn {
  padding: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.quick-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-color: rgb(var(--v-theme-primary));
}

.quick-btn.active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-color: rgb(var(--v-theme-primary));
}

.custom-input,
.pace-custom-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.custom-input label,
.pace-custom-input label {
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.custom-number-input,
.pace-number-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  font-size: 14px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.pace-number-input {
  width: 60px;
  flex: none;
}

.confirm-btn {
  padding: 6px 16px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
}

.confirm-btn:hover {
  opacity: 0.9;
}
</style>
