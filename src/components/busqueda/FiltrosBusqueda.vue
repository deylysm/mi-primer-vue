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
import { ref, nextTick } from 'vue' // paquete 'vue' (node_modules)
import { useCategorias } from '@/composables/useCategorias.js' // alias @ -> src/: categorías desde la API

const props = defineProps({
  filtros: { type: Object, required: true },
  farmacias: { type: Array, default: () => [] },
  marcas: { type: Array, default: () => [] }, // nombres de marca (los da el composable)
})

// Mismo nombre que en EstadoVacio.vue para que el padre use un solo manejador.
const emit = defineEmits(['limpiar-filtros'])

const { categorias } = useCategorias() // ref ([] mientras carga); en la plantilla se usa sin .value

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
      <h2 class="filtros__titulo">Filtrar por:</h2>

      <!-- Secciones desplegables nativas: <details> es el contenedor y <summary> su título
           clicable (funciona con teclado: Enter/Espacio). El atributo `open` las deja abiertas
           al cargar; después el usuario las abre/cierra y Vue no las toca.
           Los grupos de radios/checkboxes usan <fieldset> con <legend> oculta visualmente:
           el título visible es el <summary> y la legend da el nombre al grupo para lectores. -->

      <details class="filtros__seccion">
        <summary class="filtros__resumen">Categoría</summary>
        <fieldset class="filtros__contenido filtros__contenido--lista">
          <legend class="fa-visualmente-oculto">Categoría</legend>
          <label class="filtros__opcion">
            <input v-model="filtros.categoria" type="radio" name="fa-categoria" value="" />
            Todas
          </label>
          <label v-for="c in categorias" :key="c.id" class="filtros__opcion">
            <input v-model="filtros.categoria" type="radio" name="fa-categoria" :value="c.id" />
            {{ c.nombre }}
          </label>
        </fieldset>
      </details>

      <details class="filtros__seccion">
        <summary class="filtros__resumen">Marca</summary>
        <fieldset class="filtros__contenido filtros__contenido--lista">
          <legend class="fa-visualmente-oculto">Marca</legend>
          <label class="filtros__opcion">
            <!-- :value="null" = "todas las marcas" (así lo espera el composable) -->
            <input v-model="filtros.marca" type="radio" name="fa-marca" :value="null" />
            Todas
          </label>
          <label v-for="m in marcas" :key="m" class="filtros__opcion">
            <input v-model="filtros.marca" type="radio" name="fa-marca" :value="m" />
            {{ m }}
          </label>
        </fieldset>
      </details>

      <details class="filtros__seccion" open>
        <summary class="filtros__resumen">Precio</summary>
        <div class="filtros__contenido">
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
        </div>
      </details>

      <details class="filtros__seccion" open>
        <summary class="filtros__resumen">Farmacia</summary>
        <fieldset class="filtros__contenido filtros__contenido--lista">
          <legend class="fa-visualmente-oculto">Farmacias</legend>
          <p v-if="farmacias.length === 0" class="filtros__aviso">
            No se pudieron cargar las farmacias
          </p>
          <label v-for="f in farmacias" :key="f.id" class="filtros__opcion">
            <input v-model="filtros.farmaciaIds" type="checkbox" :value="f.id" />
            {{ f.nombre }}
          </label>
          <label class="filtros__opcion">
            <input v-model="filtros.soloConStock" type="checkbox" />
            Solo con stock
          </label>
        </fieldset>
      </details>

      <details class="filtros__seccion">
        <summary class="filtros__resumen">Receta</summary>
        <fieldset class="filtros__contenido filtros__contenido--lista">
          <legend class="fa-visualmente-oculto">Receta</legend>
          <label class="filtros__opcion">
            <input v-model="filtros.receta" type="radio" name="fa-receta" value="" />
            Todos
          </label>
          <label class="filtros__opcion">
            <input v-model="filtros.receta" type="radio" name="fa-receta" value="sin-receta" />
            Venta directa (sin receta)
          </label>
          <label class="filtros__opcion">
            <input v-model="filtros.receta" type="radio" name="fa-receta" value="con-receta" />
            Requiere receta
          </label>
        </fieldset>
      </details>

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
  gap: 12px; /* separación entre filas de filtro */
  margin-top: var(--fa-espacio-2);
  padding: var(--fa-espacio-3);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
  box-shadow: var(--fa-sombra-tarjeta);
}
/* Título "Filtrar por:" grande y en negrita (sin subrayado). Oculto en móvil: allí lo da el botón. */
.filtros__titulo {
  display: none;
  margin: 0 0 var(--fa-espacio-1);
  font-size: 1.75rem; /* 28px */
  color: var(--fa-color-texto);
}
/* Sección desplegable (<details>): cada filtro es un bloque independiente */
.filtros__seccion {
  min-width: 0;
}
/* Título clicable (<summary>) = FILA GRIS con texto verde y un "+" a la derecha.
   Texto #0b7a38 sobre #eef0f0 = 4,8:1 (AA). Se quita el triángulo por defecto del navegador.
   min-height 48px = zona táctil cómoda. */
