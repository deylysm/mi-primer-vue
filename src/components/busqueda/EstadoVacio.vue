<script setup>
// Mensaje cuando la búsqueda no devuelve nada. Usado por la vista de búsqueda (Fase 4).
defineProps({
  termino: { type: String, default: '' },
})

const emit = defineEmits(['limpiar-filtros'])
</script>

<template>
  <div class="vacio" role="status">
    <p v-if="termino" class="vacio__titulo">No encontramos resultados para «{{ termino }}»</p>
    <p v-else class="vacio__titulo">No encontramos resultados</p>
    <ul class="vacio__sugerencias">
      <li>Revisa la ortografía.</li>
      <li>Quita algunos filtros.</li>
    </ul>
    <button class="vacio__boton" type="button" @click="emit('limpiar-filtros')">
      Limpiar filtros
    </button>
  </div>
</template>

<style scoped>
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--fa-espacio-2);
  padding: var(--fa-espacio-5) var(--fa-espacio-3);
  text-align: center;
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
  box-shadow: var(--fa-sombra-tarjeta);
}
.vacio__titulo {
  margin: 0;
  font-family: var(--fa-fuente-titulos);
  font-size: var(--fa-texto-lg);
  font-weight: 700;
  color: var(--fa-color-primario-oscuro);
  overflow-wrap: anywhere;
}
.vacio__sugerencias {
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--fa-color-texto-suave);
}
.vacio__boton {
  min-height: var(--fa-tactil-min);
  margin-top: var(--fa-espacio-2);
  padding: 0 var(--fa-espacio-4);
  font: inherit;
  font-weight: 600;
  color: var(--fa-color-acento);
  background: var(--fa-fondo-superficie);
  border: 2px solid var(--fa-color-acento);
  border-radius: var(--fa-radio-pildora); /* botón de píldora de contorno verde */
  cursor: pointer;
}
.vacio__boton:hover {
  background: var(--fa-color-marca-suave);
}
</style>
