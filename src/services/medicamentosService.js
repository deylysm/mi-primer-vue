// Servicio de medicamentos (simulado).
// En el futuro este archivo se reemplazará por llamadas fetch a FastAPI,
// manteniendo la misma forma de respuesta.
// Imports locales con ruta relativa (archivos dentro de src/).
import { farmacias } from '../mocks/farmacias.mock.js'
import { medicamentos } from '../mocks/medicamentos.mock.js'
import { normalizar } from '../utils/normalizar.js'

const RETRASO_MS = 400 // espera simulada de red

// Pausa asíncrona para imitar una petición al servidor.
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms))

/** Devuelve la lista de farmacias. */
export async function listarFarmacias() {
  await esperar(RETRASO_MS)
  return farmacias.map((f) => ({ ...f }))
}

/**
 * Busca medicamentos y devuelve UNA entrada por oferta (medicamento x farmacia).
 * Filtros en AND: término, farmacias (OR entre ellas; vacío = todas),
 * soloConStock, precioMax (inclusivo; null = sin límite).
 * orden: 'precio-asc' (defecto) | 'precio-desc' | 'nombre'.
 *
 * PRUEBA MANUAL DE ERROR: si el término normalizado es exactamente "error",
 * lanza una excepción para ver el estado de error en la interfaz.
 */
export async function buscarMedicamentos({
  termino = '',
  farmaciaIds = [],
  soloConStock = false,
  precioMax = null,
  orden = 'precio-asc',
} = {}) {
  await esperar(RETRASO_MS)

  const buscado = normalizar(termino)
  if (buscado === 'error') throw new Error('Error simulado para pruebas')

  const farmaciasPorId = new Map(farmacias.map((f) => [f.id, f]))

  // Aplana: cada medicamento x cada farmacia en su inventario.
  const ofertas = []
  for (const med of medicamentos) {
    const coincide =
      normalizar(med.nombre).includes(buscado) ||
      normalizar(med.principioActivo).includes(buscado)
    if (!coincide) continue

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
        farmacia: { id: farmacia.id, nombre: farmacia.nombre, direccion: farmacia.direccion },
        precio: item.precio,
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
