<script setup>
// Una fila de "Disponibilidad por farmacia": farmacia, precio, precio anterior (oferta) y stock.
// Quién lo usa: FormMedicamento.vue (una por cada farmacia del medicamento).
// El objeto `fila` pertenece al formulario padre y se edita directamente con v-model (es un
// objeto reactivo compartido a propósito, para no copiar datos en cada tecla).
// Emits:
//   - 'quitar': el usuario pulsó "Quitar".
//   - 'limpiar' (campo): el usuario tocó un campo; el padre borra el error de ese campo.
// Imports:
//   - './CampoFormulario.vue': archivo local, ruta relativa (misma carpeta components/admin/).
import { computed } from 'vue'
import CampoFormulario from './CampoFormulario.vue'

const props = defineProps({
  fila: { type: Object, required: true }, // { clave, farmaciaId, precio, precioAnterior, stock }
  indice: { type: Number, required: true }, // posición en la lista (0, 1, 2...)
  farmacias: { type: Array, required: true }, // [{ id, nombre, ... }] para el select
  errores: { type: Object, default: () => ({}) }, // { farmaciaId, precio, precioAnterior, stock }
})
const emit = defineEmits(['quitar', 'limpiar'])

// Prefijo único por fila para los ids: inv-0-precio, inv-1-precio...
const prefijo = computed(() => `inv-${props.indice}`)

const nombreFarmacia = computed(
  () => props.farmacias.find((f) => f.id === props.fila.farmaciaId)?.nombre ?? '',
)
const etiquetaQuitar = computed(() =>
  nombreFarmacia.value ? `Quitar ${nombreFarmacia.value}` : `Quitar farmacia ${props.indice + 1}`,
)
</script>

<template>
  <li class="adm-fila-inventario">
    <p class="adm-fila-inventario__titulo">Farmacia {{ indice + 1 }}</p>
    <div class="adm-fila-inventario__campos">
      <CampoFormulario
        :id="`${prefijo}-farmacia`"
        etiqueta="Farmacia"
        requerido
        clase="adm-campo--farmacia"
        :error="errores.farmaciaId"
      >
        <template #default="{ atributos }">
          <select
            v-bind="atributos"
            v-model="fila.farmaciaId"
            class="adm-campo__control"
            @change="emit('limpiar', 'farmaciaId')"
          >
            <option value="">Selecciona una farmacia</option>
            <option v-for="f in farmacias" :key="f.id" :value="f.id">{{ f.nombre }} ({{ f.ciudad }})</option>
          </select>
        </template>
      </CampoFormulario>

      <CampoFormulario :id="`${prefijo}-precio`" etiqueta="Precio (S/)" requerido :error="errores.precio">
        <template #default="{ atributos }">
          <div class="adm-campo__grupo">
            <span class="adm-campo__prefijo" aria-hidden="true">S/</span>
            <input
              v-bind="atributos"
              v-model="fila.precio"
              class="adm-campo__control"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              @input="emit('limpiar', 'precio')"
            />
          </div>
        </template>
      </CampoFormulario>

      <CampoFormulario
        :id="`${prefijo}-anterior`"
        etiqueta="Precio anterior"
        opcional
        :error="errores.precioAnterior"
      >
        <template #default="{ atributos }">
          <div class="adm-campo__grupo">
            <span class="adm-campo__prefijo" aria-hidden="true">S/</span>
            <input
              v-bind="atributos"
              v-model="fila.precioAnterior"
              class="adm-campo__control"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              @input="emit('limpiar', 'precioAnterior')"
            />
          </div>
        </template>
      </CampoFormulario>

      <CampoFormulario :id="`${prefijo}-stock`" etiqueta="Stock" requerido :error="errores.stock">
        <template #default="{ atributos }">
          <input
            v-bind="atributos"
            v-model="fila.stock"
            class="adm-campo__control"
            type="number"
            inputmode="numeric"
            min="0"
            step="1"
            @input="emit('limpiar', 'stock')"
          />
        </template>
      </CampoFormulario>

      <button
        type="button"
        class="fa-boton fa-boton--secundario adm-boton--peligro adm-boton--compacto adm-fila-inventario__quitar"
        :aria-label="etiquetaQuitar"
        @click="emit('quitar')"
      >
        Quitar
      </button>
    </div>
  </li>
</template>
