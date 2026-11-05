<!--
  AdminView.vue  (src/views/)
  Qué es: el panel de administración (ruta /admin, protegida: hace falta haber iniciado sesión).
  Muestra dos pestañas (Medicamentos y Farmacias) con su lista; desde ahí se puede crear, editar y
  borrar. El formulario se abre EN LUGAR de la lista (no en una ventana emergente).
  Quién la usa: src/router/index.js (ruta 'admin'). Cabecera y pie los pone App.vue.
  Esta vista es la que hace las llamadas a la API (services/adminService.js); los formularios solo
  validan y le entregan los datos con el evento 'guardar'.
-->
<script setup>
// 'vue' es un paquete instalado en node_modules.
import { ref, computed, nextTick, onMounted } from 'vue'
// Archivos locales con el alias @ (apunta a src/).
import { useSesion } from '@/composables/useSesion.js'
import { avisar } from '@/composables/useAvisos.js'
import {
  listarMedicamentosAdmin,
  crearMedicamento,
  editarMedicamento,
  borrarMedicamento,
  listarFarmaciasAdmin,
  crearFarmacia,
  editarFarmacia,
  borrarFarmacia,
} from '@/services/adminService.js'
import { interpretarErrorGuardar, textoErrorBorrar, esSesionCaducada } from '@/utils/erroresApi.js'
import EstadoCarga from '@/components/busqueda/EstadoCarga.vue'
// Componentes del panel: ruta con alias @ (carpeta src/components/admin/).
import PestanasAdmin from '@/components/admin/PestanasAdmin.vue'
import EstadoListaAdmin from '@/components/admin/EstadoListaAdmin.vue'
import TablaMedicamentos from '@/components/admin/TablaMedicamentos.vue'
import TablaFarmacias from '@/components/admin/TablaFarmacias.vue'
import FormMedicamento from '@/components/admin/FormMedicamento.vue'
import FormFarmacia from '@/components/admin/FormFarmacia.vue'
import DialogoConfirmar from '@/components/admin/DialogoConfirmar.vue'

const { usuario, salir } = useSesion()

const TEXTO_SIN_CONEXION = 'Sin conexión con el servidor. Inténtalo de nuevo.'

// ---- Qué se ve: la lista con pestañas o uno de los formularios ----
const seccion = ref('medicamentos') // pestaña activa: 'medicamentos' | 'farmacias'
const vista = ref('lista') // 'lista' | 'form-medicamento' | 'form-farmacia'
const editando = ref(null) // medicamento o farmacia que se edita (null = se está creando uno nuevo)

// ---- Datos de las listas ----
const medicamentos = ref([])
const farmacias = ref([])
const cargandoMedicamentos = ref(true)
const cargandoFarmacias = ref(true)
const falloMedicamentos = ref(false)
const falloFarmacias = ref(false)

/** Pide los medicamentos. `silencioso`: no vuelve a poner el "Cargando…" (se usa tras guardar). */
async function cargarMedicamentos(silencioso = false) {
  if (!silencioso) cargandoMedicamentos.value = true
  falloMedicamentos.value = false
  try {
    medicamentos.value = await listarMedicamentosAdmin()
  } catch {
    falloMedicamentos.value = true
  } finally {
    cargandoMedicamentos.value = false
  }
}

async function cargarFarmacias(silencioso = false) {
  if (!silencioso) cargandoFarmacias.value = true
  falloFarmacias.value = false
  try {
    farmacias.value = await listarFarmaciasAdmin()
  } catch {
    falloFarmacias.value = true
  } finally {
    cargandoFarmacias.value = false
  }
}

onMounted(() => {
  document.title = 'Administración - FarmaApp'
  cargarMedicamentos()
  cargarFarmacias() // también hacen falta para elegir farmacia en el formulario de medicamentos
})

// ---- Foco tras cerrar un formulario o borrar ----
const tituloMedicamentos = ref(null)
const tituloFarmacias = ref(null)

/** Lleva el foco al botón "Editar" de esa fila (si sigue existiendo) o, si no, al título del panel. */
async function enfocarDespues(idEditado = null) {
  await nextTick()
  const boton = idEditado !== null ? document.querySelector(`[data-editar-id="${idEditado}"]`) : null
  if (boton) boton.focus()
  else (seccion.value === 'farmacias' ? tituloFarmacias : tituloMedicamentos).value?.focus()
}

// ---- Abrir y cerrar formularios ----
const guardando = ref(false)
const errorEnvio = ref(null) // { general, campos } cuando el servidor rechazó el guardado

function abrirFormulario(tipo, elemento = null) {
  editando.value = elemento
  errorEnvio.value = null
  vista.value = tipo === 'medicamento' ? 'form-medicamento' : 'form-farmacia'
  // Si las farmacias no llegaron, se reintenta para que el select de farmacias no salga vacío
  if (tipo === 'medicamento' && (falloFarmacias.value || farmacias.value.length === 0)) {
    cargarFarmacias(true)
  }
}

