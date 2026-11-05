<script setup>
// Tarjeta de UNA oferta (un medicamento en una farmacia).
// Usada por: ListaResultados.vue
// TODA la tarjeta es clicable: el nombre es un único enlace real (<RouterLink>) cuyo ::after
// se estira sobre la tarjeta entera. Así no hay enlaces anidados y el teclado solo para una vez.
//
// El botón "Agregar" es la excepción: es un <button> aparte que se coloca POR ENCIMA del ::after
// del enlace (position: relative + z-index), así que se puede pulsar sin abrir el detalle.
import { ref, computed, onBeforeUnmount } from 'vue' // paquete 'vue' (node_modules)
import { RouterLink } from 'vue-router' // paquete 'vue-router' (node_modules): enlace sin recargar
import { formatearPrecio } from '@/utils/normalizar.js' // alias @ -> src/
import { describirStock } from '@/utils/stock.js' // alias @ -> src/: texto + clase del stock
import { useCarrito } from '@/composables/useCarrito.js' // alias @ -> src/: carrito compartido
import ImagenMedicamento from '@/components/comunes/ImagenMedicamento.vue' // alias @ -> src/: imagen del producto (con respaldo de categoría)

const props = defineProps({
  oferta: { type: Object, required: true },
})

// Estado de stock: texto (accesible, no solo color) + clase modificadora.
const stock = computed(() => describirStock(props.oferta.stock))
const sinStock = computed(() => !(Number(props.oferta.stock) > 0))

// Oferta: solo hay descuento si existe `precioAnterior` y es mayor que el precio actual.
// El % se redondea (p. ej. 7.9 frente a 13.2 -> 40).
const descuento = computed(() => {
  const { precio, precioAnterior } = props.oferta
  if (!(precioAnterior > precio)) return 0
  return Math.round((1 - precio / precioAnterior) * 100)
})

// ---- Botón "Agregar" ----
const { agregar } = useCarrito()
const aviso = ref('') // texto del aviso (role="status"); '' = sin aviso
let temporizadorAviso = null

function mostrarAviso(texto) {
  aviso.value = texto
  clearTimeout(temporizadorAviso)
  // El aviso desaparece solo a los 2,5 s.
  temporizadorAviso = setTimeout(() => {
    aviso.value = ''
  }, 2500)
}

// Añade 1 unidad de ESTA oferta (este medicamento en ESTA farmacia).
function agregarAlCarrito() {
  const o = props.oferta
  const { agregadas, enCarrito } = agregar(
    {
      medicamentoId: o.medicamentoId,
      farmaciaId: o.farmacia.id,
      nombre: o.nombre,
      farmaciaNombre: o.farmacia.nombre,
      precio: o.precio,
      categoria: o.categoria,
      imagen: o.imagen,
      stock: o.stock,
    },
    1,
  )
  mostrarAviso(
    agregadas > 0
      ? `Agregado (${enCarrito} en el carrito)`
      : 'Ya tienes todo el stock disponible en el carrito',
  )
}

// Si la tarjeta desaparece (p. ej. cambian los resultados), se cancela el temporizador pendiente.
onBeforeUnmount(() => clearTimeout(temporizadorAviso))

// Destino del enlace: /medicamento/ID?farmacia=ID_FARMACIA (el detalle preselecciona esa farmacia).
const destino = computed(() => ({
  name: 'medicamento',
  params: { id: props.oferta.medicamentoId },
  query: { farmacia: props.oferta.farmacia.id },
}))
</script>

