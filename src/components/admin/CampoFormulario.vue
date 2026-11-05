<script setup>
// Un campo de formulario reutilizable: etiqueta + control + ayuda + mensaje de error.
// El control (input, select...) lo pone quien usa este componente dentro del slot, y recibe
// del slot un objeto `atributos` ya listo (id, required, aria-invalid, aria-describedby) que se
// aplica con v-bind. Así el accesibilidad (etiqueta enlazada, error leído por el lector) se escribe
// una sola vez. Ejemplo de uso:
//   <CampoFormulario id="med-nombre" etiqueta="Nombre" requerido :error="errores.nombre">
//     <template #default="{ atributos }">
//       <input v-bind="atributos" v-model="datos.nombre" class="adm-campo__control" type="text" />
//     </template>
//   </CampoFormulario>
// Quién lo usa: FormMedicamento.vue, FilaInventario.vue, FormFarmacia.vue. 'vue' = node_modules.
import { computed } from 'vue'

const props = defineProps({
  id: { type: String, required: true }, // id del control; ayuda y error derivan de él (id-ayuda, id-error)
  etiqueta: { type: String, required: true },
  requerido: { type: Boolean, default: false },
  opcional: { type: Boolean, default: false }, // muestra "(opcional)" junto a la etiqueta
  ayuda: { type: String, default: '' },
  error: { type: String, default: '' },
  clase: { type: String, default: '' }, // clases extra: 'adm-campo--completo', 'adm-campo--farmacia'
})

const idAyuda = computed(() => `${props.id}-ayuda`)
const idError = computed(() => `${props.id}-error`)

// Solo se listan en aria-describedby los ids que existen en este momento.
const atributos = computed(() => {
  const ids = []
  if (props.ayuda) ids.push(idAyuda.value)
  if (props.error) ids.push(idError.value)
  return {
    id: props.id,
    required: props.requerido || undefined,
    'aria-invalid': props.error ? 'true' : 'false',
    'aria-describedby': ids.length ? ids.join(' ') : undefined,
  }
})
</script>

<template>
  <div class="adm-campo" :class="clase">
    <label class="adm-campo__etiqueta" :for="id">
      {{ etiqueta }}
      <span v-if="requerido" aria-hidden="true">*</span>
      <span v-if="opcional" class="adm-campo__opcional">(opcional)</span>
    </label>
    <p v-if="ayuda" :id="idAyuda" class="adm-campo__ayuda">{{ ayuda }}</p>
    <slot :atributos="atributos" />
    <p v-if="error" :id="idError" class="adm-campo__error">{{ error }}</p>
  </div>
</template>
