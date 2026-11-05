<script setup>
// Lista de farmacias: tabla en escritorio y tarjetas en móvil (lo decide admin.css).
// Quién lo usa: src/views/AdminView.vue. Emite 'editar' y 'borrar' con la farmacia de esa fila.
// 'vue' es un paquete instalado en node_modules (aquí, `computed`).
import { computed } from 'vue'

const props = defineProps({
  farmacias: { type: Array, required: true },
  borrandoId: { type: Number, default: null },
})
const emit = defineEmits(['editar', 'borrar'])

const ordenadas = computed(() =>
  [...props.farmacias].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
)
</script>

<template>
  <div class="adm-tabla-caja">
    <table class="adm-tabla" role="table" aria-label="Lista de farmacias">
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">Farmacia</th>
          <th role="columnheader" scope="col">Ciudad</th>
          <th role="columnheader" scope="col">Teléfono</th>
          <th role="columnheader" scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        <tr
          v-for="f in ordenadas"
          :key="f.id"
          role="row"
          :aria-busy="borrandoId === f.id ? 'true' : undefined"
        >
          <td role="cell" class="adm-tabla__principal">
            <span class="adm-tabla__nombre">{{ f.nombre }}</span>
            <span class="adm-tabla__secundario">{{ f.direccion }}</span>
          </td>
          <td role="cell" data-label="Ciudad">{{ f.ciudad }}</td>
          <td role="cell" data-label="Teléfono">{{ f.telefono || 'No indicado' }}</td>
          <td role="cell" class="adm-tabla__acciones">
            <button
              type="button"
              class="fa-boton fa-boton--secundario adm-boton--compacto"
              :data-editar-id="f.id"
              :aria-label="`Editar ${f.nombre}`"
              @click="emit('editar', f)"
            >
              Editar
            </button>
            <button
              type="button"
              class="fa-boton adm-boton--peligro adm-boton--compacto"
              :aria-label="`Borrar ${f.nombre}`"
              :disabled="borrandoId === f.id"
              @click="emit('borrar', f, $event.currentTarget)"
            >
              Borrar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