<template>
  <article class="tarjeta">
    <!-- Imagen del producto (oferta.imagen). Si falta o no carga, ImagenMedicamento muestra por
         sí sola la ilustración de la categoría. Es decorativa (alt vacío): el nombre ya está como texto. -->
    <div class="tarjeta__imagen">
      <ImagenMedicamento :imagen="oferta.imagen" :categoria="oferta.categoria" :nombre="oferta.nombre" tamano="lg" />
    </div>

    <!-- Marca del producto (pequeña, en cursiva y gris) -->
    <p v-if="oferta.marca" class="tarjeta__marca">{{ oferta.marca }}</p>

    <h3 class="tarjeta__nombre">
      <RouterLink class="tarjeta__enlace" :to="destino">{{ oferta.nombre }}</RouterLink>
    </h3>
    <p class="tarjeta__principio">{{ oferta.principioActivo }}</p>
    <p class="tarjeta__presentacion">{{ oferta.presentacion }}</p>

    <!-- Etiqueta de venta: "Requiere receta" o "Venta directa" (nunca las dos). -->
    <p
      :class="['tarjeta__etiqueta', oferta.requiereReceta ? 'tarjeta__etiqueta--receta' : 'tarjeta__etiqueta--directa']"
    >
      {{ oferta.requiereReceta ? 'Requiere receta' : 'Venta directa' }}
    </p>

    <p class="tarjeta__farmacia">
      <span class="tarjeta__farmacia-nombre">{{ oferta.farmacia.nombre }}</span>
      <span class="tarjeta__farmacia-direccion">{{ oferta.farmacia.direccion }}</span>
    </p>

    <!-- Pie de la tarjeta: precios, stock, entrega y botón. Siempre apilados para que
         el pie mida lo mismo en todas las tarjetas y los precios queden alineados en la fila. -->
    <div class="tarjeta__pie">
      <div class="tarjeta__precios">
        <!-- Precio anterior tachado (<s>) + etiqueta de descuento: solo si hay oferta -->
        <p v-if="descuento > 0" class="tarjeta__precio-anterior">
          <span class="fa-visualmente-oculto">Precio anterior: </span>
          <s>{{ formatearPrecio(oferta.precioAnterior) }}</s>
        </p>
        <p class="tarjeta__precio-fila">
          <span class="tarjeta__precio">
            <span class="fa-visualmente-oculto">Precio: </span>{{ formatearPrecio(oferta.precio) }}
          </span>
          <span v-if="descuento > 0" class="tarjeta__descuento">
            <span aria-hidden="true">-{{ descuento }}%</span>
            <span class="fa-visualmente-oculto">{{ descuento }}% de descuento</span>
          </span>
        </p>
      </div>

      <p :class="['tarjeta__stock', `tarjeta__stock--${stock.modificador}`]">{{ stock.texto }}</p>

      <!-- Fila "Despacho | Retiro" (iconos SVG decorativos; el texto ya dice qué es).
           Con stock 0 no hay ni despacho ni retiro: se muestra "Sin stock". -->
      <p v-if="sinStock" class="tarjeta__entrega tarjeta__entrega--sin-stock">Sin stock</p>
      <ul v-else class="tarjeta__entrega" role="list">
        <li class="tarjeta__entrega-item">
          <!-- Camión -->
          <svg class="tarjeta__icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
          </svg>
          Despacho
        </li>
        <li class="tarjeta__entrega-item">
          <!-- Tienda -->
          <svg class="tarjeta__icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 10v10h16V10M3 10l2-6h14l2 6zM10 20v-6h4v6" />
          </svg>
          Retiro
        </li>
      </ul>

      <!-- Zona del botón: position + z-index para quedar por ENCIMA del ::after del enlace. -->
      <div class="tarjeta__acciones">
        <button
          class="tarjeta__agregar"
          type="button"
          :disabled="sinStock"
          :aria-label="`Agregar ${oferta.nombre} de ${oferta.farmacia.nombre} al carrito`"
          @click="agregarAlCarrito"
        >
          Agregar
        </button>
        <!-- role="status": el lector de pantalla anuncia el cambio de texto. El <p> existe siempre
             (vacío) porque las regiones "live" se anuncian mejor si ya estaban en la página. -->
        <p class="tarjeta__aviso" role="status">{{ aviso }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* Tarjeta: superficie blanca con borde fino, radio 12px y sombra suave. El padding crece a 20px
   desde 640px (más aire = aspecto de tienda). */
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
@media (min-width: 640px) {
  .tarjeta {
    padding: 20px;
  }
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

/* Zona de la imagen: ancha, blanca y con la ilustración (140px, tamano="lg") centrada,
   como la foto de producto de una tienda. */
.tarjeta__imagen {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block: var(--fa-espacio-2);
  margin-bottom: var(--fa-espacio-2);
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
/* Datos secundarios (principio activo, presentación): pequeños y en gris, sin competir con el nombre */
.tarjeta__principio,
.tarjeta__presentacion {
  font-size: 0.8125rem; /* 13px */
  line-height: 1.4;
  color: var(--fa-color-texto-suave); /* 7:1 sobre blanco */
}
/* Marca: pequeña, cursiva y gris */
.tarjeta__marca {
  font-size: var(--fa-texto-sm);
  font-style: italic;
  color: var(--fa-color-texto-suave);
}
/* Etiqueta de venta en forma de píldora. "Requiere receta" = aviso; "Venta directa" = ok. */
.tarjeta__etiqueta {
  align-self: flex-start;
  margin-top: var(--fa-espacio-2);
  padding: 2px 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: var(--fa-radio-sm); /* esquinas redondeadas (8px) como la maqueta */
}
.tarjeta__etiqueta--receta {
  color: var(--fa-color-aviso);
  background: var(--fa-fondo-aviso);
}
.tarjeta__etiqueta--directa {
  color: var(--fa-color-ok);
  background: var(--fa-fondo-ok);
}
.tarjeta__farmacia {
  display: flex;
  flex-direction: column;
  margin-top: var(--fa-espacio-2);
  padding-top: var(--fa-espacio-2);
  border-top: 1px solid var(--fa-borde);
}
.tarjeta__farmacia-nombre {
  font-size: var(--fa-texto-sm);
  font-weight: 600;
}
.tarjeta__farmacia-direccion {
  font-size: 0.8125rem;
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
  gap: var(--fa-espacio-2);
  margin-top: auto;
  padding-top: var(--fa-espacio-2);
}
/* Precio grande y destacado en Poppins (verde muy oscuro, 9.9:1 sobre blanco) */
.tarjeta__precio {
  font-family: var(--fa-fuente-titulos);
  font-size: 1.625rem; /* 26px */
  font-weight: 700;
  line-height: 1.2;
  color: var(--fa-color-primario-oscuro);
}
/* Precios: anterior tachado arriba; debajo, precio actual + etiqueta de descuento en una fila */
.tarjeta__precios {
  display: flex;
  flex-direction: column;
}
.tarjeta__precio-anterior {
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}
.tarjeta__precio-fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--fa-espacio-2);
}
/* Etiqueta roja "-40%": fondo rojo sólido y texto blanco en negrita (blanco sobre #b3261e = 6,5:1) */
.tarjeta__descuento {
  padding: 2px 10px;
  font-size: var(--fa-texto-sm);
  font-weight: 700;
  color: #ffffff;
  background: var(--fa-color-error);
  border-radius: var(--fa-radio-sm);
}
/* Fila "Despacho | Retiro": rejilla de 2 columnas iguales con una línea vertical entre ellas.
   Cada opción apila icono verde (arriba) y texto (abajo), centrados. */
.tarjeta__entrega {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-self: stretch; /* ocupa todo el ancho de la tarjeta (el pie alinea al inicio) */
  margin: var(--fa-espacio-1) 0 0;
  padding: var(--fa-espacio-2) 0;
  list-style: none;
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
  border-top: 1px solid var(--fa-borde);
}
.tarjeta__entrega-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--fa-espacio-1);
  text-align: center;
}
/* La línea vertical: borde izquierdo del segundo elemento */
.tarjeta__entrega-item + .tarjeta__entrega-item {
  border-left: 1px solid var(--fa-borde);
}
/* "Sin stock": un solo texto centrado (no hay iconos ni columnas) */
.tarjeta__entrega--sin-stock {
  display: block;
  text-align: center;
  font-weight: 600;
  color: var(--fa-color-error);
}
.tarjeta__icono {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--fa-color-primario); /* el trazo usa currentColor: icono verde (5,4:1) */
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Zona del botón: relative + z-index:1 la ponen POR ENCIMA del ::after del enlace
   (que cubre la tarjeta entera), así el botón se pulsa sin abrir el detalle. */
.tarjeta__acciones {
  position: relative;
  z-index: 1;
  width: 100%;
}
/* Botón ancho: texto blanco en negrita sobre verde #0b7a38 = 5,4:1 (AA). 48px de alto (>= 44px). */
.tarjeta__agregar {
  width: 100%;
  min-height: 48px;
  padding: 0 var(--fa-espacio-4);
  font: inherit;
  font-size: var(--fa-texto-base);
  font-weight: 700;
  color: #ffffff;
  background: var(--fa-color-primario);
  border: 0;
  border-radius: var(--fa-radio-sm);
  cursor: pointer;
}
.tarjeta__agregar:hover:not(:disabled) {
  background: var(--fa-color-primario-hover);
}
.tarjeta__agregar:active:not(:disabled) {
  background: var(--fa-color-primario-oscuro);
}
.tarjeta__agregar:disabled {
  color: var(--fa-color-texto-suave);
  background: var(--fa-borde);
  cursor: not-allowed;
}
/* Aviso "Agregado": vacío = no ocupa alto (margin 0 y sin contenido). */
.tarjeta__aviso {
  margin: 0;
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  color: var(--fa-color-ok);
}
.tarjeta__aviso:not(:empty) {
  margin-top: var(--fa-espacio-1);
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
