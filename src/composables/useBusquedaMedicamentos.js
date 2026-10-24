// Composable: lógica reutilizable de la búsqueda de medicamentos.
// 'vue' es el paquete instalado en node_modules.
import { ref, reactive, computed, watch, onScopeDispose } from 'vue'
// Alias '@' -> carpeta src/ (configurado en vite.config.js).
import { buscarMedicamentos, listarFarmacias } from '@/services/medicamentosService.js'
import { normalizar } from '@/utils/normalizar.js'

// Se exporta para que la vista pueda mostrar el mismo mínimo en la barra de búsqueda.
export const MIN_CARACTERES = 2
const DEBOUNCE_MS = 300

const filtrosPorDefecto = () => ({
  farmaciaIds: [],
  soloConStock: false,
  precioMax: null,
  orden: 'precio-asc',
})

export function useBusquedaMedicamentos() {
  const termino = ref('')
  const filtros = reactive(filtrosPorDefecto())
  const resultados = ref([])
  const farmacias = ref([])
  const cargando = ref(false)
  const error = ref('')
  const buscado = ref(false) // true si ya se hizo al menos una búsqueda válida
  const pendiente = ref(false) // hay un cambio esperando el debounce (aún no se lanzó la petición)
  const terminoBuscado = ref('') // término con el que se obtuvieron los 'resultados' mostrados

  let temporizador = null
  let contadorPeticion = 0 // sirve para descartar respuestas obsoletas

  const terminoNormalizado = computed(() => normalizar(termino.value))
  const buscable = computed(() => terminoNormalizado.value.length >= MIN_CARACTERES)
  // Hay texto pero es demasiado corto: la interfaz puede mostrar una pista.
  const faltanCaracteres = computed(
    () => terminoNormalizado.value.length > 0 && !buscable.value,
  )

  // "Actualizando": hay una carga en curso o un cambio esperando el debounce,
  // PERO ya tenemos una búsqueda válida en pantalla.
  const actualizando = computed(() => (cargando.value || pendiente.value) && buscado.value)

  // Patrón stale-while-revalidate: mientras se recarga, se conserva el estado anterior
  // ('resultados' / 'sin-resultados') para no desmontar la lista ni cambiar la altura.
  // 'cargando' solo aparece en la primera búsqueda o tras un error (buscado vuelve a false).
  const estado = computed(() => {
    if (cargando.value && !buscado.value) return 'cargando'
    if (error.value) return 'error'
    if (!buscado.value) return 'inicial'
    return resultados.value.length > 0 ? 'resultados' : 'sin-resultados'
  })

  function cancelarTemporizador() {
    if (temporizador) {
      clearTimeout(temporizador)
      temporizador = null
    }
  }

  // Ejecuta la búsqueda ya mismo (también la usa la tecla Enter).
  async function buscarAhora() {
    cancelarTemporizador()
    const id = ++contadorPeticion
    // Ya no hay espera de debounce. Se apaga en el mismo tick en que 'cargando' se enciende,
    // así 'actualizando' no pasa por false entre la carga vieja y la nueva.
    pendiente.value = false

    if (!buscable.value) {
      // Texto vacío o corto: no se busca, se vuelve al estado inicial.
      resultados.value = []
      terminoBuscado.value = ''
      error.value = ''
      cargando.value = false
      buscado.value = false
      return
    }

    cargando.value = true
    error.value = ''
    const terminoLanzado = termino.value // se captura al lanzar, no al responder
    try {
      const datos = await buscarMedicamentos({
        termino: terminoLanzado,
        farmaciaIds: [...filtros.farmaciaIds],
        soloConStock: filtros.soloConStock,
        precioMax: filtros.precioMax,
        orden: filtros.orden,
      })
      if (id !== contadorPeticion) return // llegó tarde: se ignora
      resultados.value = datos
      terminoBuscado.value = terminoLanzado
      buscado.value = true
    } catch {
      if (id !== contadorPeticion) return
      resultados.value = []
      buscado.value = false // tras un error, el reintento vuelve a mostrar 'cargando'
      error.value = 'No pudimos buscar los medicamentos. Inténtalo de nuevo.'
    } finally {
      if (id === contadorPeticion) cargando.value = false
    }
  }

  const reintentar = () => buscarAhora()

  function limpiarFiltros() {
    const porDefecto = filtrosPorDefecto()
    // Un array nuevo dispararía el watcher aunque ya estuviera vacío: solo se vacía si hace falta.
    if (filtros.farmaciaIds.length > 0) filtros.farmaciaIds = []
    // Asignar el mismo valor primitivo no dispara el watch.
    filtros.soloConStock = porDefecto.soloConStock
    filtros.precioMax = porDefecto.precioMax
    filtros.orden = porDefecto.orden
  }

  // Búsqueda automática con espera de 300 ms tras el último cambio.
  watch(
    [termino, () => filtros.farmaciaIds, () => filtros.soloConStock, () => filtros.precioMax, () => filtros.orden],
    () => {
      cancelarTemporizador()
      // Si ya hay resultados en pantalla, se atenúan desde ya (durante el debounce).
      if (buscado.value) pendiente.value = true
      temporizador = setTimeout(buscarAhora, DEBOUNCE_MS)
    },
    { deep: true },
  )

  // Carga inicial de farmacias para el filtro.
  listarFarmacias()
    .then((lista) => {
      farmacias.value = lista
    })
    .catch(() => {
      farmacias.value = []
    })

  // Limpia el temporizador al destruirse el componente que usa el composable.
  onScopeDispose(() => {
    cancelarTemporizador()
    pendiente.value = false
    contadorPeticion++ // invalida cualquier petición en curso
  })

  return {
    termino,
    filtros,
    resultados,
    terminoBuscado,
    farmacias,
    cargando,
    error,
    estado,
    actualizando,
    faltanCaracteres,
    buscarAhora,
    reintentar,
    limpiarFiltros,
  }
}
