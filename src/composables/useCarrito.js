// Composable: carrito de compras (sin pago: aún no hay backend).
// Dónde está: src/composables/. Quién lo usa: CabeceraTienda.vue y MenuLateral.vue (contador),
// DetalleMedicamentoView.vue (agregar) y CarritoView.vue (ver, cambiar cantidad, quitar, vaciar).
//
// ESTADO COMPARTIDO: `items` está declarado FUERA de la función, a nivel de módulo.
// El módulo se ejecuta una sola vez, así que todos los componentes que llamen a
// `useCarrito()` reciben la MISMA ref: si el detalle agrega algo, la cabecera lo ve al instante.
//
// 'vue' es el paquete instalado en node_modules.
import { ref, computed, watch } from 'vue'

const CLAVE_ALMACEN = 'farmaapp-carrito' // nombre con el que se guarda en localStorage

// Cada ítem: { medicamentoId, farmaciaId, nombre, farmaciaNombre, precio, cantidad, categoria, imagen, stock }
// (`imagen` es la URL de la imagen del producto; es opcional: los ítems guardados antes de que
// existiera no la tienen y se dibujan con la ilustración de su categoría.)
// (`stock` es el stock de esa farmacia al agregar: sirve para no pasar de ese tope).
function esItemValido(i) {
  return (
    i &&
    typeof i === 'object' &&
    Number.isFinite(i.medicamentoId) &&
    Number.isFinite(i.farmaciaId) &&
    typeof i.nombre === 'string' &&
    typeof i.farmaciaNombre === 'string' &&
    Number.isFinite(i.precio) &&
    Number.isInteger(i.cantidad) &&
    i.cantidad >= 1
  )
}

// Lee el carrito guardado. localStorage puede fallar (modo privado, cuota, JSON roto):
// en cualquier problema se empieza con un carrito vacío en vez de romper la app.
function cargarGuardado() {
  try {
    const bruto = localStorage.getItem(CLAVE_ALMACEN)
    if (!bruto) return []
    const datos = JSON.parse(bruto)
    if (!Array.isArray(datos)) return []
    return datos.filter(esItemValido).map((i) => ({
      ...i,
      categoria: i.categoria ?? '',
      // Ítems antiguos sin `imagen` (o con un valor que no es texto) quedan en '' = respaldo de categoría.
      imagen: typeof i.imagen === 'string' ? i.imagen : '',
      // Si faltara el stock guardado, se usa al menos lo que ya había en el carrito.
      stock: Number.isFinite(i.stock) ? i.stock : i.cantidad,
    }))
  } catch {
    return []
  }
}

function guardar(lista) {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(lista))
  } catch {
    // Si no se puede guardar, el carrito sigue funcionando en memoria.
  }
}

// ---- Estado compartido (nivel de módulo) ----
const items = ref(cargarGuardado())

// Cada cambio (también profundo: cantidades) se persiste.
watch(items, (lista) => guardar(lista), { deep: true })

const totalProductos = computed(() => items.value.reduce((suma, i) => suma + i.cantidad, 0))
// Se redondea a céntimos para evitar cosas como 25.500000000000004.
const totalPrecio = computed(
  () => Math.round(items.value.reduce((suma, i) => suma + i.precio * i.cantidad, 0) * 100) / 100,
)

const buscar = (medicamentoId, farmaciaId) =>
  items.value.find((i) => i.medicamentoId === medicamentoId && i.farmaciaId === farmaciaId)

/**
 * Agrega `cantidad` unidades de un medicamento en una farmacia.
 * Si ya estaba (mismo medicamento + misma farmacia) se SUMA, sin pasar del stock.
 * `producto` = { medicamentoId, farmaciaId, nombre, farmaciaNombre, precio, categoria, imagen, stock }.
 * Devuelve { agregadas, enCarrito, limitado }:
 *   agregadas = unidades realmente añadidas (puede ser menos de las pedidas, o 0),
 *   enCarrito = cantidad total de ese producto tras la operación,
 *   limitado  = true si el stock impidió añadir todo lo pedido.
 */
function agregar(producto, cantidad = 1) {
  const stock = Math.max(0, Math.floor(Number(producto.stock) || 0))
  const pedidas = Math.max(1, Math.floor(Number(cantidad) || 1))
  const existente = buscar(producto.medicamentoId, producto.farmaciaId)
  const actual = existente ? existente.cantidad : 0

  const disponibles = Math.max(0, stock - actual)
  const agregadas = Math.min(pedidas, disponibles)

  if (agregadas > 0) {
    if (existente) {
      existente.cantidad += agregadas
      existente.stock = stock
      // Si el ítem se guardó sin imagen y ahora sí la tenemos, la completamos.
      if (!existente.imagen && producto.imagen) existente.imagen = producto.imagen
    } else {
      items.value.push({
        medicamentoId: producto.medicamentoId,
        farmaciaId: producto.farmaciaId,
        nombre: producto.nombre,
        farmaciaNombre: producto.farmaciaNombre,
        precio: producto.precio,
        categoria: producto.categoria ?? '',
        imagen: producto.imagen ?? '',
        cantidad: agregadas,
        stock,
      })
    }
  }
  return { agregadas, enCarrito: actual + agregadas, limitado: agregadas < pedidas }
}

/** Cambia la cantidad de un ítem (entre 1 y su stock). Para eliminarlo usa `quitar`. */
function cambiarCantidad(medicamentoId, farmaciaId, cantidad) {
  const item = buscar(medicamentoId, farmaciaId)
  if (!item) return
  const numero = Math.floor(Number(cantidad))
  if (!Number.isFinite(numero)) return
  item.cantidad = Math.min(Math.max(numero, 1), Math.max(1, item.stock))
}

function quitar(medicamentoId, farmaciaId) {
  items.value = items.value.filter(
    (i) => !(i.medicamentoId === medicamentoId && i.farmaciaId === farmaciaId),
  )
}

function vaciar() {
  items.value = []
}

export function useCarrito() {
  return { items, totalProductos, totalPrecio, agregar, cambiarCantidad, quitar, vaciar }
}
