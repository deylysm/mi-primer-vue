// src/composables/useAvisos.js
// Para qué sirve: lista GLOBAL de avisos ("toasts"): mensajes cortos como "Cambios guardados."
// El estado se declara FUERA de la función (a nivel de módulo), así que todos los archivos que
// importen este composable comparten la misma lista (mismo patrón que useCarrito.js).
// Quién lo usa:
//   - AvisosToast.vue (src/components/admin/) los DIBUJA; está montado una sola vez en App.vue.
//   - useSesion.js, AdminView.vue y los formularios los CREAN con avisar({ tipo, texto }).
// 'vue' es un paquete instalado en node_modules.
import { ref } from 'vue'

const MAXIMO_AVISOS = 3 // si llegan más, se quitan los más antiguos

const avisos = ref([]) // [{ id, tipo: 'exito' | 'error', texto }]
let contador = 0 // para darle a cada aviso un id único

/** Muestra un aviso. tipo: 'exito' (se cierra solo) o 'error' (hay que cerrarlo a mano). */
export function avisar({ tipo = 'exito', texto }) {
  contador += 1
  avisos.value.push({ id: contador, tipo, texto })
  // Máximo 3 a la vez: se descartan los más antiguos.
  while (avisos.value.length > MAXIMO_AVISOS) avisos.value.shift()
}

/** Quita el aviso con ese id (botón X o cierre automático). */
export function quitarAviso(id) {
  avisos.value = avisos.value.filter((a) => a.id !== id)
}

export function useAvisos() {
  return { avisos, avisar, quitarAviso }
}