function cerrarFormulario(idEditado = null) {
  vista.value = 'lista'
  editando.value = null
  errorEnvio.value = null
  enfocarDespues(idEditado)
}

// ---- Guardar (crear o editar) ----
/** Ejecuta `accion` (la llamada a la API). Si falla, deja el error en `errorEnvio` y devuelve false. */
async function intentarGuardar(accion) {
  guardando.value = true
  errorEnvio.value = null
  try {
    await accion()
    return true
  } catch (error) {
    if (!esSesionCaducada(error)) {
      // Si la sesión caducó no mostramos nada: el router ya está llevando al login
      const { general, campos } = interpretarErrorGuardar(error)
      // Sin `status` = ni siquiera hubo respuesta (servidor apagado o sin red)
      errorEnvio.value = { general: error.status ? general : TEXTO_SIN_CONEXION, campos }
    }
    return false
  } finally {
    guardando.value = false
  }
}

async function guardarMedicamento(datos) {
  const idEditado = editando.value?.id ?? null
  const ok = await intentarGuardar(async () => {
    if (idEditado !== null) await editarMedicamento(idEditado, datos)
    else await crearMedicamento(datos)
  })
  if (!ok) return
  await cargarMedicamentos(true) // se vuelve a pedir la lista para ver el cambio
  avisar({ tipo: 'exito', texto: idEditado !== null ? 'Cambios guardados.' : 'Medicamento creado correctamente.' })
  cerrarFormulario(idEditado)
}

async function guardarFarmacia(datos) {
  const idEditado = editando.value?.id ?? null
  const ok = await intentarGuardar(async () => {
    if (idEditado !== null) await editarFarmacia(idEditado, datos)
    else await crearFarmacia(datos)
  })
  if (!ok) return
  await cargarFarmacias(true)
  avisar({ tipo: 'exito', texto: idEditado !== null ? 'Cambios guardados.' : 'Farmacia creada correctamente.' })
  cerrarFormulario(idEditado)
}

// ---- Borrar (con diálogo de confirmación) ----
const dialogo = ref({ abierto: false, tipo: 'medicamento', elemento: null, borrando: false, error: '' })

function pedirBorrar(tipo, elemento) {
  dialogo.value = { abierto: true, tipo, elemento, borrando: false, error: '' }
}

function cancelarBorrado() {
  if (dialogo.value.borrando) return
  dialogo.value.abierto = false
}

async function confirmarBorrado() {
  const { tipo, elemento } = dialogo.value
  dialogo.value.borrando = true
  dialogo.value.error = ''
  try {
    if (tipo === 'medicamento') await borrarMedicamento(elemento.id)
    else await borrarFarmacia(elemento.id)
  } catch (error) {
    dialogo.value.borrando = false
    if (esSesionCaducada(error)) {
      dialogo.value.abierto = false // el router lleva al login
      return
    }
    dialogo.value.error = error.status ? textoErrorBorrar(error) : TEXTO_SIN_CONEXION
    // 404: ya no existía; refrescamos la lista para que desaparezca
    if (error.status === 404) {
      if (tipo === 'medicamento') cargarMedicamentos(true)
      else cargarFarmacias(true)
    }
    return // el diálogo sigue abierto con el mensaje y "Sí, borrar" se reactiva
  }

  // Éxito: quitamos la fila de la lista local (sin pedirla otra vez)
  if (tipo === 'medicamento') {
    medicamentos.value = medicamentos.value.filter((m) => m.id !== elemento.id)
    avisar({ tipo: 'exito', texto: 'Medicamento borrado.' })
  } else {
    farmacias.value = farmacias.value.filter((f) => f.id !== elemento.id)
    avisar({ tipo: 'exito', texto: 'Farmacia borrada.' })
  }
  dialogo.value.borrando = false
  dialogo.value.abierto = false
  enfocarDespues() // la fila ya no existe: el foco va al título del panel
}

const idBorrando = computed(() => (dialogo.value.borrando ? dialogo.value.elemento?.id : null))
</script>

