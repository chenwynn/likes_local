<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

onMounted(() => {
  const stored = localStorage.getItem('app-theme')
  if (!stored) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.change(prefersDark ? 'dark' : 'light')
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('app-theme')) {
        theme.change(e.matches ? 'dark' : 'light')
      }
    })
  }
})
</script>
