<!--
  ImagenCategoria.vue  (src/components/comunes/)
  Qué es: la "imagen" de una categoría de medicamentos. Es una ILUSTRACIÓN dibujada con SVG
  (gráficos vectoriales escritos como texto dentro del propio HTML): no hay archivos de imagen
  que descargar, se ven nítidas a cualquier tamaño y toman los colores de cada categoría.
  Quién la usa: TarjetaMedicamento.vue (cabecita de la tarjeta), DetalleMedicamentoView.vue
  (imagen grande), CarritoView.vue (miniatura de cada línea) y MenuLateral.vue (icono de cada categoría).

  CONTRATO ESTABLE (no cambia, así los demás componentes no se tocan):
    - prop `categoria` (String): id de la categoría ('analgesico', 'vitaminas'...). Si no existe
      o viene vacía se dibuja una cruz médica gris (fallback).
    - prop `tamano` (String, opcional): 'sm' (48px) | 'md' (80px) | 'lg' (140px). Por defecto 'md'.
    - Es decorativa: aria-hidden="true". El nombre de la categoría ya aparece como TEXTO donde se usa.

  Qué dibuja cada categoría:
    analgesico = pastillas | antiinflamatorio = llama con flecha hacia abajo | antibiotico = cápsula bicolor
    antialergico = flor (polen) | gastrico = estómago | antidiabetico = glucómetro + gota
    cardiovascular = corazón con latido | respiratorio = pulmones | vitaminas = rodaja de naranja
    hidratacion = vaso con agua y gota
-->
<script setup>
import { computed } from 'vue' // paquete 'vue' (node_modules)

const props = defineProps({
  categoria: { type: String, default: '' },
  tamano: {
    type: String,
    default: 'md',
    validator: (valor) => ['sm', 'md', 'lg'].includes(valor),
  },
})

// Paleta de cada categoría: 4 tonos de un mismo color.
//   fondo  = tono pálido del cuadro de atrás
//   fuerte = color principal del dibujo
//   claro  = tono intermedio (detalles y reflejos)
//   oscuro = contornos y detalles (se ve bien sobre fondo y sobre el color fuerte)
const paletas = {
  analgesico: { fondo: '#e6f6ec', fuerte: '#109d48', claro: '#a8e0bd', oscuro: '#064e24' },
  antiinflamatorio: { fondo: '#fff1d6', fuerte: '#e8890c', claro: '#ffd58a', oscuro: '#6b3a00' },
  antibiotico: { fondo: '#e3effa', fuerte: '#1f78d1', claro: '#a9cff2', oscuro: '#0a3d73' },
  antialergico: { fondo: '#f3e8fa', fuerte: '#9b4dca', claro: '#d9b8ee', oscuro: '#4d1d6e' },
  gastrico: { fondo: '#fde8e6', fuerte: '#e0564b', claro: '#f6b3ad', oscuro: '#8a1c15' },
  antidiabetico: { fondo: '#e0f4f4', fuerte: '#12a3a3', claro: '#9fdcdc', oscuro: '#0b4d4d' },
  cardiovascular: { fondo: '#fde6ee', fuerte: '#d6336c', claro: '#f4a9c3', oscuro: '#8a1745' },
  respiratorio: { fondo: '#e8f0fb', fuerte: '#3b6fd4', claro: '#b3c9f0', oscuro: '#1b3b73' },
  vitaminas: { fondo: '#fff6cc', fuerte: '#f2b705', claro: '#fff0b0', oscuro: '#5c4a00' },
  hidratacion: { fondo: '#dff3fb', fuerte: '#1aa0d0', claro: '#a6dcf1', oscuro: '#05506b' },
  neutro: { fondo: '#eef1ef', fuerte: '#8a96a3', claro: '#cfd6dc', oscuro: '#334155' },
}

// Qué dibujo toca: el id si lo conocemos; si no, 'neutro' (cruz gris).
// Object.hasOwn evita confundir ids raros como "constructor" con una categoría.
const tipo = computed(() => (Object.hasOwn(paletas, props.categoria) ? props.categoria : 'neutro'))
const paleta = computed(() => paletas[tipo.value])

// Ángulos de los 6 pétalos de la flor (antialérgico).
const angulosPetalos = [0, 60, 120, 180, 240, 300]
</script>

