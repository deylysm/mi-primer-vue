// src/utils/erroresApi.js
// Para qué sirve: convierte los errores que devuelve la API (FastAPI) en textos en español para
// mostrar en pantalla. No tiene imports: son funciones puras.
// Quién lo usa: src/views/AdminView.vue.
//
// Recordatorio de los errores de FastAPI (llegan en `error.detalle`, ver services/api.js):
//   - 422 (datos mal): una LISTA [{ loc: ['body','nombre'], msg, type, ctx }]
//   - 404 / 409 / 429: un TEXTO
//   - sin `error.status`: no hubo respuesta (servidor apagado o sin red)

export const TEXTO_ERROR_GUARDAR =
  'No pudimos guardar los cambios. Revisa tu conexión e inténtalo de nuevo.'
export const TEXTO_ERROR_BORRAR = 'No se pudo borrar. Inténtalo de nuevo.'

/** Texto en español para un error de campo de la lista 422. */
function textoCampo(e) {
  const campo = String(e.loc?.[e.loc.length - 1] ?? '')
  const msg = String(e.msg ?? '')
  if (e.type === 'string_too_long' && e.ctx?.max_length) return `Máximo ${e.ctx.max_length} caracteres.`
  if (e.type === 'string_too_short') return 'Este campo no puede estar vacío.'
  if (campo === 'telefono') return 'Usa solo números, espacios, + y guiones.'
  if (campo === 'imagen') return 'Usa una ruta que empiece por / o una dirección http:// o https://.'
  if (msg.includes('precioAnterior')) return 'Debe ser mayor que el precio actual para que sea una oferta.'
  return 'Revisa este valor.'
}

/**
 * Interpreta un error al GUARDAR (crear o editar).
 * Devuelve { sesionCaducada, general, campos }:
 *   - sesionCaducada: true si la API respondió 401 (useSesion ya cerró la sesión).
 *   - general: texto para el aviso rojo encima del formulario (o null).
 *   - campos: { clave: texto }. Las claves coinciden con las del formulario:
 *       'nombre', 'marca', 'categoria'... o 'inventario.0.precio' (fila 0, campo precio).
 */
export function interpretarErrorGuardar(error) {
  const resultado = { sesionCaducada: false, general: null, campos: {} }

  if (error.sesionCaducada || error.status === 401) {
    resultado.sesionCaducada = true
    return resultado
  }

  if (error.status === 422 && Array.isArray(error.detalle)) {
    for (const e of error.detalle) {
      const ruta = Array.isArray(e.loc) ? e.loc.slice(1) : [] // se quita el "body" inicial
      if (ruta[0] === 'inventario' && ruta.length === 2) {
        // Error de la fila entera (precio anterior <= precio): lo colgamos del campo precioAnterior.
        resultado.campos[`inventario.${ruta[1]}.precioAnterior`] = textoCampo(e)
      } else if (ruta.length > 0) {
        resultado.campos[ruta.join('.')] = textoCampo(e)
      } else if (String(e.msg).includes('misma farmacia')) {
        resultado.general = 'No puedes repetir una farmacia en la disponibilidad.'
      }
    }
    if (Object.keys(resultado.campos).length === 0 && !resultado.general) {
      resultado.general = 'Revisa los datos del formulario e inténtalo de nuevo.'
    }
    return resultado
  }

  if (typeof error.detalle === 'string' && [404, 409, 422].includes(error.status)) {
    // Ej.: 422 "La categoría indicada no existe." / 409 con el motivo / 404 ya no existe
    if (error.status === 422 && error.detalle.includes('categoría')) {
      resultado.campos.categoria = 'Elige una categoría.'
    } else {
      resultado.general = error.detalle
    }
    return resultado
  }

  resultado.general = TEXTO_ERROR_GUARDAR
  return resultado
}

/** Texto para un error al BORRAR (409: la farmacia aún tiene medicamentos; 404: ya no existe). */
export function textoErrorBorrar(error) {
  if (typeof error.detalle === 'string' && [404, 409].includes(error.status)) return error.detalle
  return TEXTO_ERROR_BORRAR
}

/** ¿El error significa "sesión caducada" (401)? Sirve para cualquier llamada protegida. */
export function esSesionCaducada(error) {
  return Boolean(error.sesionCaducada) || error.status === 401
}
