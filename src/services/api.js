// src/services/api.js
// Para qué sirve: función base para hablar con la API FastAPI usando `fetch` (nativo del navegador,
// no hace falta instalar nada). Quién la usa: los demás servicios (medicamentosService.js,
// categoriasService.js, authService.js, adminService.js). No tiene imports.
// Tiene dos funciones: pedir() para los GET públicos y pedirConToken() para login y administración.

// `import.meta.env` lo rellena Vite. VITE_API_URL sería una variable de entorno opcional;
// si no existe, se usa la dirección local del backend.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/**
 * Hace un GET a la API y devuelve el JSON ya convertido en objeto/array de JavaScript.
 * Si la respuesta no es correcta (404, 422, 500...) lanza un Error con `error.status`
 * para que quien llame pueda distinguir, por ejemplo, un 404 de otros fallos.
 */
export async function pedir(ruta) {
  const respuesta = await fetch(`${API_URL}${ruta}`)
  if (!respuesta.ok) {
    const error = new Error(`Error ${respuesta.status} al pedir ${ruta}`)
    error.status = respuesta.status
    throw error
  }
  return respuesta.json()
}

/**
 * Petición para las rutas de ADMINISTRACIÓN (login, crear, editar, borrar...).
 * Parámetros (todos opcionales salvo `ruta`):
 *   - method: 'GET' (por defecto), 'POST', 'PUT' o 'DELETE'.
 *   - body: objeto de JavaScript; se envía como JSON.
 *   - token: si existe, se manda en la cabecera `Authorization: Bearer <token>`.
 * Devuelve el JSON de la respuesta, o `null` si la API responde 204 (sin contenido, p. ej. al borrar).
 * Si falla lanza un Error con:
 *   - error.status  -> número HTTP (401, 404, 422, 429, 500...). No existe si ni siquiera hubo respuesta
 *                      (servidor apagado o sin red): en ese caso fetch lanza un TypeError.
 *   - error.detalle -> el campo `detail` que manda FastAPI: un texto, o una lista de errores (422).
 */
export async function pedirConToken(ruta, { method = 'GET', body, token } = {}) {
  const cabeceras = {}
  if (token) cabeceras.Authorization = `Bearer ${token}`
  if (body !== undefined) cabeceras['Content-Type'] = 'application/json'

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method,
    headers: cabeceras,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!respuesta.ok) {
    const error = new Error(`Error ${respuesta.status} en ${method} ${ruta}`)
    error.status = respuesta.status
    error.detalle = null
    try {
      error.detalle = (await respuesta.json()).detail ?? null
    } catch {
      // la respuesta de error no traía JSON: dejamos `detalle` en null
    }
    throw error
  }

  if (respuesta.status === 204) return null // 204 = "hecho, sin contenido": no hay JSON que leer
  return respuesta.json()
}
