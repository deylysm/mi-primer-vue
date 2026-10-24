// Utilidades de texto y precio. Archivo sin dependencias.

/**
 * Normaliza un texto para comparar: minúsculas, sin tildes y con espacios limpios.
 * Tolera null/undefined (devuelve ''). La ñ se conserva.
 */
export function normalizar(texto) {
  if (texto === null || texto === undefined) return ''
  return String(texto)
    .toLowerCase()
    .normalize('NFD') // separa letra y tilde: "é" -> "e" + "´"
    .replace(/ñ/g, '\u0001') // protege la ñ (n + tilde) antes de quitar tildes
    .replace(/[̀-ͯ]/g, '') // elimina las marcas de tilde
    .replace(/\u0001/g, 'ñ') // restaura la ñ
    .trim()
    .replace(/\s+/g, ' ') // colapsa espacios repetidos
}

// Formateador de moneda en soles peruanos (se crea una sola vez).
const formateadorSoles = new Intl.NumberFormat('es-PE', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Devuelve el precio como "S/ 8.50". */
export function formatearPrecio(numero) {
  return `S/ ${formateadorSoles.format(Number(numero) || 0)}`
}
