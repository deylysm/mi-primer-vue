// src/services/authService.js
// Para qué sirve: habla con la API para iniciar sesión y comprobar el token, y guarda/lee/borra
// el token en `sessionStorage` (la memoria del navegador que se borra al cerrar la pestaña).
// Quién lo usa: el composable src/composables/useSesion.js (nadie más debería tocarlo directamente).
// Imports: './api.js' es un archivo local (ruta relativa: misma carpeta).
import { pedirConToken } from './api.js'

const CLAVE_TOKEN = 'farmaapp.token'
const CLAVE_USUARIO = 'farmaapp.usuario'

// sessionStorage puede fallar (navegación privada estricta, almacenamiento bloqueado...):
// por eso cada acceso va dentro de try/catch y, si falla, la app sigue funcionando sin persistir.
export function leerSesionGuardada() {
  try {
    return {
      token: sessionStorage.getItem(CLAVE_TOKEN) || null,
      usuario: sessionStorage.getItem(CLAVE_USUARIO) || null,
    }
  } catch {
    return { token: null, usuario: null }
  }
}

export function guardarSesion(token, usuario) {
  try {
    sessionStorage.setItem(CLAVE_TOKEN, token)
    sessionStorage.setItem(CLAVE_USUARIO, usuario)
  } catch {
    // sin almacenamiento: la sesión dura solo mientras no se recargue la página
  }
}

export function borrarSesionGuardada() {
  try {
    sessionStorage.removeItem(CLAVE_TOKEN)
    sessionStorage.removeItem(CLAVE_USUARIO)
  } catch {
    // nada que hacer
  }
}

/**
 * POST /login. La API espera {usuario, contrasena} y responde {token, tipo}.
 * Devuelve el token (texto). Si las credenciales son malas lanza un Error con status 401;
 * con demasiados intentos, status 429.
 */
export async function iniciarSesionApi(usuario, contrasena) {
  const datos = await pedirConToken('/login', {
    method: 'POST',
    body: { usuario, contrasena },
  })
  return datos.token
}

/** GET /yo: devuelve el nombre del usuario dueño del token. Lanza Error con status 401 si caducó. */
export async function obtenerUsuarioApi(token) {
  const datos = await pedirConToken('/yo', { token })
  return datos.usuario
}
