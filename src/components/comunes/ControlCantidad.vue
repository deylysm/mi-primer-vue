<!--
  ControlCantidad.vue  (src/components/comunes/)
  Qué es: selector de cantidad con botones "−" y "+" y un campo numérico en medio.
  Quién lo usa: DetalleMedicamentoView.vue (cantidad a agregar) y CarritoView.vue (cambiar cantidad).

  Cómo se usa:  <ControlCantidad v-model="cantidad" :max="stock" etiqueta="Cantidad de Ibuprofeno" />
    - v-model: número actual. Dentro del componente se declara con `defineModel`.
    - max / min: límites (el valor siempre queda entre min y max).
    - etiqueta: texto para lectores de pantalla (aria-label del grupo, del campo y de los botones).
-->
<script setup>
import { computed } from 'vue' // paquete 'vue' (node_modules)

// defineModel() crea un v-model: `cantidad` se lee y se escribe como una ref normal, y al
// escribirla Vue avisa al padre (evento update:modelValue) sin que tengamos que declarar el emit.
const cantidad = defineModel({ type: Number, default: 1 })

const props = defineProps({
  min: { type: Number, default: 1 },
  max: { type: Number, default: 99 },
  etiqueta: { type: String, default: 'Cantidad' },
  id: { type: String, default: undefined }, // id del <input>, por si hay un <label for> externo
})

// Mantiene el valor dentro de [min, max]. Si max < min (p. ej. sin stock), manda min.
function ajustar(valor) {
  const n = Math.floor(Number(valor))
  if (!Number.isFinite(n)) return props.min
  return Math.min(Math.max(n, props.min), Math.max(props.max, props.min))
}

const puedeBajar = computed(() => cantidad.value > props.min)
const puedeSubir = computed(() => cantidad.value < props.max)

const bajar = () => {
  if (puedeBajar.value) cantidad.value = ajustar(cantidad.value - 1)
}
const subir = () => {
  if (puedeSubir.value) cantidad.value = ajustar(cantidad.value + 1)
}

// Mientras se escribe, un campo vacío se ignora (el usuario puede estar borrando para teclear otro número).
function alEscribir(evento) {
  const texto = evento.target.value
  if (texto === '') return
  cantidad.value = ajustar(texto)
}
// Al salir del campo, se reescribe el valor válido (si quedó vacío o fuera de rango).
function alTerminar(evento) {
  cantidad.value = ajustar(evento.target.value)
  evento.target.value = String(cantidad.value)
}
</script>

<template>
  <div class="cantidad" role="group" :aria-label="etiqueta">
    <button
      class="cantidad__boton"
      type="button"
      :disabled="!puedeBajar"
      :aria-label="`Disminuir cantidad. ${etiqueta}`"
      @click="bajar"
    >
      <span aria-hidden="true">−</span>
    </button>
    <input
      :id="id"
      class="cantidad__campo"
      type="number"
      inputmode="numeric"
      :min="min"
      :max="max"
      :value="cantidad"
      :aria-label="etiqueta"
      @input="alEscribir"
      @change="alTerminar"
    />
    <button
      class="cantidad__boton"
      type="button"
      :disabled="!puedeSubir"
      :aria-label="`Aumentar cantidad. ${etiqueta}`"
      @click="subir"
    >
      <span aria-hidden="true">+</span>
    </button>
  </div>
</template>

<style scoped>
.cantidad {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--fa-borde-control);
  border-radius: var(--fa-radio-pildora);
  background: var(--fa-fondo-superficie);
  overflow: hidden;
}
.cantidad__boton {
  width: var(--fa-tactil-min);
  min-height: var(--fa-tactil-min);
  padding: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  color: var(--fa-color-primario-oscuro);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.cantidad__boton:hover:not(:disabled) {
  background: var(--fa-color-marca-suave);
}
.cantidad__boton:disabled {
  color: var(--fa-color-texto-suave);
  opacity: 0.45;
  cursor: not-allowed;
}
.cantidad__campo {
  width: 3.5rem;
  min-height: var(--fa-tactil-min);
  padding: 0;
  font-size: var(--fa-texto-base);
  font-weight: 600;
  text-align: center;
  color: var(--fa-color-texto);
  background: transparent;
  border: 0;
  border-inline: 1px solid var(--fa-borde);
  border-radius: 0;
  /* Quita las flechitas nativas: ya tenemos nuestros botones − y + */
  appearance: textfield;
  -moz-appearance: textfield;
}
.cantidad__campo::-webkit-outer-spin-button,
.cantidad__campo::-webkit-inner-spin-button {
  appearance: none;
  margin: 0;
}
/* El aro de foco del teclado se dibuja hacia dentro para que overflow:hidden no lo recorte */
.cantidad__boton:focus-visible,
.cantidad__campo:focus-visible {
  outline-offset: -3px;
}
</style>
