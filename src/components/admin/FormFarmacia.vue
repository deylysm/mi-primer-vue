<script setup>
// Formulario para CREAR o EDITAR una farmacia.
// Quién lo usa: src/views/AdminView.vue, que lo muestra en lugar de la lista de farmacias.
//
// Props:
//   - farmacia: la farmacia a editar, o null para crear una nueva.
//   - guardando: true mientras AdminView espera la respuesta de la API.
//   - errorEnvio: { general, campos } con lo que respondió el servidor si falló (o null).
// Emits:
//   - 'guardar' (datos): { nombre, direccion, ciudad, telefono } ya validados.
//   - 'cancelar': volver a la lista sin guardar.
//
// Imports:
//   - 'vue': paquete instalado en node_modules.
//   - './CampoFormulario.vue': archivo local, ruta relativa (misma carpeta components/admin/).
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import CampoFormulario from './CampoFormulario.vue'

const props = defineProps({
  farmacia: { type: Object, default: null },
  guardando: { type: Boolean, default: false },
  errorEnvio: { type: Object, default: null },
})
const emit = defineEmits(['guardar', 'cancelar'])

const esEdicion = computed(() => props.farmacia !== null)

const f = props.farmacia
const datos = reactive({
  nombre: f?.nombre ?? '',
  direccion: f?.direccion ?? '',
  ciudad: f?.ciudad ?? '',
  telefono: f?.telefono ?? '',
})

// Campos en el orden en que aparecen (sirve para el resumen de errores)
const CAMPOS = [
  { clave: 'nombre', id: 'far-nombre', etiqueta: 'Nombre' },
  { clave: 'direccion', id: 'far-direccion', etiqueta: 'Dirección' },
  { clave: 'ciudad', id: 'far-ciudad', etiqueta: 'Ciudad' },
  { clave: 'telefono', id: 'far-telefono', etiqueta: 'Teléfono' },
]

const errores = ref({})
const resumen = ref([])
const mostrarResumen = ref(false)
const generalLocal = ref('')
const textoGeneral = computed(() => generalLocal.value || props.errorEnvio?.general || '')

const texto = (valor) => String(valor ?? '').trim()

function validar() {
  const e = {}
  const obligatorio = (clave, vacio, maximo) => {
    const valor = texto(datos[clave])
    if (!valor) e[clave] = vacio
    else if (valor.length > maximo) e[clave] = `Máximo ${maximo} caracteres.`
  }
  obligatorio('nombre', 'Escribe el nombre de la farmacia.', 100)
  obligatorio('direccion', 'Escribe la dirección.', 200)
  obligatorio('ciudad', 'Escribe la ciudad.', 100)

  const telefono = texto(datos.telefono)
  if (telefono) {
    if (telefono.length > 30) e.telefono = 'Máximo 30 caracteres.'
    else if (!/^[0-9 +\-()]*$/.test(telefono)) e.telefono = 'Usa solo números, espacios, + y guiones.'
  }
  return e
}

function construirResumen() {
  resumen.value = CAMPOS.filter((c) => errores.value[c.clave]).map((c) => ({
    clave: c.clave,
    id: c.id,
    texto: `${c.etiqueta}: ${errores.value[c.clave]}`,
  }))
}

function limpiar(clave) {
  delete errores.value[clave]
}

function construirPayload() {
  return {
    nombre: texto(datos.nombre),
    direccion: texto(datos.direccion),
    ciudad: texto(datos.ciudad),
    telefono: texto(datos.telefono) || null, // opcional: vacío se envía como null
  }
}

// ---- Foco ----
const titulo = ref(null)
const cajaResumen = ref(null)
const cajaGeneral = ref(null)

onMounted(() => titulo.value?.focus()) // al abrir el formulario el foco va al título

async function enviar() {
  if (props.guardando) return
  generalLocal.value = ''
  errores.value = validar()
  if (Object.keys(errores.value).length > 0) {
    construirResumen()
    mostrarResumen.value = true
    await nextTick() // esperamos a que el resumen exista en la página antes de darle el foco
    cajaResumen.value?.focus()
    return
  }
  mostrarResumen.value = false
  emit('guardar', construirPayload())
}

function irAlCampo(id) {
  document.getElementById(id)?.focus()
}

