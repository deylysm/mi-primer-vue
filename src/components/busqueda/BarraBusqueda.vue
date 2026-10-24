<script setup>
// Barra de búsqueda. Usada por la vista de búsqueda (Fase 4).
import { computed } from 'vue'

// defineModel(): permite usar v-model="termino" desde el padre.
const termino = defineModel({ type: String, default: '' })

defineProps({
  faltanCaracteres: { type: Boolean, default: false },
  minCaracteres: { type: Number, default: 2 },
})

// 'buscar' se emite al pulsar el botón o Enter (ambos disparan submit del form).
const emit = defineEmits(['buscar'])

const sinTexto = computed(() => termino.value.trim() === '')

function enviar() {
  if (!sinTexto.value) emit('buscar')
}
</script>

<template>
  <form class="barra" role="search" @submit.prevent="enviar">
    <label class="barra__label" for="fa-busqueda">Buscar medicamento</label>
    <div class="barra__campo">
      <input
        id="fa-busqueda"
        v-model="termino"
        class="barra__input"
        type="search"
        placeholder="Ej.: ibuprofeno, paracetamol"
        autocomplete="off"
        :aria-describedby="faltanCaracteres ? 'fa-busqueda-pista' : undefined"
      />
      <button class="barra__boton" type="submit" :disabled="sinTexto">Buscar</button>
    </div>
    <!-- role="status": el lector de pantalla anuncia la pista cuando aparece. -->
    <p v-if="faltanCaracteres" id="fa-busqueda-pista" class="barra__pista" role="status">
      Escribe al menos {{ minCaracteres }} letras
    </p>
  </form>
</template>

<style scoped>
.barra {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-2);
}
.barra__label {
  font-weight: 600;
  color: var(--fa-color-texto);
}
.barra__campo {
  display: flex;
  gap: var(--fa-espacio-2);
}
.barra__input {
  flex: 1;
  min-width: 0;
  min-height: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-3);
  font: inherit;
  color: var(--fa-color-texto);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde-control);
  border-radius: var(--fa-radio);
}
.barra__boton {
  min-height: var(--fa-tactil-min);
  min-width: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-4);
  font: inherit;
  font-weight: 600;
  color: #fff;
  background: var(--fa-color-primario);
  border: 1px solid var(--fa-color-primario);
  border-radius: var(--fa-radio);
  cursor: pointer;
}
.barra__boton:hover:not(:disabled) {
  background: var(--fa-color-primario-hover);
  border-color: var(--fa-color-primario-hover);
}
/* Deshabilitado: fondo de superficie con borde punteado y texto suave, claramente distinto al activo */
.barra__boton:disabled {
  color: var(--fa-color-texto-suave);
  background: var(--fa-fondo-pagina);
  border: 1px dashed var(--fa-borde-control);
  cursor: not-allowed;
}
.barra__pista {
  margin: 0;
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}
</style>
