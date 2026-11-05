// Router de la aplicación: decide QUÉ vista se muestra según la URL.
// Dónde está: src/router/index.js. Quién lo usa: src/main.js (app.use(router)).
// App.vue dibuja la vista activa con <RouterView /> y los enlaces usan <RouterLink>.
//
// 'vue-router' es un paquete instalado en node_modules.
import { createRouter, createWebHistory } from 'vue-router'
// Vistas: archivos locales (ruta relativa a este archivo; '../' sube a src/).
import BuscadorView from '../views/BuscadorView.vue'
import DetalleMedicamentoView from '../views/DetalleMedicamentoView.vue'
import CarritoView from '../views/CarritoView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
// 'vue' es un paquete instalado en node_modules.
import { watch } from 'vue'
// Estado de la sesión (archivo local; alias @ -> src/). useSesion.js NO importa el router,
// así que no hay importación circular.
import { haySesion, avisoCaducada, comprobarSesion } from '@/composables/useSesion.js'

// Solo se acepta como destino una ruta interna ("/algo"), nunca una URL externa ("//otro.sitio").
function rutaSegura(ruta) {
  return typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//')
}

const router = createRouter({
  // createWebHistory: URLs "limpias" (/carrito) en vez de con # (/#/carrito).
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'inicio', component: BuscadorView },
    {
      path: '/medicamento/:id',
      name: 'medicamento',
      component: DetalleMedicamentoView,
      props: true, // el parámetro :id llega a la vista como prop `id`
    },
    { path: '/carrito', name: 'carrito', component: CarritoView },
    { path: '/login', name: 'login', component: LoginView },
    // meta.requiereSesion: la guardia de abajo (beforeEach) exige haber iniciado sesión.
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiereSesion: true } },
    // Cualquier otra URL vuelve al inicio (aún no hay página 404).
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  // Al cambiar de página:
  //  - volver atrás/adelante: se recupera la posición de scroll guardada (savedPosition);
  //  - saltar a un ancla (#contenido del enlace "Saltar al contenido"): no se toca, el navegador
  //    ya se desplazó (respetando scroll-padding-top);
  //  - página nueva: se empieza arriba del todo.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return false
    return { top: 0 }
  },
})

// Guardia: se ejecuta ANTES de cada cambio de página.
router.beforeEach(async (to) => {
  const irALogin = () => ({ name: 'login', query: { redirect: to.fullPath } })

  if (to.meta.requiereSesion) {
    if (!haySesion.value) return irALogin() // sin sesión: al login, recordando a dónde iba
    // Hay token guardado: se comprueba una vez (GET /yo) que sigue vigente
    if (!(await comprobarSesion())) return irALogin()
  }

  // Ya con sesión, /login no tiene sentido: se va a donde se iba o al panel
  if (to.name === 'login' && haySesion.value) {
    return rutaSegura(to.query.redirect) ? to.query.redirect : { name: 'admin' }
  }
  return true
})

// Si la sesión se cierra porque la API dijo 401 (token caducado) estando en una página protegida,
// se lleva al login. (Un cierre voluntario de sesión pone avisoCaducada en false: no entra aquí.)
watch(haySesion, (hay) => {
  const actual = router.currentRoute.value
  if (!hay && avisoCaducada.value && actual.meta.requiereSesion) {
    router.replace({ name: 'login', query: { redirect: actual.fullPath } })
  }
})

export default router
