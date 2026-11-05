<script setup>
// Formulario para CREAR o EDITAR un medicamento (con su disponibilidad por farmacia).
// Quién lo usa: src/views/AdminView.vue, que lo muestra en lugar de la lista.
//
// Props:
//   - medicamento: el medicamento a editar, o null para crear uno nuevo.
//   - farmacias: lista de farmacias para los selects de la disponibilidad.
//   - guardando: true mientras AdminView espera la respuesta de la API.
//   - errorEnvio: { general, campos } con lo que respondió el servidor si falló (o null).
// Emits:
//   - 'guardar' (datos): los datos ya validados, en el formato que espera la API.
//   - 'cancelar': volver a la lista sin guardar.
//
// Imports:
//   - 'vue': paquete instalado en node_modules.
//   - '@/composables/useCategorias.js': archivo local (alias @ -> src/). Da las categorías del select.
//   - './CampoFormulario.vue' y './FilaInventario.vue': archivos locales, ruta relativa (misma carpeta).
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { useCategorias } from '@/composables/useCategorias.js'
import CampoFormulario from './CampoFormulario.vue'
import FilaInventario from './FilaInventario.vue'

const props = defineProps({
  medicamento: { type: Object, default: null },
  farmacias: { type: Array, required: true },
  guardando: { type: Boolean, default: false },
  errorEnvio: { type: Object, default: null },
})
const emit = defineEmits(['guardar', 'cancelar'])

const MAX_FILAS = 100
const PRECIO_MAXIMO = 999999.99
const STOCK_MAXIMO = 1000000

// cargando/error/reintentar: para avisar en el select de categoría si la API falló y ofrecer reintentar.
const { categorias, cargando: cargandoCategorias, error: errorCategorias, reintentar: reintentarCategorias } = useCategorias()
const esEdicion = computed(() => props.medicamento !== null)

// ---- Datos del formulario (se copian del medicamento para no modificar la lista original) ----
let contadorClaves = 0 // cada fila lleva una `clave` única para que v-for no se confunda al quitar filas
function crearFila(inv = {}) {
  contadorClaves += 1
  return {
    clave: contadorClaves,
    farmaciaId: inv.farmaciaId ?? '',
    precio: inv.precio ?? '',
    precioAnterior: inv.precioAnterior ?? '',
    stock: inv.stock ?? '',
  }
}

const m = props.medicamento
const datos = reactive({
  nombre: m?.nombre ?? '',
  marca: m?.marca ?? '',
  principioActivo: m?.principioActivo ?? '',
  presentacion: m?.presentacion ?? '',
  categoria: m?.categoria ?? '',
  requiereReceta: m?.requiereReceta ?? false,
  imagen: m?.imagen ?? '',
  inventario: (m?.inventario ?? []).map(crearFila),
})

// ---- Errores ----
// errores: { clave: texto }. Claves: 'nombre', 'categoria'... o 'inventario.0.precio' (fila 0).
const errores = ref({})
const resumen = ref([]) // [{ clave, id, texto }]: foto de los errores en el momento de enviar
const mostrarResumen = ref(false)
const generalLocal = ref('')
const textoGeneral = computed(() => generalLocal.value || props.errorEnvio?.general || '')

// Datos de cada campo para armar el resumen (id del control, etiqueta y orden)
const CAMPOS = [
  { clave: 'nombre', id: 'med-nombre', etiqueta: 'Nombre' },
  { clave: 'marca', id: 'med-marca', etiqueta: 'Marca' },
  { clave: 'principioActivo', id: 'med-principio', etiqueta: 'Principio activo' },
  { clave: 'presentacion', id: 'med-presentacion', etiqueta: 'Presentación' },
  { clave: 'categoria', id: 'med-categoria', etiqueta: 'Categoría' },
  { clave: 'imagen', id: 'med-imagen', etiqueta: 'Imagen' },
]
const CAMPOS_FILA = [
  { campo: 'farmaciaId', sufijo: 'farmacia', etiqueta: 'farmacia' },
  { campo: 'precio', sufijo: 'precio', etiqueta: 'precio' },
  { campo: 'precioAnterior', sufijo: 'anterior', etiqueta: 'precio anterior' },
  { campo: 'stock', sufijo: 'stock', etiqueta: 'stock' },
]

