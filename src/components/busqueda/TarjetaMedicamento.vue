<script setup>
// Tarjeta de UNA oferta (un medicamento en una farmacia).
// Usada por: ListaResultados.vue
import { computed } from 'vue' // paquete 'vue' (node_modules)
import { formatearPrecio } from '@/utils/normalizar.js' // alias @ -> src/

const props = defineProps({
  oferta: { type: Object, required: true },
})

// A partir de esta cantidad (o menos) avisamos "Pocas unidades".
const UMBRAL_POCO_STOCK = 5

// Estado de stock: texto (accesible, no solo color) + clase modificadora.
const stock = computed(() => {
  // Number() + !(n > 0): null, undefined, negativos o NaN también cuentan como agotado.
  const n = Number(props.oferta.stock)
  if (!(n > 0)) return { texto: 'Agotado', modificador: 'agotado' }
  if (n <= UMBRAL_POCO_STOCK) return { texto: `Pocas unidades (${n})`, modificador: 'aviso' }
  return { texto: 'En stock', modificador: 'ok' }
})
</script>

<template>
  <article class="tarjeta">
    <h3 class="tarjeta__nombre">{{ oferta.nombre }}</h3>
    <p class="tarjeta__principio">{{ oferta.principioActivo }}</p>
    <p class="tarjeta__presentacion">{{ oferta.presentacion }}</p>

    <p v-if="oferta.requiereReceta" class="tarjeta__receta">Requiere receta</p>

    <p class="tarjeta__farmacia">
      <span class="tarjeta__farmacia-nombre">{{ oferta.farmacia.nombre }}</span>
      <span class="tarjeta__farmacia-direccion">{{ oferta.farmacia.direccion }}</span>
    </p>

    <p class="tarjeta__precio">{{ formatearPrecio(oferta.precio) }}</p>

    <p :class="['tarjeta__stock', `tarjeta__stock--${stock.modificador}`]">{{ stock.texto }}</p>
  </article>
</template>

<style scoped>
/* Tarjeta: superficie blanca con borde decorativo, radio y sombra. */
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-1);
  height: 100%;
  padding: var(--fa-espacio-3);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
  box-shadow: var(--fa-sombra-tarjeta);
  color: var(--fa-color-texto);
}
.tarjeta p,
.tarjeta h3 {
  margin: 0;
  /* Nombres largos parten línea en vez de desbordar */
  overflow-wrap: anywhere;
}
.tarjeta__nombre {
  font-size: var(--fa-texto-lg);
  font-weight: 700;
  line-height: 1.3;
}
.tarjeta__principio,
.tarjeta__presentacion {
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}
/* Aviso discreto: texto del aviso sobre su fondo, sin llamar demasiado la atención */
.tarjeta__receta {
  align-self: flex-start;
  margin-top: var(--fa-espacio-1);
  padding: 2px var(--fa-espacio-2);
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-aviso);
  background: var(--fa-fondo-aviso);
  border-radius: var(--fa-radio);
}
.tarjeta__farmacia {
  display: flex;
  flex-direction: column;
  margin-top: var(--fa-espacio-2);
  padding-top: var(--fa-espacio-2);
  border-top: 1px solid var(--fa-borde);
}
.tarjeta__farmacia-nombre {
  font-weight: 600;
}
.tarjeta__farmacia-direccion {
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}
/* Precio destacado; margin-top:auto lo alinea abajo si las tarjetas tienen distinta altura */
.tarjeta__precio {
  margin-top: auto;
  padding-top: var(--fa-espacio-2);
  font-size: var(--fa-texto-xl);
  font-weight: 700;
  color: var(--fa-color-texto);
}
/* Badge de stock: el texto ya dice el estado; el color solo refuerza */
.tarjeta__stock {
  align-self: flex-start;
  padding: 2px var(--fa-espacio-2);
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  border-radius: var(--fa-radio);
}
.tarjeta__stock--ok {
  color: var(--fa-color-ok);
  background: var(--fa-fondo-ok);
}
.tarjeta__stock--aviso {
  color: var(--fa-color-aviso);
  background: var(--fa-fondo-aviso);
}
.tarjeta__stock--agotado {
  color: var(--fa-color-error);
  background: var(--fa-fondo-error);
}
</style>
