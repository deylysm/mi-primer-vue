// src/services/api.js
// Para qué sirve: función base para hablar con la API FastAPI usando `fetch` (nativo del navegador,
// no hace falta instalar nada). Quién la usa: los demás servicios (medicamentosService.js,
// categoriasService.js). No tiene imports.

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
