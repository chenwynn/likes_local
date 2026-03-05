import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('app-theme') : null
const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
const defaultTheme = storedTheme ?? (prefersDark ? 'dark' : 'light')

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme,
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#0969da',
          secondary: '#1a7f37',
          background: '#ffffff',
          surface: '#f6f8fa',
          error: '#cf222e',
          warning: '#9a6700',
          info: '#0550ae',
          success: '#1a7f37',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#58a6ff',
          secondary: '#3fb950',
          background: '#0d1117',
          surface: '#161b22',
          error: '#ff7b72',
          warning: '#e3b341',
          info: '#79c0ff',
          success: '#3fb950',
        },
      },
      claude: {
        dark: false,
        colors: {
          primary: '#a8692f',
          secondary: '#7c5c3a',
          background: '#f5f0e8',
          surface: '#faf8f5',
          error: '#c0392b',
          warning: '#e67e22',
          info: '#8e7355',
          success: '#27ae60',
        },
      },
    },
  },
})
