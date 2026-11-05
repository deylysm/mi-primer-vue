<script setup>
// Lista de resultados. Usada por la vista de búsqueda (Fase 4).
import { computed } from 'vue'
import TarjetaMedicamento from './TarjetaMedicamento.vue' // archivo local, ruta relativa

const props = defineProps({
  resultados: { type: Array, default: () => [] }, // los que se dibujan (ya ordenados y recortados)
  total: { type: Number, default: null }, // total encontrado antes de recortar (opcional)
})

// Singular/plural correcto: "1 resultado", "3 resultados".
// Si se muestran menos de los encontrados: "Mostrando 12 de 30 resultados".
const textoCantidad = computed(() => {
  const n = props.resultados.length
  const total = props.total ?? n
  const palabra = total === 1 ? 'resultado' : 'resultados'
  return total > n ? `Mostrando ${n} de ${total} ${palabra}` : `${total} ${palabra}`
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
/* Rejilla mobile-first: 1 columna (móvil) -> 2 (>=640px) -> se mantienen 2 junto a los filtros
   laterales en 1024-1279px (las tarjetas ahora son más anchas y con imagen grande) ->
   3 (>=1280px, como la maqueta de escritorio). */
@media (min-width: 640px) {
  .resultados__lista {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--fa-espacio-4);
  }
}
@media (min-width: 1280px) {
  .resultados__lista {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
