// Datos de prueba (mock) de categorías de medicamentos.
// Dónde está: src/mocks/. Quién lo usa: MenuLateral.vue (cajón móvil con acordeón),
// MenuEscritorio.vue (mega-menú de escritorio), ImagenCategoria.vue (inicial/color del placeholder),
// DetalleMedicamentoView.vue y BuscadorView.vue (mostrar el nombre legible). Cada medicamento de
// medicamentos.mock.js guarda el `id` de su categoría en el campo `categoria`.
//
// Cada categoría tiene ahora `subcategorias: [{ id, nombre }]` (el `id` es un "slug": minúsculas y
// guiones). OJO: los medicamentos todavía NO tienen subcategoría, así que los menús aplican
// provisoriamente el filtro de la categoría padre. Los menús toleran `subcategorias` ausente o vacío.
// En el futuro vendrá de la API FastAPI (tablas "categorias" y "subcategorias" en PostgreSQL).
export const categorias = [
  {
    id: 'analgesico',
    nombre: 'Analgésicos',
    subcategorias: [
      { id: 'dolor-de-cabeza', nombre: 'Dolor de cabeza' },
      { id: 'dolor-muscular', nombre: 'Dolor muscular' },
      { id: 'fiebre', nombre: 'Fiebre' },
      { id: 'dolor-dental', nombre: 'Dolor dental' },
      { id: 'dolor-menstrual', nombre: 'Dolor menstrual' },
    ],
  },
  {
    id: 'antiinflamatorio',
    nombre: 'Antiinflamatorios',
    subcategorias: [
      { id: 'articulaciones', nombre: 'Articulaciones' },
      { id: 'golpes-y-torceduras', nombre: 'Golpes y torceduras' },
      { id: 'gel-y-cremas', nombre: 'Gel y cremas' },
      { id: 'uso-oral', nombre: 'Uso oral' },
    ],
  },
  {
    id: 'antibiotico',
    nombre: 'Antibióticos',
    subcategorias: [
      { id: 'garganta', nombre: 'Garganta' },
      { id: 'piel', nombre: 'Piel' },
      { id: 'urinarias', nombre: 'Urinarias' },
      { id: 'oido', nombre: 'Oído' },
      { id: 'ojos', nombre: 'Ojos' },
    ],
  },
  {
    id: 'antialergico',
    nombre: 'Antialérgicos',
    subcategorias: [
      { id: 'rinitis', nombre: 'Rinitis' },
      { id: 'piel-y-picazon', nombre: 'Piel y picazón' },
      { id: 'ojos', nombre: 'Ojos' },
      { id: 'jarabes-infantiles', nombre: 'Jarabes infantiles' },
    ],
  },
  {
    id: 'gastrico',
    nombre: 'Gástricos',
    subcategorias: [
      { id: 'acidez', nombre: 'Acidez' },
      { id: 'gastritis', nombre: 'Gastritis' },
      { id: 'diarrea', nombre: 'Diarrea' },
      { id: 'estrenimiento', nombre: 'Estreñimiento' },
      { id: 'nauseas', nombre: 'Náuseas' },
    ],
  },
  {
    id: 'antidiabetico',
    nombre: 'Antidiabéticos',
    subcategorias: [
      { id: 'control-de-glucosa', nombre: 'Control de glucosa' },
      { id: 'tiras-y-lancetas', nombre: 'Tiras y lancetas' },
      { id: 'insulinas', nombre: 'Insulinas' },
      { id: 'cuidado-del-pie', nombre: 'Cuidado del pie' },
    ],
  },
  {
    id: 'cardiovascular',
    nombre: 'Cardiovasculares',
    subcategorias: [
      { id: 'presion-arterial', nombre: 'Presión arterial' },
      { id: 'colesterol', nombre: 'Colesterol' },
      { id: 'circulacion', nombre: 'Circulación' },
      { id: 'anticoagulantes', nombre: 'Anticoagulantes' },
    ],
  },
  {
    id: 'respiratorio',
    nombre: 'Respiratorios',
    subcategorias: [
      { id: 'tos', nombre: 'Tos' },
      { id: 'gripe-y-resfrio', nombre: 'Gripe y resfrío' },
      { id: 'asma', nombre: 'Asma' },
      { id: 'congestion-nasal', nombre: 'Congestión nasal' },
    ],
  },
  {
    id: 'vitaminas',
    nombre: 'Vitaminas y suplementos',
    subcategorias: [
      { id: 'vitamina-c', nombre: 'Vitamina C' },
      { id: 'multivitaminicos', nombre: 'Multivitamínicos' },
      { id: 'calcio-y-huesos', nombre: 'Calcio y huesos' },
      { id: 'energia', nombre: 'Energía' },
      { id: 'infantiles', nombre: 'Infantiles' },
    ],
  },
  {
    id: 'hidratacion',
    nombre: 'Hidratación',
    subcategorias: [
      { id: 'sueros-orales', nombre: 'Sueros orales' },
      { id: 'bebidas-isotonicas', nombre: 'Bebidas isotónicas' },
      { id: 'electrolitos', nombre: 'Electrolitos' },
      { id: 'rehidratacion-infantil', nombre: 'Rehidratación infantil' },
    ],
  },
]

/** Devuelve el nombre legible de una categoría a partir de su id ('' si no existe). */
export function nombreCategoria(id) {
  return categorias.find((c) => c.id === id)?.nombre ?? ''
}
