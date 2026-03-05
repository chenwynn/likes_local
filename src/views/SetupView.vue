<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card max-width="480" width="100%" class="pa-6">
      <div class="text-center mb-6">
        <img src="/likes_30_logo.svg" alt="" width="48" height="48" />
        <h2 class="text-h6 font-weight-medium mt-3">likes</h2>
      </div>
      <v-card-title class="text-center text-body1 font-weight-medium pa-0 mb-1">{{ t('setup_title') }}</v-card-title>
      <v-card-text class="pa-0">
        <p class="text-body2 text-medium-emphasis text-center mb-4">{{ t('setup_desc') }}</p>
        <v-text-field
          v-model="apiKeyInput"
          :label="t('setup_apikey_label')"
          :placeholder="t('setup_apikey_placeholder')"
          variant="outlined"
          density="compact"
          class="mb-3"
          autofocus
        />
        <v-text-field
          v-model="apiBaseUrlInput"
          :label="t('setup_baseurl_label')"
          :placeholder="t('setup_baseurl_placeholder')"
          variant="outlined"
          density="compact"
          class="mb-2"
        />
        <p class="text-caption text-medium-emphasis mb-4">{{ t('setup_hint') }}</p>
        <v-btn
          block
          color="primary"
          :disabled="!apiKeyInput.trim()"
          @click="handleSave"
        >{{ t('setup_save') }}</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useLocale } from '@/composables/useLocale'

const router = useRouter()
const { saveSettings, apiBaseUrl } = useAuth()
const { t } = useLocale()

const apiKeyInput = ref('')
const apiBaseUrlInput = ref(apiBaseUrl.value || 'https://my.likes.com.cn')

function handleSave() {
  if (!apiKeyInput.value.trim()) return
  saveSettings({
    apiKey: apiKeyInput.value.trim(),
    apiBaseUrl: apiBaseUrlInput.value.trim() || 'https://my.likes.com.cn',
  })
  router.push('/activities')
}
</script>
