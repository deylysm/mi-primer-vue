<script setup>
// Lista de medicamentos: tabla en escritorio y tarjetas en móvil (lo decide admin.css).
// Quién lo usa: src/views/AdminView.vue. Emite 'editar' y 'borrar' con el medicamento de esa fila;
// AdminView decide qué hacer (abrir el formulario o el diálogo de confirmación).
// Imports:
//   - 'vue': paquete instalado en node_modules (aquí, `computed`).
//   - '@/composables/useCategorias.js': archivo local (alias @ -> src/). Da el nombre de cada categoría.
import { computed } from 'vue'
import { useCategorias } from '@/composables/useCategorias.js'

const props = defineProps({
  medicamentos: { type: Array, required: true },
  // id del medicamento que se está borrando ahora mismo (para marcar su fila como ocupada)
  borrandoId: { type: Number, default: null },
})
const emit = defineEmits(['editar', 'borrar'])

const { nombreCategoria } = useCategorias()

// Orden por nombre ascendente (sin tocar la lista original de la prop)
const ordenados = computed(() =>
  [...props.medicamentos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
)
</script>

<template>
  <div class="adm-tabla-caja">
    <!-- Los role= explícitos mantienen la semántica de tabla aunque el CSS cambie el display en móvil -->
    <table class="adm-tabla" role="table" aria-label="Lista de medicamentos">
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">Medicamento</th>
          <th role="columnheader" scope="col">Categoría</th>
          <th role="columnheader" scope="col">Venta</th>
          <th role="columnheader" scope="col">Farmacias</th>
          <th role="columnheader" scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        <tr
          v-for="m in ordenados"
          :key="m.id"
          role="row"
          :aria-busy="borrandoId === m.id ? 'true' : undefined"
        >
          <td role="cell" class="adm-tabla__principal">
            <span class="adm-tabla__nombre">{{ m.nombre }}</span>
            <span class="adm-tabla__secundario">{{ m.marca }} · {{ m.principioActivo }} · {{ m.presentacion }}</span>
          </td>
          <td role="cell" data-label="Categoría">{{ nombreCategoria(m.categoria) }}</td>
          <td role="cell" data-label="Venta">
            <span v-if="m.requiereReceta" class="adm-etiqueta adm-etiqueta--receta">Con receta</span>
            <span v-else class="adm-etiqueta adm-etiqueta--directa">Venta libre</span>
          </td>
          <td role="cell" data-label="Farmacias">{{ m.inventario.length }}</td>
          <td role="cell" class="adm-tabla__acciones">
            <button
              type="button"
              class="fa-boton fa-boton--secundario adm-boton--compacto"
              :data-editar-id="m.id"
              :aria-label="`Editar ${m.nombre}`"
              @click="emit('editar', m)"
            >
              Editar
            </button>
            <button
              type="button"
              class="fa-boton adm-boton--peligro adm-boton--compacto"
              :aria-label="`Borrar ${m.nombre}`"
              :disabled="borrandoId === m.id"
              @click="emit('borrar', m, $event.currentTarget)"
            >
              Borrar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
