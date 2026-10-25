// src/services/categoriasService.js
// Para qué sirve: pide las categorías (con sus subcategorías) a la API.
// Quién lo usa: el composable useCategorias.js.
// Import local con ruta relativa (./ = misma carpeta, src/services/).
import { pedir } from './api.js'

/**
 * Devuelve [{ id, nombre, subcategorias: [{ id, nombre }] }].
 * La API manda cada subcategoría con `slug`; los componentes usan `sub.id`,
 * así que aquí se convierte slug -> id y las plantillas no cambian.
 */
export async function listarCategorias() {
  const categorias = await pedir('/categorias')
  return categorias.map((c) => ({
    ...c,
    subcategorias: (c.subcategorias ?? []).map((s) => ({ id: s.slug, nombre: s.nombre })),
  }))
}