<template>
  <!-- :style con variables CSS: los 4 colores cambian por categoría sin crear una clase por cada una.
       Las formas del <svg> los leen con var(--ic-...) a través de las clases de abajo. -->
  <span
    :class="['imagen-categoria', `imagen-categoria--${tamano}`]"
    :style="{
      '--ic-fondo': paleta.fondo,
      '--ic-fuerte': paleta.fuerte,
      '--ic-claro': paleta.claro,
      '--ic-oscuro': paleta.oscuro,
    }"
    aria-hidden="true"
  >
    <!-- viewBox="0 0 64 64": lienzo de 64x64 "unidades"; el SVG se escala solo al tamaño del cuadro. -->
    <svg viewBox="0 0 64 64" focusable="false">
      <!-- ANALGÉSICO: una pastilla redonda con ranura y otra pequeña con cruz -->
      <g v-if="tipo === 'analgesico'">
        <circle cx="26" cy="38" r="17" class="rel-fuerte trazo" />
        <path d="M9 38h34" class="sin-relleno trazo" />
        <path d="M16 29a12 12 0 0 1 8-6" class="sin-relleno trazo trazo-blanco suave" />
        <circle cx="47" cy="20" r="9" class="rel-claro trazo" />
        <path d="M47 16v8M43 20h8" class="sin-relleno trazo" />
      </g>

      <!-- ANTIINFLAMATORIO: llama (inflamación) con una flecha que baja (la reduce) -->
      <g v-else-if="tipo === 'antiinflamatorio'">
        <g transform="translate(-4 -2)">
          <path
            d="M32 8C34 18 46 22 46 38a14 14 0 0 1-28 0c0-7 4-11 7-15 1 5 3 7 5 7 0-8-2-16 2-22z"
            class="rel-fuerte trazo"
          />
          <path d="M32 29c2 5 8 7 8 12a8 8 0 0 1-16 0c0-4 3-6 5-9 1 2 2 3 3 3 0-3-1-4 0-6z" class="rel-claro" />
        </g>
        <circle cx="47" cy="46" r="12" class="rel-oscuro trazo-fondo" />
        <path d="M47 40v11M42 47l5 5 5-5" class="sin-relleno trazo trazo-blanco fino" />
      </g>

      <!-- ANTIBIÓTICO: cápsula bicolor en diagonal -->
      <g v-else-if="tipo === 'antibiotico'">
        <g transform="rotate(-45 32 32)">
          <path d="M22 21h10v22H22a11 11 0 0 1 0-22z" class="rel-fuerte" />
          <path d="M32 21h10a11 11 0 0 1 0 22H32z" class="rel-blanco" />
          <rect x="11" y="21" width="42" height="22" rx="11" class="sin-relleno trazo" />
          <path d="M32 21v22" class="sin-relleno trazo" />
          <path d="M18 27h8" class="sin-relleno trazo trazo-blanco suave" />
        </g>
        <circle cx="12" cy="14" r="2.5" class="rel-claro" />
        <circle cx="53" cy="52" r="2" class="rel-claro" />
        <circle cx="52" cy="10" r="1.5" class="rel-fuerte" />
      </g>

      <!-- ANTIALÉRGICO: flor (polen) con 6 pétalos; la bolita amarilla del centro es el polen -->
      <g v-else-if="tipo === 'antialergico'">
        <ellipse
          v-for="angulo in angulosPetalos"
          :key="angulo"
          cx="32"
          cy="20"
          rx="7.5"
          ry="11"
          :transform="`rotate(${angulo} 32 32)`"
          class="petalo"
        />
        <circle cx="32" cy="32" r="8" class="rel-polen trazo" />
        <circle cx="9" cy="11" r="2.5" class="rel-claro" />
        <circle cx="55" cy="10" r="2" class="rel-claro" />
        <circle cx="56" cy="53" r="2.5" class="rel-claro" />
        <circle cx="8" cy="54" r="2" class="rel-claro" />
      </g>

      <!-- GÁSTRICO: estómago con el esófago arriba y el intestino a la derecha -->
      <g v-else-if="tipo === 'gastrico'">
        <path d="M40 29c3-6 9-6 12-11" class="sin-relleno trazo trazo-claro grueso" />
        <rect x="24" y="5" width="8" height="15" rx="3" class="rel-claro trazo" />
        <path
          d="M24 14C24 24 14 26 13 38C12 50 22 56 33 55C46 54 53 46 51 36C50 30 44 28 40 28C34 28 32 24 32 18Z"
          class="rel-fuerte trazo"
        />
        <path d="M20 40c0 6 4 10 10 10" class="sin-relleno trazo trazo-blanco suave" />
      </g>

      <!-- ANTIDIABÉTICO: glucómetro (con tira reactiva) y una gota de sangre -->
      <g v-else-if="tipo === 'antidiabetico'">
        <rect x="17" y="9" width="9" height="15" rx="2" class="rel-blanco trazo" />
        <rect x="8" y="22" width="27" height="36" rx="6" class="rel-oscuro" />
        <rect x="12" y="27" width="19" height="12" rx="2.5" class="rel-claro" />
        <path d="M16.5 33h10" class="sin-relleno trazo" />
        <circle cx="21.5" cy="48" r="4" class="rel-claro" />
        <path d="M47 11C47 11 37.5 24 37.5 31a9.5 9.5 0 0 0 19 0C56.5 24 47 11 47 11z" class="rel-fuerte trazo" />
        <path d="M42.5 32a5 5 0 0 0 4 5" class="sin-relleno trazo trazo-blanco suave" />
      </g>

      <!-- CARDIOVASCULAR: corazón con la línea del latido (electrocardiograma) -->
      <g v-else-if="tipo === 'cardiovascular'">
        <path
          d="M32 55C10 41 6 27 14 19C21 12 29 15 32 22C35 15 43 12 50 19C58 27 54 41 32 55z"
          class="rel-fuerte trazo"
        />
        <path d="M13 34h9l4-9 6 19 5-10h14" class="sin-relleno trazo trazo-blanco fino" />
        <path d="M16 24c1-3 4-5 7-5" class="sin-relleno trazo trazo-blanco suave" />
      </g>

      <!-- RESPIRATORIO: pulmones con tráquea y bronquios -->
      <g v-else-if="tipo === 'respiratorio'">
        <path d="M26 22C14 24 8 40 9 50C10 56 17 56 22 53C27 50 28 44 28 38z" class="rel-fuerte trazo" />
        <path d="M38 22C50 24 56 40 55 50C54 56 47 56 42 53C37 50 36 44 36 38z" class="rel-fuerte trazo" />
        <path d="M32 28c0 4-6 5-10 10M32 28c0 4 6 5 10 10" class="sin-relleno trazo trazo-claro fino" />
        <path d="M32 8v21" class="sin-relleno trazo grueso" />
      </g>

      <!-- VITAMINAS Y SUPLEMENTOS: rodaja de naranja (vitamina C) con un destello -->
      <g v-else-if="tipo === 'vitaminas'">
        <circle cx="32" cy="32" r="23" class="rel-fuerte trazo" />
        <circle cx="32" cy="32" r="18" class="rel-claro" />
        <path d="M32 14v36M14 32h36M19.3 19.3l25.4 25.4M44.7 19.3L19.3 44.7" class="sin-relleno trazo trazo-fuerte" />
        <circle cx="32" cy="32" r="3.5" class="rel-fuerte" />
        <path d="M55 5v7M51.5 8.5h7" class="sin-relleno trazo" />
        <circle cx="8" cy="55" r="2.5" class="rel-claro" />
      </g>

      <!-- HIDRATACIÓN: vaso con agua y una gota -->
      <g v-else-if="tipo === 'hidratacion'">
        <path d="M16 11h32l-4 43a3 3 0 0 1-3 3H23a3 3 0 0 1-3-3z" class="rel-blanco" />
        <path d="M17.4 26h29.2L44 54a3 3 0 0 1-3 3H23a3 3 0 0 1-3-3z" class="rel-fuerte" />
        <path d="M17.8 26q3.3-3.5 6.6 0t6.6 0 6.6 0 6.6 0" class="sin-relleno trazo trazo-claro fino" />
        <path d="M32 33c0 0-6 6.5-6 10.5a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5z" class="rel-blanco" />
        <path d="M16 11h32l-4 43a3 3 0 0 1-3 3H23a3 3 0 0 1-3-3z" class="sin-relleno trazo" />
        <circle cx="8" cy="20" r="2.5" class="rel-claro" />
        <circle cx="57" cy="12" r="2" class="rel-claro" />
      </g>

      <!-- RESPALDO (categoría desconocida o vacía): cruz médica gris -->
      <g v-else>
        <path d="M25 10h14v15h15v14H39v15H25V39H10V25h15z" class="rel-fuerte trazo" />
      </g>
    </svg>
  </span>
