<template>
  <div :id="id">
    <div class="col-xs-12 col-sm-12 taskcom">
      <!-- 工具栏：加分段 + 与 PlanEditor 统一的样式 -->
      <div class="lap-header-actions taskcom-toolbar" v-if="focus">
        <span class="taskcom-toolbar-label">{{ t('plan_sub_laps') }}</span>
        <a @click="addLap" class="lap-action-btn lap-action-add" :title="t('plan_add_segment')">
          <v-icon size="small">mdi-plus</v-icon>
        </a>
      </div>

      <div class="col-xs-12 col-sm-12 lap_com_bg">
        <ul class="taskcom-laps-list">
            <li
              v-for="(item, index) in form.laps_com"
              :key="subLapKey(item, index)"
              class="list-com-group-item taskcom-lap-item"
              @dragover.prevent
              @drop.prevent="onSubLapDrop(index)"
              :data-drop-target="dragOverSubIndex === index ? '1' : '0'"
            >
              <!-- 与外侧 lap 一致：每个子段一条标题栏 + 四个按钮（新增、复制、删除、拖拽）-->
              <div class="lap-header-bar taskcom-lap-header">
                <div class="lap-header-content">
                  <span class="lap-index-badge" :style="{ backgroundColor: getSubLapColor(index) }">{{ index + 1 }}</span>
                  <span class="lap-name-display" :title="getSubLapName(item)">{{ getSubLapName(item) }}</span>
                </div>
                <div class="lap-header-actions" @click.stop>
                  <a @click.stop="copySubLap(index)" class="lap-action-btn lap-action-copy" :title="t('plan_copy')">
                    <v-icon size="small">mdi-content-copy</v-icon>
                  </a>
                  <a @click.stop="deleteSubLap(index)" class="lap-action-btn lap-action-delete" :title="t('plan_delete')">
                    <v-icon size="small">mdi-delete-outline</v-icon>
                  </a>
                  <span
                    class="lap-action-btn lap-action-move taskcom-drag-handle"
                    :title="t('plan_move')"
                    draggable="true"
                    @dragstart.stop="onSubLapDragStart(index, $event)"
                    @dragend.stop="onSubLapDragEnd"
                    @dragenter.prevent.stop="onSubLapDragEnter(index)"
                  >
                    <v-icon size="small">mdi-drag</v-icon>
                  </span>
                </div>
              </div>
              <div class="lap-body taskcom-lap-body">
                <task-lap 
                  :form="item.val" 
                  :vall="item.val" 
                  :ref="item.ref" 
                  :index="index"
                  :type="item.type" 
                  :id="item.id" 
                  :color="color ? color[index] : ''"
                  :lap_type="item.lap_type" 
                  :parent_lap_type="parent_lap_type" 
                  :tPace="actualTPace !== null && actualTPace !== undefined ? actualTPace : (item.val?.tPace || null)" 
                  :likes="likesInstance" 
                  :likes-data-version="likesDataVersion"
                  :ftp="actualFtp !== null && actualFtp !== undefined ? actualFtp : (item.val?.ftp || null)"
                  :default-intensity="defaultIntensity"
                  :show-lap-actions="false"
                  @func="goLap"
                  @createtask="createTask"
                />
              </div>
            </li>
        </ul>

        <div id="repeat" class="lap_com">
          <span style="display:block;float:left;font-size:15px;">{{ t('plan_repeat_label') }}</span>
          <pick-time :format="'times'" :class="['col-xs-1 col-sm-1 tasklap_item_lab']" v-model="form.repeat"></pick-time>
          <span style='font-size:15px;'>{{ t('plan_times_unit') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import TaskLap from './TaskLap.vue'
import PickTime from './PickTime.vue'
import { useLocale } from '@/composables/useLocale'

export default defineComponent({
  name: 'TaskCom',
  components: {
    'task-lap': TaskLap,
    'pick-time': PickTime
  },
  props: {
    form: {
      type: Object,
      required: true
    },
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
    focus: Boolean
  },
  emits: ['func', 'del', 'copy', 'down', 'up'],
  setup(props, { emit }) {
    const { t } = useLocale()
    const lap_index = computed(() => (props.index || 0) + 1)
    const likesInstance = computed(() => props.likes)
    const actualTPace = computed(() => props.tPace || props.form?.tPace)
    const actualFtp = computed(() => props.ftp || props.form?.ftp)
    const draggingSubIndex = ref(null)
    const dragOverSubIndex = ref(null)

    const addLap = () => {
      if (!props.form.laps_com) {
        props.form.laps_com = []
      }
      
      // 使用父级 lap 的 trainig_lap 配置作为默认值
      const parentConfig = props.form.trainig_lap || {}
      
      const newLap = {
        _uid: `sublapuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        id: `lap_${Date.now()}_${Math.random()}`,
        ref: `lap_ref_${Date.now()}`,
        type: props.form.type || 'run',
        lap_type: 'normal',
        val: {
          type: props.form.type || 'run',
          straining_step: props.form.type || 'run',
          t_type: 'normal',
          trainig_lap: {
            unit: parentConfig.unit || 'min',
            unit_value: 1,
            intensity: parentConfig.intensity || 'pace',
            range: parentConfig.range || 'range',
            range_min: parentConfig.range_min || 1.0,
            range_max: parentConfig.range_max || 2.0,
            pace_unit: parentConfig.pace_unit || '/km'
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
              { value: '5', title: '区间5' },
              { value: 'custom', title: '自定义' }
            ],
            Pace: [
              { value: '1', title: 'E配速' },
              { value: '2', title: 'M配速' },
              { value: '3', title: 'T配速' },
              { value: '4', title: 'I配速' },
              { value: '5', title: 'R配速' },
              { value: 'custom', title: '自定义' }
            ],
            FTP: [
              { value: '1', title: 'Z1' },
              { value: '2', title: 'Z2' },
              { value: '3', title: 'Z3' },
              { value: '4', title: 'Z4' },
              { value: '5', title: 'Z5' },
              { value: 'custom', title: '自定义' }
            ],
            CSS: [
              { value: '1', title: 'Z1' },
              { value: '2', title: 'Z2' },
              { value: '3', title: 'Z3' },
              { value: 'custom', title: '自定义' }
            ]
          },
          tPace: actualTPace.value,
          ftp: actualFtp.value
        }
      }
      
      props.form.laps_com.push(newLap)
    }

    const addLapAfter = (subIndex) => {
      if (!props.form.laps_com) props.form.laps_com = []
      const parentConfig = props.form.trainig_lap || {}
      const newLap = {
        _uid: `sublapuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        id: `lap_${Date.now()}_${Math.random()}`,
        ref: `lap_ref_${Date.now()}`,
        type: props.form.type || 'run',
        lap_type: 'normal',
        val: {
          type: props.form.type || 'run',
          straining_step: props.form.type || 'run',
          t_type: 'normal',
          trainig_lap: {
            unit: parentConfig.unit || 'min',
            unit_value: 1,
            intensity: parentConfig.intensity || 'pace',
            range: parentConfig.range || 'range',
            range_min: parentConfig.range_min ?? 1.0,
            range_max: parentConfig.range_max ?? 2.0,
            pace_unit: parentConfig.pace_unit || '/km'
          },
          straining_steps: { run: [{ value: 'run', title: '跑步' }], ride: [{ value: 'ride', title: '骑车' }], swim: [{ value: 'swim', title: '游泳' }], muscle: [{ value: 'muscle', title: '力量' }], other: [{ value: 'other', title: '其他' }] },
          units: [{ title: '分', value: 'min' }, { title: '秒', value: 's' }, { title: '米', value: 'm' }, { title: '公里', value: 'km' }, { title: '次', value: 'c' }],
          intensitys: { run: [{ value: 'HRR', title: '心率储备' }, { value: 'HRmax', title: '最大心率' }, { value: 'Pace', title: '配速' }], ride: [{ value: 'FTP', title: '功率' }, { value: 'HRR', title: '心率储备' }], swim: [{ value: 'CSS', title: 'CSS配速' }, { value: 'HRR', title: '心率储备' }] },
          ranges: { HRR: [{ value: '1', title: '区间1' }, { value: '2', title: '区间2' }, { value: '3', title: '区间3' }, { value: '4', title: '区间4' }, { value: '5', title: '区间5' }, { value: 'custom', title: '自定义' }], HRmax: [{ value: '1', title: '区间1' }, { value: '2', title: '区间2' }, { value: '3', title: '区间3' }, { value: '4', title: '区间4' }, { value: '5', title: '区间5' }, { value: 'custom', title: '自定义' }], Pace: [{ value: '1', title: 'E配速' }, { value: '2', title: 'M配速' }, { value: '3', title: 'T配速' }, { value: '4', title: 'I配速' }, { value: '5', title: 'R配速' }, { value: 'custom', title: '自定义' }], FTP: [{ value: '1', title: 'Z1' }, { value: '2', title: 'Z2' }, { value: '3', title: 'Z3' }, { value: '4', title: 'Z4' }, { value: '5', title: 'Z5' }, { value: 'custom', title: '自定义' }], CSS: [{ value: '1', title: 'Z1' }, { value: '2', title: 'Z2' }, { value: '3', title: 'Z3' }, { value: 'custom', title: '自定义' }] },
          tPace: actualTPace.value,
          ftp: actualFtp.value
        }
      }
      props.form.laps_com.splice(subIndex + 1, 0, newLap)
    }

    const copySubLap = (subIndex) => {
      goLap({ action: 'copy', index: subIndex, id: props.form.laps_com[subIndex]?.id, lap_type: 'normal' })
    }

    const deleteSubLap = (subIndex) => {
      goLap({ action: 'del', index: subIndex, id: props.form.laps_com[subIndex]?.id, lap_type: 'normal' })
    }

    const getSubLapName = (item) => {
      if (!item?.val?.trainig_lap) return t('plan_sub_lap')
      const tl = item.val.trainig_lap
      const u = tl.unit === 'min' ? 'min' : tl.unit === 's' ? 's' : tl.unit === 'km' ? 'km' : tl.unit || 'min'
      const v = tl.unit_value ?? 0
      const min = tl.range_min ?? ''
      const max = tl.range_max ?? ''
      if (min !== '' && max !== '') return `${v}${u} @ ${min}~${max}`
      if (min !== '' || max !== '') return `${v}${u} @ ${min || max}`
      return `${v}${u}`
    }

    const getSubLapColor = (subIndex) => {
      const colors = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4']
      return colors[subIndex % colors.length]
    }

    const subLapKey = (item, index) => {
      if (item && item._uid) return String(item._uid)
      if (item && item.id != null) return `id-${String(item.id)}-${index}`
      return `idx-${index}`
    }

    const onSubLapDragStart = (index, event) => {
      draggingSubIndex.value = index
      dragOverSubIndex.value = index
      if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(index))
      }
    }

    const onSubLapDragEnter = (index) => {
      if (draggingSubIndex.value == null) return
      dragOverSubIndex.value = index
    }

    const onSubLapDragEnd = () => {
      draggingSubIndex.value = null
      dragOverSubIndex.value = null
    }

    const onSubLapDrop = (targetIndex) => {
      const sourceIndex = draggingSubIndex.value
      if (sourceIndex == null || sourceIndex === targetIndex) {
        onSubLapDragEnd()
        return
      }
      const laps = props.form.laps_com || []
      if (sourceIndex < 0 || sourceIndex >= laps.length) {
        onSubLapDragEnd()
        return
      }
      const moved = laps.splice(sourceIndex, 1)[0]
      const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
      laps.splice(insertIndex, 0, moved)
      onSubLapDragEnd()
    }

    const goLap = (data) => {
      const { action, index } = data
      const laps = props.form.laps_com || []
      if (action === 'del' && index != null) {
        laps.splice(index, 1)
        return
      }
      if (action === 'copy' && index != null) {
        const copy = JSON.parse(JSON.stringify(laps[index]))
        copy._uid = `sublapuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        copy.id = `lap_${Date.now()}_${Math.random()}`
        copy.ref = `lap_ref_${Date.now()}`
        laps.splice(index + 1, 0, copy)
        return
      }
      if (action === 'up' && index != null && index > 0) {
        const t = laps[index]
        laps[index] = laps[index - 1]
        laps[index - 1] = t
        return
      }
      if (action === 'down' && index != null && index < laps.length - 1) {
        const t = laps[index]
        laps[index] = laps[index + 1]
        laps[index + 1] = t
        return
      }
      emit('func', data)
    }

    const createTask = (data) => {
      emit('createtask', data)
    }

    const likesDataVersion = computed(() => props.likesDataVersion ?? 0)
    return {
      t,
      lap_index,
      likesInstance,
      actualTPace,
      actualFtp,
      likesDataVersion,
      addLap,
      addLapAfter,
      copySubLap,
      deleteSubLap,
      getSubLapName,
      getSubLapColor,
      subLapKey,
      draggingSubIndex,
      dragOverSubIndex,
      onSubLapDragStart,
      onSubLapDragEnter,
      onSubLapDragEnd,
      onSubLapDrop,
      goLap,
      createTask
    }
  }
})
</script>

<style scoped>
.taskcom {
  position: relative;
  margin-bottom: 15px;
  padding: 15px;
  background: rgba(var(--v-theme-warning), 0.08);
  border-radius: 6px;
  border: 2px solid rgb(var(--v-theme-warning));
}

.badge-warning {
  background-color: rgb(var(--v-theme-warning));
  color: rgb(var(--v-theme-on-warning));
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
}

/* 与 PlanEditor lap-header-actions 统一 */
.taskcom-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 6px;
}

.taskcom-toolbar-label {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-right: 4px;
}

.lap-header-actions .lap-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.lap-header-actions .lap-action-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.lap-action-add:hover {
  border-color: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-success));
}

.lap_com_bg {
  margin-top: 10px;
}

.taskcom-laps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-com-group-item.taskcom-lap-item {
  list-style: none;
  margin-bottom: 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

/* 与 PlanEditor lap-header-bar 一致 */
.taskcom-lap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  cursor: default;
  min-height: 40px;
}

.taskcom-lap-header .lap-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.taskcom-lap-header .lap-index-badge {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.taskcom-lap-header .lap-name-display {
  flex: 1;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.taskcom-lap-header .lap-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.taskcom-lap-header .lap-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.taskcom-lap-header .lap-action-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.taskcom-lap-header .lap-action-add:hover { border-color: rgb(var(--v-theme-success)); color: rgb(var(--v-theme-success)); }
.taskcom-lap-header .lap-action-copy:hover { border-color: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-primary)); }
.taskcom-lap-header .lap-action-delete:hover { border-color: rgb(var(--v-theme-error)); color: rgb(var(--v-theme-error)); }
.taskcom-lap-header .lap-action-move.handle { cursor: move; }

.taskcom-lap-body {
  padding: 12px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.list-com-group-item {
  list-style: none;
  margin-bottom: 8px;
}

.lap_com {
  margin-top: 15px;
  padding: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
