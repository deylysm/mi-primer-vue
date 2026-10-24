<script setup>
// Panel de filtros. Usado por la vista de búsqueda (Fase 4).
//
// DECISIÓN: mutamos `filtros` directamente (v-model sobre sus campos).
// Es el objeto reactive del composable, compartido entre padre e hijo, así que
// el composable ve los cambios sin necesitar emits por cada control. Es menos
// código y evita duplicar estado. (Normalmente en Vue se evita mutar props;
// aquí es seguro porque es un reactive compartido a propósito.)
//
// En móvil el panel se abre/cierra con el botón "Filtros"; en >=1024px
// siempre está visible y el botón se oculta (ver <style>).
import { ref, nextTick } from 'vue'

const props = defineProps({
  filtros: { type: Object, required: true },
  farmacias: { type: Array, default: () => [] },
})

// Mismo nombre que en EstadoVacio.vue para que el padre use un solo manejador.
const emit = defineEmits(['limpiar-filtros'])

const abierto = ref(false)
const botonToggle = ref(null) // referencia al <button> (template ref)

function alternar() {
  abierto.value = !abierto.value
}

// Esc cierra el panel y devuelve el foco al botón.
async function cerrarConEsc() {
  if (!abierto.value) return
  abierto.value = false
  await nextTick()
  botonToggle.value?.focus()
}

// v-model.number con campo vacío da '' -> lo convertimos a null.
function actualizarPrecioMax(evento) {
  const valor = evento.target.value
  props.filtros.precioMax = valor === '' ? null : Number(valor)
}
</script>

<template>
  <div :class="['filtros', { 'filtros--abierto': abierto }]" @keydown.esc="cerrarConEsc">
    <button
      ref="botonToggle"
      class="filtros__toggle"
      type="button"
      aria-controls="fa-panel-filtros"
      :aria-expanded="abierto"
      @click="alternar"
    >
      <!-- Icono de embudo (decorativo). El nombre accesible del botón sigue siendo "Filtros". -->
      <svg class="filtros__icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
      </svg>
      <span class="filtros__toggle-texto">Filtros</span>
    </button>

    <div id="fa-panel-filtros" class="filtros__panel">
      <!-- Título del panel lateral: solo se ve en escritorio (en móvil ya lo da el botón). -->
      <h2 class="filtros__titulo">Filtros</h2>

      <fieldset class="filtros__grupo">
        <legend class="filtros__legend">Farmacias</legend>
        <p v-if="farmacias.length === 0" class="filtros__aviso">
          No se pudieron cargar las farmacias
        </p>
        <label v-for="f in farmacias" :key="f.id" class="filtros__opcion">
          <input v-model="filtros.farmaciaIds" type="checkbox" :value="f.id" />
          {{ f.nombre }}
        </label>
      </fieldset>

      <label class="filtros__opcion">
        <input v-model="filtros.soloConStock" type="checkbox" />
        Solo con stock
      </label>

      <div class="filtros__campo">
        <label for="fa-precio-max">Precio máximo (S/)</label>
        <input
          id="fa-precio-max"
          class="filtros__input"
          type="number"
          min="0"
          step="0.01"
          :value="filtros.precioMax ?? ''"
          @input="actualizarPrecioMax"
        />
      </div>

      <div class="filtros__campo">
        <label for="fa-orden">Ordenar por</label>
        <select id="fa-orden" v-model="filtros.orden" class="filtros__select">
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="nombre">Nombre (A-Z)</option>
        </select>
      </div>

      <button class="filtros__limpiar" type="button" @click="emit('limpiar-filtros')">
        Limpiar filtros
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ---- Botón "Filtros" (solo móvil/tablet): tarjeta blanca con embudo y flecha ---- */
.filtros__toggle {
  width: 100%;
  min-height: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-3);
  font: inherit;
  font-weight: 600;
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde-control);
  border-radius: var(--fa-radio);
  box-shadow: var(--fa-sombra-tarjeta);
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: var(--fa-espacio-2);
}
.filtros__toggle:hover {
  border-color: var(--fa-color-primario);
  background: var(--fa-color-marca-suave);
}
.filtros__icono {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  fill: none;
  stroke: var(--fa-color-primario);
  stroke-width: 2;
  stroke-linejoin: round;
}
.filtros__toggle-texto {
  flex: 1;
}
/* Flecha dibujada con bordes (sin depender de ningún carácter/fuente): un cuadrado de 8px
   con solo 2 bordes, girado 45deg = "v". Se gira al abrir según aria-expanded. */
