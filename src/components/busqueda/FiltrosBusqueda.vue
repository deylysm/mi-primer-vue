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
      Filtros
    </button>

    <div id="fa-panel-filtros" class="filtros__panel">
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
.filtros__toggle {
  width: 100%;
  min-height: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-3);
  font: inherit;
  font-weight: 600;
  color: var(--fa-color-texto);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde-control);
  border-radius: var(--fa-radio);
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
/* Flecha que indica abierto/cerrado; se gira según aria-expanded. */
.filtros__toggle::after {
  content: '▾';
  content: '▾' / ''; /* texto alternativo vacío: el lector no lee la flecha */
  transition: transform 0.2s;
}
.filtros__toggle[aria-expanded='true']::after {
  transform: rotate(180deg);
}
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
  font-weight: 700;
}
/* Cada opción es una etiqueta de al menos 44px: toda la fila es clicable */
.filtros__opcion {
  display: flex;
  align-items: center;
  gap: var(--fa-espacio-2);
  min-height: var(--fa-tactil-min);
  cursor: pointer;
}
.filtros__opcion input[type='checkbox'] {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin: 0;
  accent-color: var(--fa-color-primario);
}
.filtros__campo {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-1);
}
.filtros__campo label {
  font-weight: 600;
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
  border-radius: var(--fa-radio);
}
.filtros__aviso {
  margin: 0;
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-aviso);
  background: var(--fa-fondo-aviso);
  padding: var(--fa-espacio-2);
  border-radius: var(--fa-radio);
}
/* Acción secundaria: contorno y texto en azul acento */
.filtros__limpiar {
  min-height: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-3);
  font: inherit;
  font-weight: 600;
  color: var(--fa-color-acento);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-color-acento);
  border-radius: var(--fa-radio);
  cursor: pointer;
}
.filtros__limpiar:hover {
  background: var(--fa-fondo-pagina);
}
/* Móvil: panel oculto hasta abrirlo. En >=1024px se muestra siempre. */
.filtros:not(.filtros--abierto) .filtros__panel {
  display: none;
}
@media (min-width: 1024px) {
  .filtros__toggle {
    display: none;
  }
  .filtros:not(.filtros--abierto) .filtros__panel {
    display: flex;
  }
}
</style>
