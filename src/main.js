import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
// Router local (ruta relativa a src/): define qué vista corresponde a cada URL.
import router from './router'

// app.use(router) "instala" el router: habilita <RouterLink>, <RouterView> y useRouter()/useRoute().
createApp(App).use(router).mount('#app')
