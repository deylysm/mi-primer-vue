<script setup>
// Mensaje de error con botón para reintentar. Usado por la vista de búsqueda (Fase 4).
defineProps({
  mensaje: { type: String, default: 'Ocurrió un error inesperado.' },
})

const emit = defineEmits(['reintentar'])
</script>

<template>
  <!-- role="alert": el lector de pantalla lo anuncia de inmediato -->
  <div class="error" role="alert">
    <p class="error__mensaje">{{ mensaje }}</p>
    <button class="error__boton" type="button" @click="emit('reintentar')">Reintentar</button>
  </div>
</template>

<style scoped>
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--fa-espacio-3);
  padding: var(--fa-espacio-4) var(--fa-espacio-3);
  text-align: center;
  color: var(--fa-color-error);
  background: var(--fa-fondo-error);
  border: 1px solid var(--fa-color-error);
  border-radius: var(--fa-radio);
}
.error__mensaje {
  margin: 0;
  font-size: var(--fa-texto-lg);
  font-weight: 600;
  overflow-wrap: anywhere;
}
/* Botón sólido en rojo de error con texto del color de fondo del error */
.error__boton {
  min-height: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-4);
  font: inherit;
  font-weight: 600;
  color: var(--fa-fondo-error);
  background: var(--fa-color-error);
  border: 1px solid var(--fa-color-error);
  border-radius: var(--fa-radio-pildora); /* botón de píldora, como el resto de botones */
  cursor: pointer;
}
.error__boton:hover {
  background: var(--fa-color-texto);
  border-color: var(--fa-color-texto);
}
</style>