<template>
  <main id="contenido" class="fa-contenedor adm-pagina" tabindex="-1">
    <header class="adm-pagina__cabecera">
      <div>
        <h1 class="adm-pagina__titulo">Administración</h1>
        <p class="adm-pagina__sesion">Sesión iniciada como <strong>{{ usuario }}</strong></p>
      </div>
      <button type="button" class="fa-boton fa-boton--secundario adm-boton--compacto" @click="salir">
        Cerrar sesión
      </button>
    </header>

    <!-- Vista de lista: pestañas y paneles -->
    <div v-if="vista === 'lista'" class="adm-tabs">
      <PestanasAdmin v-model="seccion" />

      <!-- Panel de medicamentos (el inactivo queda oculto con `hidden`) -->
      <section
        id="panel-medicamentos"
        class="adm-panel"
        role="tabpanel"
        aria-labelledby="tab-medicamentos"
        tabindex="0"
        :hidden="seccion !== 'medicamentos'"
      >
        <div class="adm-panel__cabecera">
          <h2 ref="tituloMedicamentos" class="adm-panel__titulo" tabindex="-1">
            Medicamentos
            <span v-if="!cargandoMedicamentos && !falloMedicamentos" class="adm-panel__contador">({{ medicamentos.length }})</span>
          </h2>
          <button type="button" class="fa-boton adm-panel__nuevo" @click="abrirFormulario('medicamento')">
            Nuevo medicamento
          </button>
        </div>

        <EstadoCarga v-if="cargandoMedicamentos" texto="Cargando medicamentos…" />
        <EstadoListaAdmin
          v-else-if="falloMedicamentos"
          tipo="error"
          titulo="No pudimos cargar los medicamentos"
          texto="Revisa tu conexión e inténtalo de nuevo."
          texto-boton="Reintentar"
          @accion="cargarMedicamentos()"
        />
        <EstadoListaAdmin
          v-else-if="medicamentos.length === 0"
          titulo="Aún no hay medicamentos"
          texto="Crea el primero para que aparezca en la tienda."
          texto-boton="Nuevo medicamento"
          @accion="abrirFormulario('medicamento')"
        />
        <TablaMedicamentos
          v-else
          :medicamentos="medicamentos"
          :borrando-id="dialogo.tipo === 'medicamento' ? idBorrando : null"
          @editar="abrirFormulario('medicamento', $event)"
          @borrar="pedirBorrar('medicamento', $event)"
        />
      </section>

      <!-- Panel de farmacias -->
      <section
        id="panel-farmacias"
        class="adm-panel"
        role="tabpanel"
        aria-labelledby="tab-farmacias"
        tabindex="0"
        :hidden="seccion !== 'farmacias'"
      >
        <div class="adm-panel__cabecera">
          <h2 ref="tituloFarmacias" class="adm-panel__titulo" tabindex="-1">
            Farmacias
            <span v-if="!cargandoFarmacias && !falloFarmacias" class="adm-panel__contador">({{ farmacias.length }})</span>
          </h2>
          <button type="button" class="fa-boton adm-panel__nuevo" @click="abrirFormulario('farmacia')">
            Nueva farmacia
          </button>
        </div>

        <EstadoCarga v-if="cargandoFarmacias" texto="Cargando farmacias…" />
        <EstadoListaAdmin
          v-else-if="falloFarmacias"
          tipo="error"
          titulo="No pudimos cargar las farmacias"
          texto="Revisa tu conexión e inténtalo de nuevo."
          texto-boton="Reintentar"
          @accion="cargarFarmacias()"
        />
        <EstadoListaAdmin
          v-else-if="farmacias.length === 0"
          titulo="Aún no hay farmacias"
          texto="Crea la primera para poder asignarle medicamentos."
          texto-boton="Nueva farmacia"
          @accion="abrirFormulario('farmacia')"
        />
        <TablaFarmacias
          v-else
          :farmacias="farmacias"
          :borrando-id="dialogo.tipo === 'farmacia' ? idBorrando : null"
          @editar="abrirFormulario('farmacia', $event)"
          @borrar="pedirBorrar('farmacia', $event)"
        />
      </section>
    </div>

    <!-- Formularios: sustituyen a la lista. `key` hace que se creen de cero al cambiar de elemento -->
    <FormMedicamento
      v-else-if="vista === 'form-medicamento'"
      :key="editando?.id ?? 'nuevo'"
      :medicamento="editando"
      :farmacias="farmacias"
      :guardando="guardando"
      :error-envio="errorEnvio"
      @guardar="guardarMedicamento"
      @cancelar="cerrarFormulario(editando?.id ?? null)"
    />
    <FormFarmacia
      v-else
      :key="editando?.id ?? 'nueva'"
      :farmacia="editando"
      :guardando="guardando"
      :error-envio="errorEnvio"
      @guardar="guardarFarmacia"
      @cancelar="cerrarFormulario(editando?.id ?? null)"
    />

    <!-- Diálogo de confirmación de borrado (una sola copia, sirve para las dos listas) -->
    <DialogoConfirmar
      :abierto="dialogo.abierto"
      :tipo="dialogo.tipo"
      :nombre="dialogo.elemento?.nombre ?? ''"
      :borrando="dialogo.borrando"
      :error="dialogo.error"
      @confirmar="confirmarBorrado"
      @cancelar="cancelarBorrado"
    />
  </main>
</template>
