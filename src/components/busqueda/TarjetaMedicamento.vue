<script setup>
// Tarjeta de UNA oferta (un medicamento en una farmacia).
// Usada por: ListaResultados.vue
// TODA la tarjeta es clicable: el nombre es un único enlace real (<RouterLink>) cuyo ::after
// se estira sobre la tarjeta entera. Así no hay enlaces anidados y el teclado solo para una vez.
import { computed } from 'vue' // paquete 'vue' (node_modules)
import { RouterLink } from 'vue-router' // paquete 'vue-router' (node_modules): enlace sin recargar
import { formatearPrecio } from '@/utils/normalizar.js' // alias @ -> src/
import { describirStock } from '@/utils/stock.js' // alias @ -> src/: texto + clase del stock
import ImagenCategoria from '@/components/comunes/ImagenCategoria.vue' // alias @ -> src/

const props = defineProps({
  oferta: { type: Object, required: true },
})

// Estado de stock: texto (accesible, no solo color) + clase modificadora.
const stock = computed(() => describirStock(props.oferta.stock))

// Destino del enlace: /medicamento/ID?farmacia=ID_FARMACIA (el detalle preselecciona esa farmacia).
const destino = computed(() => ({
  name: 'medicamento',
  params: { id: props.oferta.medicamentoId },
  query: { farmacia: props.oferta.farmacia.id },
}))
</script>

<template>
  <article class="tarjeta">
    <!-- Cabecita decorativa con la ilustración de la categoría (SVG propio de ImagenCategoria.vue).
         aria-hidden dentro del propio componente: los lectores de pantalla la saltan. -->
    <div class="tarjeta__imagen">
      <ImagenCategoria :categoria="oferta.categoria" tamano="sm" />
    </div>

    <h3 class="tarjeta__nombre">
      <RouterLink class="tarjeta__enlace" :to="destino">{{ oferta.nombre }}</RouterLink>
    </h3>
    <p class="tarjeta__principio">{{ oferta.principioActivo }}</p>
    <p class="tarjeta__presentacion">{{ oferta.presentacion }}</p>

    <p v-if="oferta.requiereReceta" class="tarjeta__receta">Requiere receta</p>

    <p class="tarjeta__farmacia">
      <span class="tarjeta__farmacia-nombre">{{ oferta.farmacia.nombre }}</span>
      <span class="tarjeta__farmacia-direccion">{{ oferta.farmacia.direccion }}</span>
    </p>

    <!-- Pie de la tarjeta: precio grande y, debajo, el badge de stock. Siempre apilados para que
         el pie mida lo mismo en todas las tarjetas y los precios queden alineados en la fila. -->
    <div class="tarjeta__pie">
      <p class="tarjeta__precio">{{ formatearPrecio(oferta.precio) }}</p>
      <p :class="['tarjeta__stock', `tarjeta__stock--${stock.modificador}`]">{{ stock.texto }}</p>
    </div>
  </article>
</template>

<style scoped>
/* Tarjeta: superficie blanca con borde fino, radio 12px y sombra suave. */
.tarjeta {
  position: relative; /* referencia del ::after del enlace (que cubre toda la tarjeta) */
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
  height: 72px; /* 48px de ilustración + 12px de aire arriba y abajo */
  margin: calc(var(--fa-espacio-3) * -1) calc(var(--fa-espacio-3) * -1) var(--fa-espacio-2);
  background: linear-gradient(135deg, var(--fa-color-marca-suave) 0%, #ffffff 100%);
  border-bottom: 1px solid var(--fa-borde);
  border-radius: calc(var(--fa-radio) - 1px) calc(var(--fa-radio) - 1px) 0 0;
}

.tarjeta__nombre {
  font-size: var(--fa-texto-lg);
  font-weight: 700;
  line-height: 1.3;
  color: var(--fa-color-texto);
}

/* Enlace del nombre. Anula el estilo global de "a" de main.css (padding, color verde,
   fondo al pasar el ratón, transición) para que parezca el título normal de la tarjeta. */
.tarjeta__enlace {
  padding: 0;
  color: inherit;
  background: transparent;
  transition: none;
  text-decoration: none;
}
.tarjeta__enlace:hover {
  background: transparent;
  color: var(--fa-color-primario);
  text-decoration: underline;
}
/* ::after invisible que se estira sobre TODA la tarjeta (el <article> es position:relative):
   un clic en cualquier punto activa el enlace. */
.tarjeta__enlace::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--fa-radio);
}
/* Foco de teclado: aro alrededor de la tarjeta entera (si el navegador soporta :has()).
   Si no lo soporta, queda el aro normal sobre el enlace (regla global de farmaapp.css). */
@supports selector(:has(*)) {
  .tarjeta__enlace:focus-visible {
    outline: none;
  }
  .tarjeta:has(.tarjeta__enlace:focus-visible) {
    outline: 3px solid var(--fa-color-foco);
    outline-offset: 2px;
  }
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

/* Pie: margin-top:auto lo empuja al fondo de la tarjeta (las tarjetas de una fila miden lo mismo).
   Antes el precio y el badge estaban en una fila con flex-wrap: en unas tarjetas el badge bajaba
   a otra línea y en otras no, así que el pie tenía alturas distintas y los precios quedaban
   desalineados. Ahora SIEMPRE van apilados (precio arriba, badge debajo): todos los pies miden
   lo mismo y el precio queda a la misma altura en todas las tarjetas de la fila. */
.tarjeta__pie {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--fa-espacio-1);
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
  max-width: 100%;
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
