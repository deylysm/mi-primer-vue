<script setup>
// Pestañas "Medicamentos" / "Farmacias" del panel. Sigue el patrón ARIA de pestañas:
// solo la pestaña activa se puede alcanzar con Tab (tabindex 0); entre pestañas se va con las
// flechas, Inicio y Fin (activan la pestaña al moverse).
// Quién lo usa: src/views/AdminView.vue (v-model con la sección activa).
// Los paneles (role="tabpanel") los dibuja AdminView; aquí solo la fila de pestañas.
// No tiene imports: usa solo las macros de <script setup> (defineProps, defineEmits).
const props = defineProps({
  // 'medicamentos' o 'farmacias'
  modelValue: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const pestanas = [
  { id: 'medicamentos', texto: 'Medicamentos' },
  { id: 'farmacias', texto: 'Farmacias' },
]

function activar(indice) {
  const destino = pestanas[indice]
  emit('update:modelValue', destino.id)
  // Mueve también el foco (activación automática). Se busca por id: no depende del orden de refs.
  document.getElementById(`tab-${destino.id}`)?.focus()
}

function alPulsarTecla(evento, indice) {
  const ultimo = pestanas.length - 1
  let nuevo = null
  if (evento.key === 'ArrowRight') nuevo = indice === ultimo ? 0 : indice + 1
  else if (evento.key === 'ArrowLeft') nuevo = indice === 0 ? ultimo : indice - 1
  else if (evento.key === 'Home') nuevo = 0
  else if (evento.key === 'End') nuevo = ultimo
  if (nuevo === null) return
  evento.preventDefault()
  activar(nuevo)
}
</script>

<template>
  <div class="adm-tabs__lista" role="tablist" aria-label="Secciones de administración">
    <button
      v-for="(p, i) in pestanas"
      :key="p.id"
      :id="`tab-${p.id}`"
      class="adm-tab"
      role="tab"
      type="button"
      :aria-selected="props.modelValue === p.id ? 'true' : 'false'"
      :aria-controls="`panel-${p.id}`"
      :tabindex="props.modelValue === p.id ? 0 : -1"
      @click="emit('update:modelValue', p.id)"
      @keydown="alPulsarTecla($event, i)"
    >
      {{ p.texto }}
    </button>
  </div>
</template>
