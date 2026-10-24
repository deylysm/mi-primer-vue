<script setup>
// Lista de resultados. Usada por la vista de búsqueda (Fase 4).
import { computed } from 'vue'
import TarjetaMedicamento from './TarjetaMedicamento.vue' // archivo local, ruta relativa

const props = defineProps({
  resultados: { type: Array, default: () => [] },
})

// Singular/plural correcto: "1 resultado", "3 resultados".
const textoCantidad = computed(() => {
  const n = props.resultados.length
  return `${n} ${n === 1 ? 'resultado' : 'resultados'}`
})
</script>

<template>
  <section class="resultados">
    <!-- aria-live: anuncia la cantidad cada vez que cambia. -->
    <p class="resultados__cantidad" aria-live="polite">{{ textoCantidad }}</p>
    <ul class="resultados__lista" role="list">
      <li v-for="oferta in resultados" :key="oferta.ofertaId" class="resultados__item">
        <TarjetaMedicamento :oferta="oferta" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.resultados__cantidad {
  margin: 0 0 var(--fa-espacio-3);
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  color: var(--fa-color-texto-suave); /* 7:1 sobre el fondo de página */
}
/* Móvil: 1 columna. list-style:none quita viñetas (role="list" en el HTML conserva la semántica). */
.resultados__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr); /* minmax(0,…) evita desbordes por contenido largo */
  gap: var(--fa-espacio-3);
}
.resultados__item {
  min-width: 0;
}
/* Rejilla mobile-first: 1 columna (móvil) -> 2 (>=640px) -> 3 (>=1024px, junto a los
   filtros laterales) -> 4 (>=1360px, cuando ya hay sitio de sobra). */
@media (min-width: 640px) {
  .resultados__lista {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--fa-espacio-4);
  }
}
@media (min-width: 1024px) {
  .resultados__lista {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--fa-espacio-3);
  }
}
@media (min-width: 1360px) {
  .resultados__lista {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
