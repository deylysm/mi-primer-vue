// Utilidad de stock. Archivo sin dependencias.
// Dónde está: src/utils/. Quién lo usa: TarjetaMedicamento.vue y DetalleMedicamentoView.vue
// (así el texto "Agotado / Pocas unidades / En stock" es idéntico en ambos sitios).

// A partir de esta cantidad (o menos) avisamos "Pocas unidades".
export const UMBRAL_POCO_STOCK = 5

/**
 * Describe el stock con un texto (accesible, no solo color) y un modificador de clase CSS:
 * 'agotado' | 'aviso' | 'ok'.
 */
export function describirStock(stock) {
  // Number() + !(n > 0): null, undefined, negativos o NaN también cuentan como agotado.
  const n = Number(stock)
  if (!(n > 0)) return { texto: 'Agotado', modificador: 'agotado' }
  if (n <= UMBRAL_POCO_STOCK) return { texto: `Pocas unidades (${n})`, modificador: 'aviso' }
  return { texto: 'En stock', modificador: 'ok' }
}
