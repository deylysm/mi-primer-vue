<!--
  IconoCategoria.vue  (src/components/comunes/)
  Qué es: un ICONO LINEAL (solo contorno, de un único color) para cada categoría de medicamentos.
  Está dibujado a mano con SVG (sin librerías de iconos): no hay archivos que descargar.
  Quién lo usa: MenuEscritorio.vue (filas del mega-menú y título del panel) y MenuLateral.vue
  (filas del cajón móvil). Las tarjetas, el detalle y el carrito siguen usando ImagenCategoria.vue
  (la ilustración a color): este componente es SOLO para los menús.

  Contrato:
    - prop `categoria` (String): id de la categoría ('analgesico', 'vitaminas'...). Si no existe o
      viene vacía se dibuja una cruz médica (respaldo).
    - Es decorativo: aria-hidden="true" (el nombre ya aparece como texto junto al icono).
    - Color: usa `currentColor`, o sea el `color` CSS del padre. Tamaño: el SVG ocupa el 100% de su
      contenedor, así que el padre decide el tamaño con CSS (p. ej. width/height en su <span>).

  Dibujos: analgesico = pastilla redonda con ranura | antiinflamatorio = llama | antibiotico = cápsula
  diagonal | antialergico = flor de 6 pétalos | gastrico = estómago | antidiabetico = gota con cruz
  cardiovascular = corazón con línea de latido | respiratorio = pulmones | vitaminas = frasco con tapa
  hidratacion = gota | (otro id) = cruz médica
-->
<script setup>
import { computed } from 'vue' // paquete 'vue' (node_modules)

const props = defineProps({
  categoria: { type: String, default: '' },
})

// Ids que tienen dibujo propio. Cualquier otro id usa el respaldo (cruz médica).
const conocidas = [
  'analgesico',
  'antiinflamatorio',
  'antibiotico',
  'antialergico',
  'gastrico',
  'antidiabetico',
  'cardiovascular',
  'respiratorio',
  'vitaminas',
  'hidratacion',
]
const tipo = computed(() => (conocidas.includes(props.categoria) ? props.categoria : 'respaldo'))

// Ángulos de los 6 pétalos de la flor (antialérgico).
const angulosPetalos = [0, 60, 120, 180, 240, 300]
</script>

<template>
  <!-- viewBox="0 0 24 24": lienzo de 24x24 "unidades"; el SVG se escala solo al tamaño de su contenedor.
       fill="none" + stroke="currentColor": no se rellena, solo se dibuja el contorno con el color del texto.
       Estos atributos los heredan todas las formas de dentro. -->
  <svg
    class="icono-categoria"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <!-- ANALGÉSICO: pastilla redonda con ranura -->
    <g v-if="tipo === 'analgesico'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
    </g>

    <!-- ANTIINFLAMATORIO: llama -->
    <path
      v-else-if="tipo === 'antiinflamatorio'"
      d="M12 3c.5 3.5 5.5 5 5.5 10.2a5.5 5.5 0 0 1-11 0c0-2.4 1.2-3.9 2.3-5.2.4 1.4 1 2.1 1.9 2.4C10.3 7.6 10.6 5 12 3z"
    />

    <!-- ANTIBIÓTICO: cápsula en diagonal (un rectángulo redondeado girado -45 grados) -->
    <g v-else-if="tipo === 'antibiotico'" transform="rotate(-45 12 12)">
      <rect x="2.5" y="8" width="19" height="8" rx="4" />
      <path d="M12 8v8" />
    </g>

    <!-- ANTIALÉRGICO: flor de 6 pétalos (6 elipses giradas alrededor del centro) -->
    <g v-else-if="tipo === 'antialergico'">
      <ellipse
        v-for="angulo in angulosPetalos"
        :key="angulo"
        cx="12"
        cy="6.6"
        rx="2.3"
        ry="3.6"
        :transform="`rotate(${angulo} 12 12)`"
      />
      <circle cx="12" cy="12" r="1.4" />
    </g>

    <!-- GÁSTRICO: estómago (esófago arriba, curva grande a la derecha) -->
    <g v-else-if="tipo === 'gastrico'">
      <path
        d="M8 3v5c0 1.5-3.5 3-3.5 7A5.5 5.5 0 0 0 10 20.5c5 0 9-3 9-7.5 0-2.5-2-4-4.5-4-2.5 0-3.5-1-3.5-3V3"
      />
      <path d="M8 3h3" />
    </g>

    <!-- ANTIDIABÉTICO: gota con cruz -->
    <g v-else-if="tipo === 'antidiabetico'">
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
      <path d="M12 11.5v5M9.5 14h5" />
    </g>

    <!-- CARDIOVASCULAR: corazón con línea de latido -->
    <g v-else-if="tipo === 'cardiovascular'">
      <path
        d="M12 20C7 16.5 3.5 13.5 3.5 9.5A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 20.5 9.5C20.5 13.5 17 16.5 12 20z"
      />
      <path d="M6 12.5h3l1.5-3 2.5 5.5 1.5-2.5H18" />
    </g>

    <!-- RESPIRATORIO: pulmones con tráquea y bronquios -->
    <g v-else-if="tipo === 'respiratorio'">
      <path d="M9 8c-3 1-5 5-5 9 0 2 1.5 3 3 3s2-1 2-3V8z" />
      <path d="M15 8c3 1 5 5 5 9 0 2-1.5 3-3 3s-2-1-2-3V8z" />
      <path d="M12 3v8M12 11c0 1-1.5 1.5-3 3M12 11c0 1 1.5 1.5 3 3" />
    </g>

    <!-- VITAMINAS: frasco con tapa y etiqueta -->
    <g v-else-if="tipo === 'vitaminas'">
      <rect x="8" y="3" width="8" height="3.5" rx="1" />
      <path d="M7 6.5h10l1 2V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5z" />
      <path d="M9 12.5h6M9 16h6" />
    </g>

    <!-- HIDRATACIÓN: gota -->
    <g v-else-if="tipo === 'hidratacion'">
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
      <path d="M9.3 14.5a2.9 2.9 0 0 0 2.4 2.7" />
    </g>

    <!-- RESPALDO (id desconocido o vacío): cruz médica -->
    <path v-else d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z" />
  </svg>
</template>

<style scoped>
/* El SVG llena el contenedor del padre (que le da el tamaño). `display: block` quita el hueco
   que los elementos "en línea" dejan debajo. El color viene del `color` del padre (currentColor). */
.icono-categoria {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