/** Devuelve { id, etiqueta, orden } del campo con esa clave, o null si no existe en pantalla. */
function describir(clave) {
  const indiceFijo = CAMPOS.findIndex((c) => c.clave === clave)
  if (indiceFijo >= 0) return { ...CAMPOS[indiceFijo], orden: indiceFijo }
  const partes = clave.match(/^inventario\.(\d+)\.(\w+)$/)
  if (partes) {
    const fila = Number(partes[1])
    const posicion = CAMPOS_FILA.findIndex((c) => c.campo === partes[2])
    if (posicion >= 0 && fila < datos.inventario.length) {
      const c = CAMPOS_FILA[posicion]
      return {
        id: `inv-${fila}-${c.sufijo}`,
        etiqueta: `Farmacia ${fila + 1}, ${c.etiqueta}`,
        orden: 100 + fila * 10 + posicion,
      }
    }
  }
  return null
}

function construirResumen() {
  const lista = []
  for (const [clave, texto] of Object.entries(errores.value)) {
    const campo = describir(clave)
    if (campo) lista.push({ clave, id: campo.id, orden: campo.orden, texto: `${campo.etiqueta}: ${texto}` })
  }
  lista.sort((a, b) => a.orden - b.orden)
  resumen.value = lista
}

function limpiar(clave) {
  delete errores.value[clave]
}
function limpiarFila(indice, campo) {
  limpiar(`inventario.${indice}.${campo}`)
  if (campo === 'farmaciaId') {
    // El aviso de "farmacia repetida" puede estar en otra fila: se limpia en todas
    datos.inventario.forEach((_, i) => limpiar(`inventario.${i}.farmaciaId`))
  }
}

// ---- Validación en el navegador (refleja las reglas de la API, con los textos del diseño) ----
const texto = (valor) => String(valor ?? '').trim()
const esNumero = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v))
const tieneMasDeDosDecimales = (n) => Math.abs(n * 100 - Math.round(n * 100)) > 1e-6

function validar() {
  const e = {}

  const obligatorio = (clave, mensaje) => {
    if (!texto(datos[clave])) e[clave] = mensaje
    else if (texto(datos[clave]).length > 100) e[clave] = 'Máximo 100 caracteres.'
  }
  obligatorio('nombre', 'Escribe el nombre del medicamento.')
  obligatorio('marca', 'Escribe la marca.')
  obligatorio('principioActivo', 'Escribe el principio activo.')
  obligatorio('presentacion', 'Escribe la presentación.')
  if (!datos.categoria) e.categoria = 'Elige una categoría.'

  const imagen = texto(datos.imagen)
  if (imagen) {
    const rutaValida =
      (imagen.startsWith('/') && !imagen.startsWith('//')) ||
      imagen.startsWith('http://') ||
      imagen.startsWith('https://')
    if (imagen.length > 300) e.imagen = 'Máximo 300 caracteres.'
    else if (!rutaValida) e.imagen = 'Escribe una ruta que empiece por / o una dirección http:// o https://.'
  }

  const vistas = new Set() // farmacias ya elegidas, para detectar repetidas
  datos.inventario.forEach((fila, i) => {
    const k = (campo) => `inventario.${i}.${campo}`

    if (fila.farmaciaId === '' || fila.farmaciaId === null) e[k('farmaciaId')] = 'Elige una farmacia.'
    else if (vistas.has(fila.farmaciaId)) e[k('farmaciaId')] = 'Esta farmacia ya está en la lista.'
    else vistas.add(fila.farmaciaId)

    const precio = Number(fila.precio)
    const precioValido = esNumero(fila.precio) && precio > 0
    if (!precioValido) e[k('precio')] = 'Escribe un precio mayor que 0.'
    else if (precio > PRECIO_MAXIMO) e[k('precio')] = 'El precio máximo es 999999.99.'
    else if (tieneMasDeDosDecimales(precio)) e[k('precio')] = 'Usa como máximo 2 decimales.'

    if (fila.precioAnterior !== '' && fila.precioAnterior !== null) {
      const anterior = Number(fila.precioAnterior)
      if (!esNumero(fila.precioAnterior) || anterior <= 0) e[k('precioAnterior')] = 'Escribe un precio mayor que 0.'
      else if (anterior > PRECIO_MAXIMO) e[k('precioAnterior')] = 'El precio máximo es 999999.99.'
      else if (tieneMasDeDosDecimales(anterior)) e[k('precioAnterior')] = 'Usa como máximo 2 decimales.'
      else if (precioValido && anterior <= precio)
        e[k('precioAnterior')] = 'Debe ser mayor que el precio actual para que sea una oferta.'
    }

    const stock = Number(fila.stock)
    if (!esNumero(fila.stock) || !Number.isInteger(stock) || stock < 0 || stock > STOCK_MAXIMO)
      e[k('stock')] = 'Escribe un número entero de 0 o más.'
  })

  return e
}

