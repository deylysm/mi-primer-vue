<!--
  LoginView.vue  (src/views/)
  Qué es: la página de inicio de sesión (ruta /login). Pide usuario y contraseña y, si son
  correctos, lleva al panel /admin (o a la página que se intentaba visitar).
  Quién la usa: src/router/index.js (ruta 'login'). Cabecera y pie los pone App.vue.
  La sesión (token) la gestiona src/composables/useSesion.js.
-->
<script setup>
// 'vue' y 'vue-router' son paquetes instalados en node_modules.
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
// Archivo local con el alias @ (apunta a src/). Estado y funciones de la sesión.
import { iniciarSesion, avisoCaducada } from '@/composables/useSesion.js'

const route = useRoute()
const router = useRouter()

// Lo que escribe la persona
const usuario = ref('')
const clave = ref('')
const verClave = ref(false) // false: puntitos; true: texto visible

// Estado de la pantalla
const cargando = ref(false)
const errorUsuario = ref('') // "Escribe tu usuario."
const errorClave = ref('') // "Escribe tu contraseña."
const errorServidor = ref('') // credenciales mal / red / demasiados intentos

// Referencias a los <input> para llevar el foco
const campoUsuario = ref(null)
const campoClave = ref(null)

const hayErrorServidor = computed(() => errorServidor.value !== '')

// aria-describedby solo debe listar ids que existan en ese momento
const descripcionUsuario = computed(() => {
  if (errorUsuario.value) return 'login-usuario-error'
  return hayErrorServidor.value ? 'login-error' : undefined
})
const descripcionClave = computed(() => {
  if (errorClave.value) return 'login-clave-error'
  return hayErrorServidor.value ? 'login-error' : undefined
})

onMounted(() => {
  document.title = 'Iniciar sesión - FarmaApp'
  campoUsuario.value?.focus()
})

// Al salir de la página, el aviso de "sesión caducada" ya cumplió su función
onUnmounted(() => {
  avisoCaducada.value = false
})

// Texto según el tipo de fallo (nunca se dice cuál de los dos datos falló)
function textoError(error) {
  if (error.status === 401) return 'Usuario o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.'
  if (error.status === 429) return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.'
  return 'No pudimos conectar con el servidor. Inténtalo de nuevo en unos minutos.'
}

// A dónde ir tras entrar: la ruta pedida (solo rutas internas que empiezan por "/") o /admin
function destino() {
  const pedida = route.query.redirect
  if (typeof pedida === 'string' && pedida.startsWith('/') && !pedida.startsWith('//')) return pedida
  return '/admin'
}

async function entrar() {
  if (cargando.value) return
  errorServidor.value = ''
  errorUsuario.value = usuario.value.trim() ? '' : 'Escribe tu usuario.'
  errorClave.value = clave.value ? '' : 'Escribe tu contraseña.'

  // Si falta algo, el foco va al primer campo vacío
  if (errorUsuario.value) {
    campoUsuario.value?.focus()
    return
  }
  if (errorClave.value) {
    campoClave.value?.focus()
    return
  }

  cargando.value = true
  try {
    await iniciarSesion(usuario.value, clave.value)
    await router.push(destino())
  } catch (error) {
    errorServidor.value = textoError(error)
    await nextTick()
    if (error.status === 401) {
      // Credenciales mal: foco en la contraseña, con su contenido seleccionado para reescribir
      campoClave.value?.focus()
      campoClave.value?.select()
    }
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main id="contenido" class="fa-contenedor adm-login" tabindex="-1">
    <section class="adm-login__tarjeta" aria-labelledby="login-titulo">
      <div class="adm-login__icono" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>
      <h1 id="login-titulo" class="adm-login__titulo">Iniciar sesión</h1>
      <p class="adm-login__intro">Entra para administrar medicamentos y farmacias.</p>

      <!-- Aviso al volver porque la sesión caducó -->
      <p v-if="avisoCaducada" class="adm-alerta adm-alerta--aviso" role="status">
        Tu sesión ha caducado. Inicia sesión de nuevo.
      </p>

      <!-- Error del servidor: v-if hace que sea un elemento nuevo y por eso se anuncia -->
      <p v-if="hayErrorServidor" id="login-error" class="adm-alerta adm-alerta--error" role="alert">
        {{ errorServidor }}
      </p>

      <form class="adm-form" novalidate :aria-busy="cargando" @submit.prevent="entrar">
        <div class="adm-campo">
          <label class="adm-campo__etiqueta" for="login-usuario">Usuario</label>
          <input
            id="login-usuario"
            ref="campoUsuario"
            v-model="usuario"
            class="adm-campo__control"
            type="text"
            name="usuario"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            required
            :readonly="cargando"
            :aria-invalid="errorUsuario || hayErrorServidor ? 'true' : 'false'"
            :aria-describedby="descripcionUsuario"
            @input="errorUsuario = ''"
          />
          <p v-if="errorUsuario" id="login-usuario-error" class="adm-campo__error">{{ errorUsuario }}</p>
        </div>

        <div class="adm-campo">
          <label class="adm-campo__etiqueta" for="login-clave">Contraseña</label>
          <div class="adm-campo__grupo">
            <input
              id="login-clave"
              ref="campoClave"
              v-model="clave"
              class="adm-campo__control"
              :type="verClave ? 'text' : 'password'"
              name="clave"
              autocomplete="current-password"
              required
              :readonly="cargando"
              :aria-invalid="errorClave || hayErrorServidor ? 'true' : 'false'"
              :aria-describedby="descripcionClave"
              @input="errorClave = ''"
            />
            <button type="button" class="adm-campo__boton" aria-controls="login-clave" @click="verClave = !verClave">
              {{ verClave ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
          <p v-if="errorClave" id="login-clave-error" class="adm-campo__error">{{ errorClave }}</p>
        </div>

        <button type="submit" class="fa-boton adm-boton--bloque" :disabled="cargando">
          <span v-if="cargando" class="adm-boton__spinner" aria-hidden="true"></span>
          {{ cargando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <RouterLink class="adm-login__volver" to="/">Volver a la tienda</RouterLink>
    </section>
  </main>
</template>
