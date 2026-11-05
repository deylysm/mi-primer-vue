<script setup>
// Diálogo de confirmación antes de borrar un medicamento o una farmacia.
// Usa la etiqueta nativa <dialog> con showModal() (no window.confirm): el navegador se encarga de
// atrapar el foco dentro y de oscurecer el fondo.
// Quién lo usa: src/views/AdminView.vue (debe estar dentro de .fa-app para heredar los estilos).
//
// Props:
//   - abierto: true para mostrarlo.
//   - tipo: 'medicamento' | 'farmacia' (cambia el texto explicativo).
//   - nombre: nombre del elemento a borrar (sale en el título).
//   - borrando: true mientras se espera la respuesta de la API.
//   - error: texto del error si falló el borrado ('' si no hay).
// Emits:
//   - 'confirmar': el usuario pulsó "Sí, borrar".
//   - 'cancelar': el usuario cerró el diálogo (botón, Esc o clic fuera).
// Imports:
//   - 'vue': paquete instalado en node_modules.
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  abierto: { type: Boolean, default: false },
  tipo: { type: String, default: 'medicamento' },
  nombre: { type: String, default: '' },
  borrando: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['confirmar', 'cancelar'])

const dialogo = ref(null)
const botonCancelar = ref(null)

// Abrir / cerrar el <dialog> nativo cuando cambia la prop `abierto`
watch(
  () => props.abierto,
  async (abierto) => {
    const el = dialogo.value
    if (!el) return
    if (abierto && !el.open) {
      el.showModal()
      await nextTick()
      botonCancelar.value?.focus() // el foco empieza en la opción segura
    } else if (!abierto && el.open) {
      el.close()
    }
  },
)

function cancelar() {
  if (props.borrando) return // mientras se borra no se puede cerrar
  emit('cancelar')
}
</script>

<template>
  <dialog
    ref="dialogo"
    class="adm-dialogo"
    aria-labelledby="dlg-titulo"
    aria-describedby="dlg-texto"
    @cancel.prevent="cancelar"
    @click.self="cancelar"
  >
    <div class="adm-dialogo__cuerpo">
      <div class="adm-dialogo__icono" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <h2 id="dlg-titulo" class="adm-dialogo__titulo">¿Borrar «{{ nombre }}»?</h2>
      <p id="dlg-texto" class="adm-dialogo__texto">
        <template v-if="tipo === 'farmacia'">
          Se borrará la farmacia y su disponibilidad de medicamentos. Esta acción no se puede deshacer.
        </template>
        <template v-else>
          Esta acción no se puede deshacer. El medicamento dejará de aparecer en la tienda.
        </template>
      </p>
      <p v-if="error" class="adm-alerta adm-alerta--error" role="alert">{{ error }}</p>
    </div>
    <div class="adm-dialogo__acciones">
      <button ref="botonCancelar" type="button" class="fa-boton fa-boton--secundario" :disabled="borrando" @click="cancelar">
        Cancelar
      </button>
      <button type="button" class="fa-boton adm-boton--peligro-solido" :disabled="borrando" @click="emit('confirmar')">
        <span v-if="borrando" class="adm-boton__spinner" aria-hidden="true"></span>
        {{ borrando ? 'Borrando…' : 'Sí, borrar' }}
      </button>
    </div>
  </dialog>
</template>
