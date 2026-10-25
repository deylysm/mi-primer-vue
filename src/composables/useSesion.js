// src/composables/useSesion.js
// Para qué sirve: guarda QUIÉN ha iniciado sesión y ofrece las funciones para entrar, salir y
// hacer peticiones protegidas. El estado está FUERA de la función (nivel de módulo): toda la app
// comparte la misma sesión (mismo patrón que useCarrito.js y useCategorias.js).
// Quién lo usa: router/index.js (guardia de rutas), App.vue, CabeceraTienda.vue, MenuLateral.vue,
// LoginView.vue, AdminView.vue y services/adminService.js.
//
// Flujo de la sesión:
//   1. iniciarSesion(): POST /login -> guarda el token (en memoria y en sessionStorage).
//   2. peticionProtegida(): añade el token a cada petición. Si la API responde 401 (token caducado
//      o inválido) se cierra la sesión con `avisoCaducada = true`; el router lo detecta y lleva
//      a /login, donde se muestra "Tu sesión ha caducado. Inicia sesión de nuevo."
//   3. cerrarSesion(): borra el token. salir() (dentro de useSesion()) además va al inicio y avisa.
//
// Imports:
//   - 'vue' y 'vue-router': paquetes instalados en node_modules.
//   - '@/services/authService.js' / '@/services/api.js': archivos locales (alias @ -> src/).
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  leerSesionGuardada,
  guardarSesion,
  borrarSesionGuardada,
  iniciarSesionApi,
  obtenerUsuarioApi,
} from '@/services/authService.js'
import { pedirConToken } from '@/services/api.js'
import { avisar } from '@/composables/useAvisos.js'

// ---- Estado compartido ----
const guardada = leerSesionGuardada() // al recargar la página se recupera la sesión de esta pestaña
const token = ref(guardada.token)
const usuario = ref(guardada.token ? guardada.usuario : null)
// true cuando la sesión se cerró porque la API dijo 401. LoginView lo usa para mostrar el aviso.
const avisoCaducada = ref(false)
const haySesion = computed(() => token.value !== null)

let verificada = false // ¿ya comprobamos con GET /yo que el token sigue vigente en esta carga de la página?
let comprobacionEnCurso = null // para no lanzar dos GET /yo a la vez

/** Abre la sesión. Si las credenciales son malas, la excepción (status 401/429/red) sube a quien llamó. */
export async function iniciarSesion(nombre, contrasena) {
  const nuevoToken = await iniciarSesionApi(nombre, contrasena)
  const nombreLimpio = nombre.trim()
  guardarSesion(nuevoToken, nombreLimpio)
  token.value = nuevoToken
  usuario.value = nombreLimpio
  avisoCaducada.value = false
  verificada = true // acabamos de recibir el token: no hace falta comprobarlo
}

/** Cierra la sesión (solo borra datos). `caducada: true` cuando la causa fue un 401 de la API. */
export function cerrarSesion({ caducada = false } = {}) {
  borrarSesionGuardada()
  token.value = null
  usuario.value = null
  verificada = false
  avisoCaducada.value = caducada
}

/**
 * Comprueba con GET /yo que el token guardado sigue siendo válido.
 * Devuelve true si hay sesión válida (o si no se pudo comprobar por un fallo de red: se mantiene
 * la sesión y la próxima petición protegida lo aclarará), y false si no hay sesión o caducó.
 */
export function comprobarSesion() {
  if (!token.value) return Promise.resolve(false)
  if (verificada) return Promise.resolve(true)
  if (comprobacionEnCurso) return comprobacionEnCurso

  comprobacionEnCurso = obtenerUsuarioApi(token.value)
    .then((nombre) => {
      usuario.value = nombre
      verificada = true
      return true
    })
    .catch((error) => {
      if (error.status === 401) {
        cerrarSesion({ caducada: true })
        return false
      }
      return true // sin conexión o error del servidor: no sabemos; no cerramos la sesión
    })
    .finally(() => {
      comprobacionEnCurso = null
    })
  return comprobacionEnCurso
}

/**
 * Petición que necesita sesión (crear, editar, borrar). Añade el token solo.
 * Si la API responde 401 cierra la sesión (con aviso de caducada) y relanza el error
 * (con `error.sesionCaducada = true`) para que la pantalla no muestre un mensaje de error de más.
 */
export async function peticionProtegida(ruta, opciones = {}) {
  try {
    return await pedirConToken(ruta, { ...opciones, token: token.value })
  } catch (error) {
    if (error.status === 401) {
      cerrarSesion({ caducada: true })
      error.sesionCaducada = true
    }
    throw error
  }
}

/** Para los componentes: estado de la sesión + `salir()`, que cierra sesión, va al inicio y avisa. */
export function useSesion() {
  const router = useRouter() // solo se puede llamar dentro de setup(): por eso salir() vive aquí

  async function salir() {
    // Primero navegamos: así el router no confunde este cierre con una sesión caducada.
    await router.push({ name: 'inicio' })
    cerrarSesion()
    avisar({ tipo: 'exito', texto: 'Cerraste sesión.' })
  }

  return { token, usuario, haySesion, avisoCaducada, salir }
}

// Exportamos también los refs sueltos para el router (que no está dentro de un componente).
export { token, usuario, haySesion, avisoCaducada }