/** Arma el objeto tal como lo espera la API (camelCase, números de verdad, imagen null si está vacía). */
function construirPayload() {
  return {
    nombre: texto(datos.nombre),
    marca: texto(datos.marca),
    principioActivo: texto(datos.principioActivo),
    presentacion: texto(datos.presentacion),
    requiereReceta: Boolean(datos.requiereReceta),
    categoria: datos.categoria,
    imagen: texto(datos.imagen) || null,
    inventario: datos.inventario.map((fila) => {
      const item = {
        farmaciaId: Number(fila.farmaciaId),
        precio: Number(fila.precio),
        stock: Number(fila.stock),
      }
      if (fila.precioAnterior !== '' && fila.precioAnterior !== null) {
        item.precioAnterior = Number(fila.precioAnterior)
      }
      return item
    }),
  }
}

// ---- Foco ----
const titulo = ref(null)
const cajaResumen = ref(null)
const cajaGeneral = ref(null)
const botonAgregar = ref(null)

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
  // Se usa focus() en vez de dejar que el enlace cambie la URL (con vue-router el # confundiría a la ruta)
  document.getElementById(id)?.focus()
}

// Cuando el servidor responde con un error, lo mostramos (los datos escritos no se pierden)
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

// ---- Filas de disponibilidad ----
const anuncio = ref('') // texto para lectores de pantalla ("Farmacia quitada. Quedan 2.")

async function agregarFila() {
  if (datos.inventario.length >= MAX_FILAS) return
  datos.inventario.push(crearFila())
  anuncio.value = ''
  await nextTick()
  document.getElementById(`inv-${datos.inventario.length - 1}-farmacia`)?.focus()
}

async function quitarFila(indice) {
  datos.inventario.splice(indice, 1)
  // Los errores de filas se numeran por posición: al quitar una, los números cambian, así que se limpian
  for (const clave of Object.keys(errores.value)) {
    if (clave.startsWith('inventario.')) delete errores.value[clave]
  }
  const quedan = datos.inventario.length
  anuncio.value = `Farmacia quitada. Quedan ${quedan}.`
  await nextTick()
  botonAgregar.value?.focus()
}

// ---- Vista previa de la imagen ----
const imagenFalla = ref(false)
watch(
  () => datos.imagen,
  () => {
    imagenFalla.value = false
  },
)
const imagenPrevia = computed(() => texto(datos.imagen))
</script>

