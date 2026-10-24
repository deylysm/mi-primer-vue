// Datos de prueba (mock) de categorías de medicamentos.
// Dónde está: src/mocks/. Quién lo usa: MenuLateral.vue (lista de categorías),
// ImagenCategoria.vue (inicial/color del placeholder), DetalleMedicamentoView.vue y
// BuscadorView.vue (mostrar el nombre legible). Cada medicamento de medicamentos.mock.js
// guarda el `id` de su categoría en el campo `categoria`.
// En el futuro vendrá de la API FastAPI (tabla "categorias" en PostgreSQL).
export const categorias = [
  { id: 'analgesico', nombre: 'Analgésicos' },
  { id: 'antiinflamatorio', nombre: 'Antiinflamatorios' },
  { id: 'antibiotico', nombre: 'Antibióticos' },
  { id: 'antialergico', nombre: 'Antialérgicos' },
  { id: 'gastrico', nombre: 'Gástricos' },
  { id: 'antidiabetico', nombre: 'Antidiabéticos' },
  { id: 'cardiovascular', nombre: 'Cardiovasculares' },
  { id: 'respiratorio', nombre: 'Respiratorios' },
  { id: 'vitaminas', nombre: 'Vitaminas y suplementos' },
  { id: 'hidratacion', nombre: 'Hidratación' },
]

/** Devuelve el nombre legible de una categoría a partir de su id ('' si no existe). */
export function nombreCategoria(id) {
  return categorias.find((c) => c.id === id)?.nombre ?? ''
}
