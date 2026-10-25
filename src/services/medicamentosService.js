// Servicio de medicamentos: pide los datos a la API FastAPI (con fetch, vía pedir()).
// Quién lo usa: el composable useBusquedaMedicamentos.js y DetalleMedicamentoView.vue.
// Imports locales con ruta relativa (archivos dentro de src/).
import { pedir } from './api.js'

/** Devuelve la lista de farmacias. */
export async function listarFarmacias() {
  const farmacias = await pedir('/farmacias')
  return farmacias.map((f) => ({ ...f }))
}

/** Devuelve las marcas distintas que hay en los datos, ordenadas A-Z (para el filtro "Marca"). */
export async function listarMarcas() {
  return pedir('/marcas') // la API ya las devuelve distintas y ordenadas
}

/**
 * Busca medicamentos y devuelve UNA entrada por oferta (medicamento x farmacia).
 * Filtros en AND: término, farmacias (OR entre ellas; vacío = todas),
 * soloConStock, precioMax (inclusivo; null = sin límite), categoria ('' = todas),
 * marca (null = todas), receta ('' = todas | 'sin-receta' | 'con-receta').
 * orden: 'precio-asc' (defecto) | 'precio-desc' | 'nombre'.
 *
 * Si la API falla (red caída, 500...) la excepción se propaga y la interfaz muestra el estado de error.
 */
export async function buscarMedicamentos({
  termino = '',
  farmaciaIds = [],
  soloConStock = false,
  precioMax = null,
  orden = 'precio-asc',
  categoria = '', // id de categoría; '' = todas
  marca = null, // nombre exacto de la marca; null = todas
  receta = '', // '' = todas | 'sin-receta' | 'con-receta'
} = {}) {
  // El filtrado por texto, categoría, marca y receta lo hace la API: armamos el querystring
  // (?q=...&categoria=...) con URLSearchParams, que codifica los caracteres especiales por nosotros.
  // Solo se incluyen los parámetros que tienen valor.
  const params = new URLSearchParams()
  const q = String(termino ?? '').trim()
  if (q) params.set('q', q)
  if (categoria) params.set('categoria', categoria)
  if (marca) params.set('marca', marca)
  if (receta) params.set('receta', receta)
  const query = params.toString()

  // Las dos peticiones se hacen a la vez (Promise.all) y se espera a que terminen ambas.
  const [farmacias, medicamentos] = await Promise.all([
    pedir('/farmacias'),
    pedir(query ? `/medicamentos?${query}` : '/medicamentos'),
  ])

  const farmaciasPorId = new Map(farmacias.map((f) => [f.id, f]))

  // Aplana: cada medicamento x cada farmacia en su inventario.
  const ofertas = []
  for (const med of medicamentos) {
    for (const item of med.inventario) {
      const farmacia = farmaciasPorId.get(item.farmaciaId)
      if (!farmacia) continue
      ofertas.push({
        ofertaId: `${med.id}-${farmacia.id}`,
        medicamentoId: med.id,
        nombre: med.nombre,
        principioActivo: med.principioActivo,
        presentacion: med.presentacion,
        requiereReceta: med.requiereReceta,
        categoria: med.categoria,
        imagen: med.imagen ?? '', // URL de la imagen del producto ('' = usar el dibujo de la categoría)
        marca: med.marca,
        farmacia: { id: farmacia.id, nombre: farmacia.nombre, direccion: farmacia.direccion },
        precio: item.precio,
        precioAnterior: item.precioAnterior ?? null, // precio antes de la oferta (si hay)
        stock: item.stock,
      })
    }
  }

  const resultado = ofertas.filter((o) => {
    // '?.' evita un error si farmaciaIds llega como null.
    if (farmaciaIds?.length > 0 && !farmaciaIds.includes(o.farmacia.id)) return false
    if (soloConStock && o.stock <= 0) return false
    if (precioMax !== null && precioMax !== undefined && o.precio > precioMax) return false
    return true
  })

  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es')
  if (orden === 'precio-desc') resultado.sort((a, b) => b.precio - a.precio || porNombre(a, b))
  else if (orden === 'nombre') resultado.sort((a, b) => porNombre(a, b) || a.precio - b.precio)
  else resultado.sort((a, b) => a.precio - b.precio || porNombre(a, b))

  return resultado
}

/**
 * Devuelve UN medicamento con todas sus ofertas (una por farmacia, de más barata a más cara),
 * o `null` si la API responde 404. Cualquier otro error (red, 422, 500...) se propaga.
 */
export async function obtenerMedicamentoPorId(id) {
  let med, farmacias
  try {
    // El id llega como texto desde la URL; encodeURIComponent evita que caracteres raros rompan la ruta.
    ;[med, farmacias] = await Promise.all([
      pedir(`/medicamentos/${encodeURIComponent(id)}`),
      pedir('/farmacias'),
    ])
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }

  const farmaciasPorId = new Map(farmacias.map((f) => [f.id, f]))
  const ofertas = med.inventario
    .filter((item) => farmaciasPorId.has(item.farmaciaId))
    .map((item) => {
      const f = farmaciasPorId.get(item.farmaciaId)
      return {
        farmacia: { id: f.id, nombre: f.nombre, direccion: f.direccion },
        precio: item.precio,
        stock: item.stock,
      }
    })
    .sort((a, b) => a.precio - b.precio)

  return {
    id: med.id,
    nombre: med.nombre,
    principioActivo: med.principioActivo,
    presentacion: med.presentacion,
    requiereReceta: med.requiereReceta,
    categoria: med.categoria,
    imagen: med.imagen ?? '', // URL de la imagen del producto ('' = usar el dibujo de la categoría)
    ofertas,
  }
}