.filtros__toggle::after {
  content: '';
  width: 8px;
  height: 8px;
  margin-right: var(--fa-espacio-1);
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
  transition: transform 0.2s;
}
.filtros__toggle[aria-expanded='true']::after {
  transform: translateY(2px) rotate(225deg);
}

/* ---- Panel ---- */
.filtros__panel {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-3);
  margin-top: var(--fa-espacio-2);
  padding: var(--fa-espacio-3);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
  box-shadow: var(--fa-sombra-tarjeta);
}
/* Título "Filtros" con subrayado verde (como las secciones de una tienda). Oculto en móvil. */
.filtros__titulo {
  display: none;
  margin: 0;
  padding-bottom: var(--fa-espacio-2);
  font-size: var(--fa-texto-lg);
  color: var(--fa-color-primario-oscuro);
  border-bottom: 3px solid var(--fa-color-marca);
}
.filtros__grupo {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
.filtros__legend {
  padding: 0;
  margin-bottom: var(--fa-espacio-1);
  font-family: var(--fa-fuente-titulos);
  font-weight: 600;
  color: var(--fa-color-primario-oscuro);
}
/* Cada opción es una etiqueta de al menos 44px: toda la fila es clicable */
.filtros__opcion {
  display: flex;
  align-items: center;
  gap: var(--fa-espacio-2);
  min-height: var(--fa-tactil-min);
  cursor: pointer;
}
/* accent-color: pinta el checkbox nativo con el verde de la marca (5.4:1) */
.filtros__opcion input[type='checkbox'] {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin: 0;
  accent-color: var(--fa-color-primario);
  cursor: pointer;
}
.filtros__campo {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-1);
}
.filtros__campo label {
  font-family: var(--fa-fuente-titulos);
  font-weight: 600;
  color: var(--fa-color-primario-oscuro);
}
.filtros__input,
.filtros__select {
  width: 100%;
  min-height: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-3);
  font: inherit;
  color: var(--fa-color-texto);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde-control);
  border-radius: var(--fa-radio-sm);
}
.filtros__input:focus,
.filtros__select:focus {
  border-color: var(--fa-color-primario);
}
.filtros__aviso {
  margin: 0;
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-aviso);
  background: var(--fa-fondo-aviso);
  padding: var(--fa-espacio-2);
  border-radius: var(--fa-radio-sm);
}
/* Acción secundaria: botón de píldora con contorno y texto verde (5.4:1) */
.filtros__limpiar {
  min-height: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-4);
  font: inherit;
  font-weight: 600;
  color: var(--fa-color-acento);
  background: var(--fa-fondo-superficie);
  border: 2px solid var(--fa-color-acento);
  border-radius: var(--fa-radio-pildora);
  cursor: pointer;
}
.filtros__limpiar:hover {
  background: var(--fa-color-marca-suave);
}

/* Móvil: panel oculto hasta abrirlo. En >=1024px se muestra siempre. */
.filtros:not(.filtros--abierto) .filtros__panel {
  display: none;
}

/* Tablet (640-1023px): el panel abierto se reparte en 2 columnas para no ser tan alto.
   El grupo de farmacias y el botón "Limpiar" ocupan todo el ancho (grid-column: 1 / -1). */
@media (min-width: 640px) and (max-width: 1023px) {
  .filtros__panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--fa-espacio-3) var(--fa-espacio-4);
  }
  .filtros__grupo,
  .filtros__limpiar {
    grid-column: 1 / -1;
  }
  .filtros__limpiar {
    justify-self: start;
  }
  /* Las farmacias en dos columnas también */
  .filtros__grupo {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--fa-espacio-4);
  }
  .filtros__legend,
  .filtros__aviso {
    grid-column: 1 / -1;
  }
  /* El panel cerrado sigue oculto (esta regla es más específica que la de arriba) */
  .filtros:not(.filtros--abierto) .filtros__panel {
    display: none;
  }
}

@media (min-width: 1024px) {
  .filtros__toggle {
    display: none;
  }
  /* En escritorio el panel va siempre visible, sin margen superior (no hay botón encima) */
  .filtros__panel,
  .filtros:not(.filtros--abierto) .filtros__panel {
    display: flex;
    margin-top: 0;
  }
  .filtros__titulo {
    display: block;
  }
  .filtros__limpiar {
    width: 100%;
  }
}
</style>
