<template>
  <v-dialog :model-value="modelValue" max-width="360" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="text-subtitle-1">{{ title }}</v-card-title>
      <v-card-text>
        <div class="d-flex align-center gap-2">
          <v-text-field
            v-model.number="minutes"
            type="number"
            min="0"
            max="999"
            label="分"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 100px;"
          />
          <span class="text-body1">:</span>
          <v-text-field
            v-model.number="seconds"
            type="number"
            min="0"
            max="59"
            label="秒"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 100px;"
          />
        </div>
        <p v-if="hint" class="text-caption text-medium-emphasis mt-2">{{ hint }}</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">取消</v-btn>
        <v-btn color="primary" variant="text" @click="onConfirm">确定</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    valueSeconds?: number
    title?: string
    hint?: string
  }>(),
  { valueSeconds: 0, title: '配速', hint: '' }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', totalSeconds: number): void
}>()

const minutes = ref(0)
const seconds = ref(0)

watch(
  () => [props.modelValue, props.valueSeconds] as const,
  ([open, sec]) => {
    if (open && typeof sec === 'number' && sec >= 0) {
      minutes.value = Math.floor(sec / 60)
      seconds.value = Math.min(59, sec % 60)
    }
  },
  { immediate: true }
)

function onConfirm() {
  const m = Math.max(0, Math.min(999, Number(minutes.value) || 0))
  const s = Math.max(0, Math.min(59, Number(seconds.value) || 0))
  emit('confirm', m * 60 + s)
  emit('update:modelValue', false)
}
</script>
