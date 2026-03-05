<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card max-width="400" width="100%" class="pa-6">
      <div class="text-center mb-6">
        <img src="/likes_30_logo.svg" alt="" width="48" height="48" />
        <h2 class="text-h6 font-weight-medium mt-3">{{ appName || t('appName') }}</h2>
      </div>
      <v-card-title class="text-center text-body1 font-weight-medium pa-0 mb-2">{{ t('lock_title') }}</v-card-title>
      <v-card-text class="pa-0">
        <p class="text-body2 text-medium-emphasis text-center mb-4">{{ t('lock_desc') }}</p>
        <v-text-field
          v-model="password"
          :label="t('lock_placeholder')"
          type="password"
          variant="outlined"
          density="compact"
          :error-messages="errorMsg"
          autofocus
          @keyup.enter="handleUnlock"
        />
        <v-btn
          block
          color="primary"
          class="mt-2"
          @click="handleUnlock"
        >{{ t('lock_btn') }}</v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useLocale } from '@/composables/useLocale'

const router = useRouter()
const route = useRoute()
const { unlock, appName } = useAuth()
const { t } = useLocale()

const password = ref('')
const errorMsg = ref('')

function handleUnlock() {
  if (unlock(password.value)) {
    const redirect = (route.query.redirect as string) || '/activities'
    router.push(redirect)
  } else {
    errorMsg.value = t('lock_error')
    password.value = ''
  }
}
</script>
