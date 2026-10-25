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
    <!-- La etiqueta sigue existiendo (los lectores de pantalla la leen y el clic la enlaza
         con el input por for/id), pero se oculta a la vista: el buscador "píldora" usa
         el placeholder como pista visual. El texto visible del placeholder empieza igual
         que la etiqueta ("Buscar medicamento") para cumplir WCAG 2.5.3. -->
    <label class="barra__label fa-visualmente-oculto" for="fa-busqueda">Buscar medicamento</label>
    <div class="barra__campo">
      <input
        id="fa-busqueda"
        v-model="termino"
        class="barra__input"
        type="search"
        placeholder="Buscar medicamento…"
        autocomplete="off"
        maxlength="50"
        :aria-describedby="faltanCaracteres ? 'fa-busqueda-pista' : undefined"
      />
      <!-- Botón con icono de lupa. El SVG es decorativo (aria-hidden) y el nombre accesible
           del botón sigue siendo "Buscar" gracias al texto visualmente oculto. -->
      <button class="barra__boton" type="submit" :disabled="sinTexto">
        <svg class="barra__lupa" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span class="fa-visualmente-oculto">Buscar</span>
      </button>
    </div>
    <!-- role="status": el lector de pantalla anuncia la pista cuando aparece. -->
    <p v-if="faltanCaracteres" id="fa-busqueda-pista" class="barra__pista" role="status">
      Escribe al menos {{ minCaracteres }} letras
    </p>
  </form>
</template>

<style scoped>
/* position: relative -> la pista (absolute) se coloca respecto a esta barra. */
.barra {
  position: relative;
}

/* Buscador "píldora": un contenedor con borde y esquinas totalmente redondeadas
   (border-radius enorme = extremos semicirculares). El <input> va dentro SIN borde. */
.barra__campo {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 2px 2px 2px var(--fa-espacio-3);
  background: var(--fa-fondo-superficie);
  /* Borde gris medio (3.7:1 sobre blanco): se reconoce como campo (WCAG 1.4.11) */
  border: 1px solid var(--fa-borde-control);
  border-radius: var(--fa-radio-pildora);
}

.barra__input {
  flex: 1;
  min-width: 0; /* permite que el input se encoja en pantallas de 320px */
  align-self: stretch;
  padding: 0;
  /* 16px como mínimo: con menos, iOS hace zoom automático al escribir */
  font: inherit;
  font-size: var(--fa-texto-base);
  color: var(--fa-color-texto);
  background: transparent;
  border: 0;
}
/* Algunos navegadores ponen el placeholder muy claro; aquí lo fijamos a un gris con buen contraste */
.barra__input::placeholder {
  color: var(--fa-color-texto-suave);
  opacity: 1;
}

/* La "x" para borrar que Chrome/Edge/Safari añaden solo a los <input type="search"> es azul y
   no combina con la marca. La repintamos: quitamos su aspecto nativo (appearance: none) y le
   ponemos de "máscara" un icono x en SVG; el color lo da background-color, así usamos el
   verde de marca (#0b7a38, 5.4:1 sobre blanco). Sigue siendo la función nativa del navegador:
   no hace falta JavaScript. Firefox no la dibuja, así que no hay nada que cambiar allí. */
.barra__input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  margin: 0 var(--fa-espacio-1) 0 var(--fa-espacio-2);
  background-color: var(--fa-color-primario);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 6l12 12M18 6L6 18' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E") center / 14px 14px no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 6l12 12M18 6L6 18' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E") center / 14px 14px no-repeat;
  border-radius: 50%;
  cursor: pointer;
}
.barra__input::-webkit-search-cancel-button:hover {
  background-color: var(--fa-color-primario-hover);
}

/* Foco: el aro azul se dibuja alrededor de TODA la píldora, no del input interior.
   :has() = "el contenedor que tiene dentro un input con foco". Solo se quita el aro
   propio del input en navegadores que entienden :has() (@supports): así nunca nos
   quedamos sin indicador de foco. */
@supports selector(:has(*)) {
  .barra__input:focus-visible {
    outline: none;
  }
  .barra__campo:has(.barra__input:focus-visible) {
    border-color: var(--fa-color-primario);
    outline: 3px solid var(--fa-color-foco);
    outline-offset: 2px;
  }
}

/* Botón de lupa: 44x44 (área táctil mínima), sin relleno, icono verde */
.barra__boton {
  position: relative; /* referencia del texto "Buscar" oculto */
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--fa-tactil-min);
  height: var(--fa-tactil-min);
  padding: 0;
  color: var(--fa-color-primario); /* 5.4:1 sobre blanco */
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.barra__lupa {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.25;
  stroke-linecap: round;
}
.barra__boton:hover:not(:disabled) {
  background: var(--fa-color-marca-suave);
  color: var(--fa-color-primario-hover);
}
/* Deshabilitado (campo vacío): lupa en gris y cursor de "no permitido" */
.barra__boton:disabled {
  color: var(--fa-borde-control);
  cursor: not-allowed;
}

/* Pista "Escribe al menos N letras": globo flotante bajo la píldora (position:absolute),
   así NO empuja el contenido ni cambia la altura de la cabecera al aparecer/desaparecer.
   Tiene su propio fondo blanco: el contraste es el mismo sobre cualquier cosa que tape. */
.barra__pista {
  position: absolute;
  top: calc(100% + var(--fa-espacio-1));
  left: var(--fa-espacio-3);
  z-index: 5;
  margin: 0;
  max-width: calc(100% - var(--fa-espacio-3));
  padding: var(--fa-espacio-1) var(--fa-espacio-3);
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde-control);
  border-radius: var(--fa-radio-pildora);
  box-shadow: var(--fa-sombra-tarjeta-hover);
}
</style>