<template>
  <div class="adm-formulario-vista">
    <button type="button" class="adm-volver" :disabled="guardando" @click="emit('cancelar')">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Volver a medicamentos
    </button>

    <form
      class="adm-form-tarjeta"
      novalidate
      aria-labelledby="form-titulo"
      :aria-busy="guardando"
      @submit.prevent="enviar"
    >
      <h2 id="form-titulo" ref="titulo" class="adm-form-tarjeta__titulo" tabindex="-1">
        {{ esEdicion ? 'Editar medicamento' : 'Nuevo medicamento' }}
      </h2>
      <p class="adm-form__nota">Los campos marcados con * son obligatorios.</p>

      <!-- Resumen de errores: solo tras un intento de envío con errores -->
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

      <!-- Error general al guardar (red, servidor...) -->
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
        <CampoFormulario id="med-nombre" etiqueta="Nombre" requerido clase="adm-campo--completo" :error="errores.nombre">
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

        <CampoFormulario id="med-marca" etiqueta="Marca" requerido :error="errores.marca">
          <template #default="{ atributos }">
            <input
              v-bind="atributos"
              v-model="datos.marca"
              class="adm-campo__control"
              type="text"
              name="marca"
              maxlength="100"
              autocomplete="off"
              @input="limpiar('marca')"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario id="med-principio" etiqueta="Principio activo" requerido :error="errores.principioActivo">
          <template #default="{ atributos }">
            <input
              v-bind="atributos"
              v-model="datos.principioActivo"
              class="adm-campo__control"
              type="text"
              name="principioActivo"
              maxlength="100"
              autocomplete="off"
              @input="limpiar('principioActivo')"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario
          id="med-presentacion"
          etiqueta="Presentación"
          requerido
          ayuda="Por ejemplo: Caja x 20 tabletas."
          :error="errores.presentacion"
        >
          <template #default="{ atributos }">
            <input
              v-bind="atributos"
              v-model="datos.presentacion"
              class="adm-campo__control"
              type="text"
              name="presentacion"
              maxlength="100"
              autocomplete="off"
              @input="limpiar('presentacion')"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario id="med-categoria" etiqueta="Categoría" requerido :error="errores.categoria">
          <template #default="{ atributos }">
            <select
              v-bind="atributos"
              v-model="datos.categoria"
              class="adm-campo__control"
              name="categoria"
              :aria-busy="cargandoCategorias"
              :aria-describedby="
                [atributos['aria-describedby'], errorCategorias ? 'med-categoria-carga' : '']
                  .filter(Boolean)
                  .join(' ') || undefined
              "
              @change="limpiar('categoria')"
            >
              <option value="">{{ cargandoCategorias ? 'Cargando categorías…' : 'Selecciona una categoría' }}</option>
              <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
            <!-- Si la API falló: aviso (role="alert" lo anuncia el lector) + botón para volver a pedir.
                 type="button" evita que envíe el formulario. -->
            <template v-if="errorCategorias">
              <p id="med-categoria-carga" class="adm-campo__error" role="alert">No pudimos cargar las categorías.</p>
              <button
                type="button"
                class="fa-boton fa-boton--secundario adm-boton--compacto adm-campo__reintentar"
                :disabled="cargandoCategorias"
                @click="reintentarCategorias"
              >
                {{ cargandoCategorias ? 'Cargando…' : 'Reintentar' }}
              </button>
            </template>
          </template>
        </CampoFormulario>

        <div class="adm-campo adm-campo--completo">
          <label class="adm-check" for="med-receta">
            <input id="med-receta" v-model="datos.requiereReceta" type="checkbox" name="requiereReceta" />
            <span class="adm-check__texto">
              ¿Requiere receta?
              <span class="adm-check__ayuda">Márcalo si solo se vende con receta médica.</span>
            </span>
          </label>
        </div>

        <CampoFormulario
          id="med-imagen"
          etiqueta="Imagen"
          opcional
          clase="adm-campo--completo"
          ayuda="Ruta o dirección web de la imagen. Por ejemplo: /img/paracetamol.png"
          :error="errores.imagen"
        >
          <template #default="{ atributos }">
            <input
              v-bind="atributos"
              v-model="datos.imagen"
              class="adm-campo__control"
              type="text"
              name="imagen"
              maxlength="300"
              autocomplete="off"
              spellcheck="false"
              @input="limpiar('imagen')"
            />
          </template>
        </CampoFormulario>

        <!-- Vista previa: solo si hay algo escrito en el campo imagen -->
        <div v-if="imagenPrevia" class="adm-campo adm-campo--completo">
          <div v-if="!imagenFalla" class="adm-vista-previa">
            <div class="adm-vista-previa__marco">
              <img
                class="adm-vista-previa__img"
                :src="imagenPrevia"
                alt="Vista previa de la imagen del medicamento"
                @error="imagenFalla = true"
              />
            </div>
            <p class="adm-vista-previa__texto">Así se verá en la tienda.</p>
          </div>
          <p v-else class="adm-vista-previa__texto adm-vista-previa__fallo" role="status">
            No se pudo cargar esa imagen. Revisa la ruta.
          </p>
        </div>

        <fieldset class="adm-inventario adm-campo--completo" aria-describedby="inv-ayuda">
          <legend class="adm-inventario__titulo">Disponibilidad por farmacia</legend>
          <p id="inv-ayuda" class="adm-inventario__ayuda">
            Indica en qué farmacias se vende, a qué precio y cuántas unidades hay.
            Si el medicamento está en oferta, escribe también el precio anterior.
          </p>

          <p v-if="datos.inventario.length === 0" class="adm-inventario__vacio">
            Aún no agregaste ninguna farmacia.
          </p>

          <ul v-else class="adm-inventario__lista">
            <FilaInventario
              v-for="(fila, i) in datos.inventario"
              :key="fila.clave"
              :fila="fila"
              :indice="i"
              :farmacias="farmacias"
              :errores="{
                farmaciaId: errores[`inventario.${i}.farmaciaId`],
                precio: errores[`inventario.${i}.precio`],
                precioAnterior: errores[`inventario.${i}.precioAnterior`],
                stock: errores[`inventario.${i}.stock`],
              }"
              @quitar="quitarFila(i)"
              @limpiar="limpiarFila(i, $event)"
            />
          </ul>

          <button
            ref="botonAgregar"
            type="button"
            class="fa-boton fa-boton--secundario adm-inventario__agregar"
            :disabled="datos.inventario.length >= MAX_FILAS"
            @click="agregarFila"
          >
            Agregar farmacia
          </button>

          <!-- Anuncio para lectores de pantalla al quitar una fila (no es un toast) -->
          <p class="fa-visualmente-oculto" role="status">{{ anuncio }}</p>
        </fieldset>
      </div>

      <div class="adm-form__acciones">
        <button type="submit" class="fa-boton" :disabled="guardando">
          <span v-if="guardando" class="adm-boton__spinner" aria-hidden="true"></span>
          {{ guardando ? 'Guardando…' : 'Guardar medicamento' }}
        </button>
        <button type="button" class="fa-boton fa-boton--secundario" :disabled="guardando" @click="emit('cancelar')">
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>
