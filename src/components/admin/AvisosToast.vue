<script setup>
// Dibuja los avisos ("toasts") de éxito y error. Se monta UNA sola vez en src/App.vue.
// Los avisos se crean con avisar() de useAvisos.js; este componente solo los muestra.
// - Éxito: se cierra solo a los 6 s (se pausa con el ratón o el foco encima).
// - Error: se queda hasta pulsar la X (para dar tiempo a leerlo).
// Imports:
//   - 'vue': paquete instalado en node_modules.
//   - '@/composables/useAvisos.js': archivo local; alias @ -> src/.
import { computed, watch, onBeforeUnmount } from 'vue'
import { useAvisos } from '@/composables/useAvisos.js'

const SEGUNDOS_EXITO = 6000

const { avisos, quitarAviso } = useAvisos()
const exitos = computed(() => avisos.value.filter((a) => a.tipo === 'exito'))
const errores = computed(() => avisos.value.filter((a) => a.tipo === 'error'))

// Temporizadores de cierre automático: id del aviso -> id del setTimeout
const temporizadores = new Map()

function arrancar(id) {
  detener(id)
  temporizadores.set(
    id,
    setTimeout(() => {
      temporizadores.delete(id)
      quitarAviso(id)
    }, SEGUNDOS_EXITO),
  )
}

function detener(id) {
  clearTimeout(temporizadores.get(id))
  temporizadores.delete(id)
}

function cerrar(id) {
  detener(id)
  quitarAviso(id)
}

// Cuando aparece un aviso de éxito nuevo, se programa su cierre.
watch(
  exitos,
  (lista) => {
    for (const a of lista) if (!temporizadores.has(a.id)) arrancar(a.id)
    // Limpia temporizadores de avisos que ya no existen (p. ej. descartados por el máximo de 3)
    for (const id of [...temporizadores.keys()]) {
      if (!lista.some((a) => a.id === id)) detener(id)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  for (const id of [...temporizadores.keys()]) detener(id)
})
</script>

<template>
  <!-- Las dos regiones existen siempre (aunque estén vacías): así los lectores de pantalla
       anuncian el texto nuevo que aparece dentro. -->
  <div class="adm-avisos">
    <div class="adm-avisos__region" role="status" aria-live="polite" aria-atomic="true">
      <div
        v-for="a in exitos"
        :key="a.id"
        class="adm-toast adm-toast--exito"
        @mouseenter="detener(a.id)"
        @mouseleave="arrancar(a.id)"
        @focusin="detener(a.id)"
        @focusout="arrancar(a.id)"
      >
        <svg class="adm-toast__icono" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <p class="adm-toast__texto">{{ a.texto }}</p>
        <button type="button" class="adm-toast__cerrar" aria-label="Cerrar aviso" @click="cerrar(a.id)">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
    <div class="adm-avisos__region" role="alert" aria-live="assertive" aria-atomic="true">
      <div v-for="a in errores" :key="a.id" class="adm-toast adm-toast--error">
        <svg class="adm-toast__icono" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 7v6M12 17h.01" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
        <p class="adm-toast__texto">{{ a.texto }}</p>
        <button type="button" class="adm-toast__cerrar" aria-label="Cerrar aviso" @click="cerrar(a.id)">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
