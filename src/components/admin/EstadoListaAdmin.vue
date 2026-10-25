<script setup>
// Bloque que se muestra en lugar de la tabla cuando la lista falla o está vacía.
//   - tipo "error": aviso rojo (role="alert") con el botón "Reintentar".
//   - tipo "vacio": mensaje amable con el botón "Nuevo ..." para crear el primero.
// Quién lo usa: src/views/AdminView.vue (una vez por pestaña). Sin imports.
defineProps({
  tipo: { type: String, default: 'vacio' }, // 'vacio' | 'error'
  titulo: { type: String, required: true },
  texto: { type: String, required: true },
  textoBoton: { type: String, required: true },
})
const emit = defineEmits(['accion']) // se emite al pulsar el botón
</script>

<template>
  <div
    class="adm-estado"
    :class="{ 'adm-estado--error': tipo === 'error' }"
    :role="tipo === 'error' ? 'alert' : undefined"
  >
    <h3 class="adm-estado__titulo">{{ titulo }}</h3>
    <p class="adm-estado__texto">{{ texto }}</p>
    <button type="button" class="fa-boton" @click="emit('accion')">{{ textoBoton }}</button>
  </div>
</template>
