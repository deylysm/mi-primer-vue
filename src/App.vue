<script setup>
// Componente raíz: es el "marco" fijo de FarmaApp. Dibuja la cabecera (con el buscador) y el pie
// en TODAS las páginas, y en medio muestra la vista que toque según la URL (<RouterView />).

// Estilos globales de FarmaApp (tokens --fa-*). Ruta con alias @ -> src/.
// Vite los inyecta en la página al importarlos.
import '@/assets/farmaapp.css'

// 'vue' y 'vue-router' son paquetes instalados en node_modules.
import { watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
// Archivos locales de FarmaApp (alias @ -> src/).
import { useBusquedaMedicamentos, MIN_CARACTERES } from '@/composables/useBusquedaMedicamentos.js'
import CabeceraTienda from '@/components/layout/CabeceraTienda.vue'
import PieTienda from '@/components/layout/PieTienda.vue'
import BarraBusqueda from '@/components/busqueda/BarraBusqueda.vue'

// El término de búsqueda vive en el composable (estado compartido): la barra de la cabecera lo
// escribe y la vista del buscador lo lee, aunque estén en archivos distintos.
const { termino, faltanCaracteres, buscarAhora } = useBusquedaMedicamentos()

const route = useRoute() // ruta actual (reactiva)
const router = useRouter() // para navegar desde el código

const irAInicio = () => {
  if (route.name !== 'inicio') router.push({ name: 'inicio' })
}

// Tecla Enter / botón de la barra: busca ya y lleva a los resultados.
function alBuscar() {
  buscarAhora()
  irAInicio()
}

// Si el usuario escribe en la barra estando en otra página (detalle o carrito),
// se le lleva a los resultados para que vea lo que busca.
watch(termino, (nuevo) => {
  if (nuevo.trim() !== '') irAInicio()
})
</script>

<template>
  <div class="fa-app">
    <a class="fa-saltar-contenido" href="#contenido">Saltar al contenido</a>

    <!-- CabeceraTienda dibuja logo, menú, acciones y franja verde.
         Lo que ponemos entre sus etiquetas (la barra de búsqueda) entra por su <slot />. -->
    <CabeceraTienda>
      <BarraBusqueda
        v-model="termino"
        :faltan-caracteres="faltanCaracteres"
        :min-caracteres="MIN_CARACTERES"
        @buscar="alBuscar"
      />
    </CabeceraTienda>

    <!-- Aquí aparece la vista de la ruta actual (buscador, detalle o carrito). -->
    <RouterView />

    <PieTienda />
  </div>
</template>
