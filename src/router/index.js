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

export default router