// Cuando el servidor responde con un error, lo mostramos (lo escrito no se pierde)
watch(
  () => props.errorEnvio,
  async (envio) => {
    if (!envio) return
    errores.value = { ...errores.value, ...envio.campos }
    construirResumen()
    const hayCampos = resumen.value.length > 0
    if (Object.keys(envio.campos).length > 0 && !hayCampos) {
      generalLocal.value = 'Revisa los datos del formulario e inténtalo de nuevo.'
    }
    mostrarResumen.value = hayCampos
    await nextTick()
    if (envio.general || generalLocal.value) cajaGeneral.value?.focus()
    else cajaResumen.value?.focus()
  },
)
</script>

<template>
  <div class="adm-formulario-vista">
    <button type="button" class="adm-volver" :disabled="guardando" @click="emit('cancelar')">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Volver a farmacias
    </button>

    <form
      class="adm-form-tarjeta"
      novalidate
      aria-labelledby="form-titulo"
      :aria-busy="guardando"
      @submit.prevent="enviar"
    >
      <h2 id="form-titulo" ref="titulo" class="adm-form-tarjeta__titulo" tabindex="-1">
        {{ esEdicion ? 'Editar farmacia' : 'Nueva farmacia' }}
      </h2>
      <p class="adm-form__nota">Los campos marcados con * son obligatorios.</p>

      <div
        v-if="mostrarResumen && resumen.length"
        id="resumen-errores"
        ref="cajaResumen"
        class="adm-resumen-errores"
        role="alert"
        tabindex="-1"
      >
        <h3 class="adm-resumen-errores__titulo">
          {{ resumen.length === 1 ? 'Hay 1 campo por corregir' : `Hay ${resumen.length} campos por corregir` }}
        </h3>
        <ul class="adm-resumen-errores__lista">
          <li v-for="r in resumen" :key="r.clave">
            <a :href="`#${r.id}`" @click.prevent="irAlCampo(r.id)">{{ r.texto }}</a>
          </li>
        </ul>
      </div>

      <p
        v-if="textoGeneral"
        ref="cajaGeneral"
        class="adm-alerta adm-alerta--error"
        role="alert"
        tabindex="-1"
      >
        {{ textoGeneral }}
      </p>

      <div class="adm-form__rejilla">
        <CampoFormulario id="far-nombre" etiqueta="Nombre" requerido clase="adm-campo--completo" :error="errores.nombre">
          <template #default="{ atributos }">
            <input
              v-bind="atributos"
              v-model="datos.nombre"
              class="adm-campo__control"
              type="text"
              name="nombre"
              maxlength="100"
              autocomplete="off"
              @input="limpiar('nombre')"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario id="far-direccion" etiqueta="Dirección" requerido clase="adm-campo--completo" :error="errores.direccion">
          <template #default="{ atributos }">
            <input
              v-bind="atributos"
              v-model="datos.direccion"
              class="adm-campo__control"
              type="text"
              name="direccion"
              maxlength="200"
              autocomplete="off"
              @input="limpiar('direccion')"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario id="far-ciudad" etiqueta="Ciudad" requerido :error="errores.ciudad">
          <template #default="{ atributos }">
            <input
              v-bind="atributos"
              v-model="datos.ciudad"
              class="adm-campo__control"
              type="text"
              name="ciudad"
              maxlength="100"
              autocomplete="off"
              @input="limpiar('ciudad')"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario
          id="far-telefono"
          etiqueta="Teléfono"
          opcional
          ayuda="Por ejemplo: 01 234 5678."
          :error="errores.telefono"
        >
          <template #default="{ atributos }">
            <input
              v-bind="atributos"
              v-model="datos.telefono"
              class="adm-campo__control"
              type="tel"
              name="telefono"
              maxlength="30"
              inputmode="tel"
              autocomplete="off"
              @input="limpiar('telefono')"
            />
          </template>
        </CampoFormulario>
      </div>

      <div class="adm-form__acciones">
        <button type="submit" class="fa-boton" :disabled="guardando">
          <span v-if="guardando" class="adm-boton__spinner" aria-hidden="true"></span>
          {{ guardando ? 'Guardando…' : 'Guardar farmacia' }}
        </button>
        <button type="button" class="fa-boton fa-boton--secundario" :disabled="guardando" @click="emit('cancelar')">
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>