.filtros__resumen {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fa-espacio-2);
  min-height: 48px;
  padding: 0 var(--fa-espacio-3);
  font-family: var(--fa-fuente-titulos);
  font-weight: 600;
  color: var(--fa-color-primario);
  background: var(--fa-fondo-fila);
  border: 1px solid var(--fa-borde);
  border-radius: 6px;
  cursor: pointer;
  list-style: none;
}
.filtros__resumen:hover {
  background: var(--fa-color-marca-suave);
}
.filtros__resumen::-webkit-details-marker {
  display: none; /* Safari/Chrome antiguos */
}
/* El signo "+" se dibuja SIN texto ni imágenes: dos rayas (degradados de un solo color) en cruz.
   "center / 100% 3px" = centrada, ancho completo y 3px de alto (raya horizontal);
   "center / 3px 100%" = raya vertical. Todo con currentColor (el verde del texto). */
.filtros__resumen::after {
  content: '';
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  background:
    linear-gradient(currentColor, currentColor) center / 100% 3px no-repeat,
    linear-gradient(currentColor, currentColor) center / 3px 100% no-repeat;
}
/* Abierto: se quita la raya vertical y el "+" se convierte en un "−" */
.filtros__seccion[open] > .filtros__resumen::after {
  background: linear-gradient(currentColor, currentColor) center / 100% 3px no-repeat;
}
/* Abierto: la fila gris y su contenido forman una sola caja (esquinas inferiores rectas) */
.filtros__seccion[open] > .filtros__resumen {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
/* Contenido de la sección: caja blanca con borde, pegada a la fila gris.
   Si es un <fieldset>, se quitan sus márgenes de fábrica. */
.filtros__contenido {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: 0;
  padding: var(--fa-espacio-2) var(--fa-espacio-3) var(--fa-espacio-3);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-top: 0;
  border-radius: 0 0 6px 6px;
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
.filtros__opcion input[type='checkbox'],
.filtros__opcion input[type='radio'] {
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

/* Tablet (640-1023px): las listas de opciones se reparten en 2 columnas para no ser tan altas. */
@media (min-width: 640px) and (max-width: 1023px) {
  .filtros__contenido--lista {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--fa-espacio-4);
  }
  .filtros__aviso {
    grid-column: 1 / -1;
  }
  .filtros__limpiar {
    align-self: flex-start;
  }
}

@media (min-width: 1024px) {
  .filtros__toggle {
    display: none;
  }
  /* En escritorio el panel va siempre visible, sin margen superior (no hay botón encima).
     Ya no es una tarjeta blanca: es transparente y cada filtro es su propia fila (como la maqueta). */
  .filtros__panel,
  .filtros:not(.filtros--abierto) .filtros__panel {
    display: flex;
    margin-top: 0;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
  .filtros__titulo {
    display: block;
  }
  .filtros__limpiar {
    width: 100%;
  }
}
</style>
