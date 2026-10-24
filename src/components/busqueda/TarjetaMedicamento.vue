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
    <!-- Cabecita decorativa con una cápsula dibujada en SVG (aún no hay fotos de producto).
         aria-hidden: es solo adorno, los lectores de pantalla la saltan. -->
    <div class="tarjeta__imagen" aria-hidden="true">
      <svg class="tarjeta__capsula" viewBox="0 0 32 32" focusable="false">
        <g transform="rotate(-45 16 16)">
          <rect x="4" y="10.5" width="24" height="11" rx="5.5" class="tarjeta__capsula-mitad-b" />
          <path d="M16 10.5H9.5a5.5 5.5 0 0 0 0 11H16z" class="tarjeta__capsula-mitad-a" />
          <rect x="4" y="10.5" width="24" height="11" rx="5.5" class="tarjeta__capsula-borde" />
        </g>
      </svg>
    </div>

    <h3 class="tarjeta__nombre">{{ oferta.nombre }}</h3>
    <p class="tarjeta__principio">{{ oferta.principioActivo }}</p>
    <p class="tarjeta__presentacion">{{ oferta.presentacion }}</p>

    <p v-if="oferta.requiereReceta" class="tarjeta__receta">Requiere receta</p>

    <p class="tarjeta__farmacia">
      <span class="tarjeta__farmacia-nombre">{{ oferta.farmacia.nombre }}</span>
      <span class="tarjeta__farmacia-direccion">{{ oferta.farmacia.direccion }}</span>
    </p>

    <!-- Pie de la tarjeta: precio grande a la izquierda y badge de stock a la derecha.
         flex-wrap: si no caben en una línea (tarjeta estrecha) el badge baja debajo. -->
    <div class="tarjeta__pie">
      <p class="tarjeta__precio">{{ formatearPrecio(oferta.precio) }}</p>
      <p :class="['tarjeta__stock', `tarjeta__stock--${stock.modificador}`]">{{ stock.texto }}</p>
    </div>
  </article>
</template>

<style scoped>
/* Tarjeta: superficie blanca con borde fino, radio 12px y sombra suave. */
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
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}
/* Hover: la sombra crece y la tarjeta sube un poquito. (hover: hover) = solo en dispositivos
   con ratón; en pantallas táctiles no se queda "pegado" el efecto tras tocar. */
@media (hover: hover) {
  .tarjeta:hover {
    border-color: var(--fa-color-marca);
    box-shadow: var(--fa-sombra-tarjeta-hover);
    transform: translateY(-2px);
  }
}
.tarjeta p,
.tarjeta h3 {
  margin: 0;
  /* Nombres largos parten línea en vez de desbordar */
  overflow-wrap: anywhere;
}

/* Cabecita decorativa a todo el ancho de la tarjeta: los márgenes negativos anulan el padding */
.tarjeta__imagen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  margin: calc(var(--fa-espacio-3) * -1) calc(var(--fa-espacio-3) * -1) var(--fa-espacio-2);
  background: linear-gradient(135deg, var(--fa-color-marca-suave) 0%, #ffffff 100%);
  border-bottom: 1px solid var(--fa-borde);
  border-radius: calc(var(--fa-radio) - 1px) calc(var(--fa-radio) - 1px) 0 0;
}
.tarjeta__capsula {
  width: 44px;
  height: 44px;
}
.tarjeta__capsula-mitad-a {
  fill: var(--fa-color-marca);
}
.tarjeta__capsula-mitad-b {
  fill: #ffffff;
}
.tarjeta__capsula-borde {
  fill: none;
  stroke: var(--fa-color-primario);
  stroke-width: 1.5;
}

.tarjeta__nombre {
  font-size: var(--fa-texto-lg);
  font-weight: 700;
  line-height: 1.3;
  color: var(--fa-color-texto);
}
.tarjeta__principio,
.tarjeta__presentacion {
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}
/* Aviso discreto en forma de píldora: texto del aviso sobre su fondo */
.tarjeta__receta {
  align-self: flex-start;
  margin-top: var(--fa-espacio-1);
  padding: 2px var(--fa-espacio-3);
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  color: var(--fa-color-aviso);
  background: var(--fa-fondo-aviso);
  border-radius: var(--fa-radio-pildora);
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

/* Pie: margin-top:auto lo empuja abajo si las tarjetas tienen distinta altura */
.tarjeta__pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--fa-espacio-1) var(--fa-espacio-2);
  margin-top: auto;
  padding-top: var(--fa-espacio-2);
}
/* Precio grande y destacado en Poppins (verde muy oscuro, 9.9:1 sobre blanco) */
.tarjeta__precio {
  font-family: var(--fa-fuente-titulos);
  font-size: var(--fa-texto-xl);
  font-weight: 700;
  line-height: 1.2;
  color: var(--fa-color-primario-oscuro);
}
/* Badge de stock redondeado: el texto ya dice el estado; el color solo refuerza */
.tarjeta__stock {
  padding: 2px var(--fa-espacio-3);
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  border-radius: var(--fa-radio-pildora);
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