</template>

<style scoped>
/* Cuadro de fondo: cambia de tamaño con las clases --sm / --md / --lg (el contrato de la prop `tamano`).
   El "padding" deja aire para que el dibujo no toque los bordes. */
.imagen-categoria {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  background: var(--ic-fondo);
  border-radius: var(--fa-radio);
  /* Línea finísima que define el borde del cuadro sobre fondos blancos */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  user-select: none;
}
.imagen-categoria--sm {
  width: 48px;
  height: 48px;
  padding: 5px;
}
.imagen-categoria--md {
  width: 80px;
  height: 80px;
  padding: 9px;
}
.imagen-categoria--lg {
  width: 140px;
  height: 140px;
  padding: 18px;
  border-radius: calc(var(--fa-radio) * 1.5);
}
.imagen-categoria svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---- Clases de las formas del dibujo ----
   "rel-*" = relleno (fill) con un tono de la paleta; "trazo" = contorno (stroke).
   Se combinan: class="rel-fuerte trazo" = forma rellena de color fuerte con contorno oscuro. */
.rel-fuerte {
  fill: var(--ic-fuerte);
}
.rel-claro {
  fill: var(--ic-claro);
}
.rel-oscuro {
  fill: var(--ic-oscuro);
}
.rel-blanco {
  fill: #ffffff;
}
.rel-polen {
  fill: #ffd23f; /* amarillo del polen (igual en todas las flores) */
}
.sin-relleno {
  fill: none;
}
.trazo {
  stroke: var(--ic-oscuro);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Variantes de trazo: van DESPUÉS de .trazo para poder sobrescribirlo */
.trazo-blanco {
  stroke: #ffffff;
}
.trazo-claro {
  stroke: var(--ic-claro);
}
.trazo-fuerte {
  stroke: var(--ic-fuerte);
}
.trazo-fondo {
  stroke: var(--ic-fondo);
  stroke-width: 3;
}
.fino {
  stroke-width: 3.5;
}
.grueso {
  stroke-width: 6;
}
.suave {
  opacity: 0.7;
}
.petalo {
  fill: var(--ic-fuerte);
  stroke: var(--ic-fondo);
  stroke-width: 2;
}
</style>
