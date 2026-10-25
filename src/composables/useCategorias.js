// src/composables/useCategorias.js
// Para qué sirve: da acceso a las categorías que vienen de la API. El estado se declara FUERA de la
// función (a nivel de módulo), así que todos los componentes comparten los mismos datos y solo se
// hace UNA petición, aunque lo usen varios componentes a la vez.
// Quién lo usa: MenuEscritorio.vue, MenuLateral.vue, FiltrosBusqueda.vue, BuscadorView.vue
// y DetalleMedicamentoView.vue.
// 'vue' es un paquete instalado en node_modules.
import { ref } from 'vue'
// Archivo local, ruta relativa: src/services/categoriasService.js
import { listarCategorias } from '../services/categoriasService.js'

// Estado compartido (una sola copia para toda la app).
const categorias = ref([]) // [] mientras carga (o si falla): los menús salen vacíos
const cargando = ref(false)
const error = ref(null)
let cargada = false // true cuando ya se cargó bien; evita volver a pedir

async function cargar() {
  if (cargada || cargando.value) return // ya cargada o cargándose: no repetir
  cargando.value = true
  error.value = null
  try {
    categorias.value = await listarCategorias()
    cargada = true
  } catch (e) {
    error.value = e // no rompe la página; la próxima vez que alguien use el composable se reintenta
  } finally {
    cargando.value = false
  }
}

/** Nombre de la categoría con ese id, o '' si no existe (o aún no han cargado). */
function nombreCategoria(id) {
  return categorias.value.find((c) => c.id === id)?.nombre ?? ''
}

export function useCategorias() {
  cargar() // la primera vez pide los datos; si falló antes, reintenta
  return { categorias, cargando, error, nombreCategoria }
}
