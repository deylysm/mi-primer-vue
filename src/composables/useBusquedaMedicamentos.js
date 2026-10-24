// Composable: lógica reutilizable de la búsqueda de medicamentos.
//
// ESTADO COMPARTIDO: todas las variables (termino, filtros, resultados...) se declaran
// FUERA de la función `useBusquedaMedicamentos`, a nivel de módulo. Un módulo de JavaScript
// se ejecuta una sola vez, así que todos los componentes que llamen a la función reciben las
// MISMAS refs. Gracias a eso:
//   - la barra de búsqueda de la cabecera (App.vue) y la vista del buscador comparten el término;
//   - al ir a un detalle y volver, el término, los filtros y los resultados siguen ahí;
//   - el menú lateral puede elegir una categoría y la vista del buscador la ve al instante.
//
// 'vue' es el paquete instalado en node_modules.
import { ref, reactive, computed, watch } from 'vue'
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
  categoria: '', // id de categoría; '' = todas
})

// ---- Estado compartido (nivel de módulo) ----
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
let pidiendoFarmacias = false

const terminoNormalizado = computed(() => normalizar(termino.value))
// El texto por sí solo basta si tiene el mínimo de letras.
const textoSuficiente = computed(() => terminoNormalizado.value.length >= MIN_CARACTERES)
// Se puede buscar con texto suficiente O con una categoría elegida (aunque no haya texto).
const buscable = computed(() => textoSuficiente.value || filtros.categoria !== '')
// Hay texto pero es demasiado corto (y no hay categoría que permita buscar sin texto):
// la interfaz puede mostrar una pista.
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
    // Texto vacío o corto (y sin categoría): no se busca, se vuelve al estado inicial.
    resultados.value = []
    terminoBuscado.value = ''
    error.value = ''
    cargando.value = false
    buscado.value = false
    return
  }

  cargando.value = true
  error.value = ''
  // Con una categoría elegida y un texto demasiado corto, el texto se ignora (se busca '').
  const terminoLanzado = textoSuficiente.value ? termino.value : '' // se captura al lanzar
  try {
    const datos = await buscarMedicamentos({
      termino: terminoLanzado,
      farmaciaIds: [...filtros.farmaciaIds],
      soloConStock: filtros.soloConStock,
      precioMax: filtros.precioMax,
      orden: filtros.orden,
      categoria: filtros.categoria,
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

// Quita TODOS los filtros, incluida la categoría elegida desde el menú.
function limpiarFiltros() {
  const porDefecto = filtrosPorDefecto()
  // Un array nuevo dispararía el watcher aunque ya estuviera vacío: solo se vacía si hace falta.
  if (filtros.farmaciaIds.length > 0) filtros.farmaciaIds = []
  // Asignar el mismo valor primitivo no dispara el watch.
  filtros.soloConStock = porDefecto.soloConStock
  filtros.precioMax = porDefecto.precioMax
  filtros.orden = porDefecto.orden
  filtros.categoria = porDefecto.categoria
}

// Elige una categoría desde el menú: se borra el texto para listar toda la categoría.
// El watcher de abajo lanza la búsqueda (con debounce) al cambiar `filtros.categoria`.
function seleccionarCategoria(idCategoria) {
  termino.value = ''
  filtros.categoria = idCategoria
}

function quitarCategoria() {
  filtros.categoria = ''
}

// Búsqueda automática con espera de 300 ms tras el último cambio.
// Se crea UNA vez (nivel de módulo) y vive mientras viva la página: no depende de ningún componente.
watch(
  [
    termino,
    () => filtros.farmaciaIds,
    () => filtros.soloConStock,
    () => filtros.precioMax,
    () => filtros.orden,
    () => filtros.categoria,
  ],
  () => {
    cancelarTemporizador()
    // Si ya hay resultados en pantalla, se atenúan desde ya (durante el debounce).
    if (buscado.value) pendiente.value = true
    temporizador = setTimeout(buscarAhora, DEBOUNCE_MS)
  },
  { deep: true },
)

// Carga de farmacias para el filtro: solo se pide si aún no las tenemos.
function cargarFarmacias() {
  if (pidiendoFarmacias || farmacias.value.length > 0) return
  pidiendoFarmacias = true
  listarFarmacias()
    .then((lista) => {
      farmacias.value = lista
    })
    .catch(() => {
      farmacias.value = []
    })
    .finally(() => {
      pidiendoFarmacias = false
    })
}

export function useBusquedaMedicamentos() {
  cargarFarmacias()

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
    seleccionarCategoria,
    quitarCategoria,
  }
}
