import { createApp } from 'vue'
import router from './router'
import vuetify from './plugins/vuetify'
import App from './App.vue'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.mount('#app')
