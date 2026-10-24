<!--
  DetalleMedicamentoView.vue  (src/views/)
  Qué es: la página de UN medicamento (ruta /medicamento/:id). Muestra su imagen de categoría,
  datos, las farmacias donde está (precio y stock), y permite elegir farmacia y cantidad para
  agregarlo al carrito.
  Quién la usa: src/router/index.js (la ruta 'medicamento'). El :id de la URL llega como prop `id`.
  La cabecera, la barra de búsqueda y el pie los pone App.vue; aquí solo va el <main>.
-->
<script setup>
// 'vue' y 'vue-router' son paquetes instalados en node_modules.
import { ref, computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
// Archivos locales de FarmaApp (alias @ -> src/).
import { obtenerMedicamentoPorId } from '@/services/medicamentosService.js'
import { useCarrito } from '@/composables/useCarrito.js'
import { nombreCategoria } from '@/mocks/categorias.mock.js'
import { formatearPrecio } from '@/utils/normalizar.js'
import { describirStock } from '@/utils/stock.js'
import ImagenCategoria from '@/components/comunes/ImagenCategoria.vue'
import ControlCantidad from '@/components/comunes/ControlCantidad.vue'
import EstadoCarga from '@/components/busqueda/EstadoCarga.vue'
import EstadoError from '@/components/busqueda/EstadoError.vue'

// `id` llega desde la ruta (props: true en el router) como texto.
const props = defineProps({
  id: { type: String, required: true },
})

const router = useRouter()
const route = useRoute()
const { items, agregar } = useCarrito()

// ---- Estado de la carga ----
// 'cargando' | 'ok' | 'no-encontrado' | 'error'
const estado = ref('cargando')
const medicamento = ref(null)
let contadorPeticion = 0 // descarta respuestas viejas si el id cambia mientras se carga

// ---- Estado del formulario ----
const farmaciaId = ref(null) // id de la farmacia elegida (radio)
const cantidad = ref(1)
const aviso = ref('') // mensaje de confirmación (zona role="status")

const hayStock = computed(() => medicamento.value?.ofertas.some((o) => o.stock > 0) ?? false)

const ofertaElegida = computed(
  () => medicamento.value?.ofertas.find((o) => o.farmacia.id === farmaciaId.value) ?? null,
)

// Unidades que ya tengo en el carrito de ESA farmacia.
const enCarrito = computed(() => {
  if (!medicamento.value || !ofertaElegida.value) return 0
  const item = items.value.find(
    (i) => i.medicamentoId === medicamento.value.id && i.farmaciaId === ofertaElegida.value.farmacia.id,
  )
  return item ? item.cantidad : 0
})
// Unidades que aún puedo agregar (stock de la farmacia - lo que ya hay en el carrito).
const disponibles = computed(() =>
  ofertaElegida.value ? Math.max(0, ofertaElegida.value.stock - enCarrito.value) : 0,
)
const puedeAgregar = computed(() => ofertaElegida.value !== null && disponibles.value > 0)

// Si cambia la farmacia o lo disponible, la cantidad nunca pasa del máximo (ni baja de 1).
watch([farmaciaId, disponibles], () => {
  cantidad.value = Math.min(Math.max(cantidad.value, 1), Math.max(disponibles.value, 1))
})

// El mensaje "Agregaste… (Farmacia X)" deja de valer si el usuario elige otra farmacia.
watch(farmaciaId, () => {
  aviso.value = ''
})

// Elige la farmacia inicial: la de la URL (?farmacia=ID, la que se vio en la tarjeta) si tiene
// stock; si no, la más barata con stock (las ofertas ya vienen ordenadas por precio).
function preseleccionar(med) {
  const pedida = Number(route.query.farmacia)
  const conStock = med.ofertas.filter((o) => o.stock > 0)
  const elegida = conStock.find((o) => o.farmacia.id === pedida) ?? conStock[0]
  farmaciaId.value = elegida ? elegida.farmacia.id : null
  cantidad.value = 1
}

async function cargar() {
  const numero = ++contadorPeticion
  estado.value = 'cargando'
  medicamento.value = null
  aviso.value = ''
  try {
    const med = await obtenerMedicamentoPorId(props.id)
    if (numero !== contadorPeticion) return
    if (!med) {
      estado.value = 'no-encontrado'
      return
    }
    medicamento.value = med
    preseleccionar(med)
    estado.value = 'ok'
  } catch {
    if (numero !== contadorPeticion) return
    estado.value = 'error'
  }
}

// immediate: carga al abrir la página; y de nuevo si cambia el :id estando en ella.
watch(() => props.id, cargar, { immediate: true })

function agregarAlCarrito() {
  if (!puedeAgregar.value) return
  const med = medicamento.value
  const oferta = ofertaElegida.value
  const resultado = agregar(
    {
      medicamentoId: med.id,
      farmaciaId: oferta.farmacia.id,
      nombre: med.nombre,
      farmaciaNombre: oferta.farmacia.nombre,
      precio: oferta.precio,
      categoria: med.categoria,
      stock: oferta.stock,
    },
    cantidad.value,
  )
  aviso.value =
    `Agregaste ${resultado.agregadas} ${resultado.agregadas === 1 ? 'unidad' : 'unidades'} de ` +
    `${med.nombre} (${oferta.farmacia.nombre}) al carrito.` +
    (resultado.limitado ? ' Es el máximo disponible en esta farmacia.' : '')
  cantidad.value = 1
}

// "Volver a resultados": si venimos del buscador, retrocede en el historial (así el navegador
// recupera el scroll). Si no (se abrió el enlace directamente), va al inicio.
const hrefInicio = computed(() => router.resolve({ name: 'inicio' }).href)
function volver() {
  const anterior = window.history.state?.back
  if (typeof anterior === 'string' && anterior.split('#')[0] === '/') router.back()
  else router.push({ name: 'inicio' })
}
</script>

<template>
  <!-- tabindex="-1": permite que el enlace "saltar al contenido" le pase el foco. -->
  <main id="contenido" class="detalle fa-contenedor" tabindex="-1">
    <!-- Enlace real (con href) para poder abrirlo en otra pestaña; el clic normal retrocede. -->
    <p class="detalle__volver">
      <a class="detalle__enlace" :href="hrefInicio" @click.prevent="volver">
        <span aria-hidden="true">←</span> Volver a resultados
      </a>
    </p>

    <EstadoCarga v-if="estado === 'cargando'" texto="Cargando medicamento…" />

    <EstadoError
      v-else-if="estado === 'error'"
      mensaje="No pudimos cargar el medicamento. Inténtalo de nuevo."
      @reintentar="cargar"
    />

    <section v-else-if="estado === 'no-encontrado'" class="detalle__vacio">
      <h1 class="detalle__titulo">Medicamento no encontrado</h1>
      <p>No existe un medicamento con ese código. Puede que el enlace sea antiguo.</p>
      <RouterLink class="fa-boton" :to="{ name: 'inicio' }">Ir al buscador</RouterLink>
    </section>

    <article v-else-if="medicamento" class="detalle__contenido">
      <div class="detalle__cabecera">
        <ImagenCategoria :categoria="medicamento.categoria" tamano="lg" />
        <div class="detalle__datos">
          <h1 class="detalle__titulo">{{ medicamento.nombre }}</h1>
          <dl class="detalle__lista">
            <div>
              <dt>Principio activo</dt>
              <dd>{{ medicamento.principioActivo }}</dd>
            </div>
            <div>
              <dt>Presentación</dt>
              <dd>{{ medicamento.presentacion }}</dd>
            </div>
            <div>
              <dt>Categoría</dt>
              <dd>{{ nombreCategoria(medicamento.categoria) }}</dd>
            </div>
          </dl>
          <p v-if="medicamento.requiereReceta" class="detalle__receta">
            Requiere receta médica. Preséntala al recoger tu pedido en la farmacia.
          </p>
        </div>
      </div>

      <form class="detalle__compra" @submit.prevent="agregarAlCarrito">
        <fieldset class="farmacias">
          <legend class="farmacias__titulo">Elige una farmacia</legend>
          <!-- Cada farmacia es un radio dentro de un <label>: se puede pulsar en toda la fila.
               Las que no tienen stock quedan desactivadas (no se pueden elegir). -->
          <label
            v-for="oferta in medicamento.ofertas"
            :key="oferta.farmacia.id"
            :class="[
              'oferta',
              {
                'oferta--elegida': farmaciaId === oferta.farmacia.id,
                'oferta--agotada': !(oferta.stock > 0),
              },
            ]"
          >
            <input
              v-model="farmaciaId"
              class="oferta__radio"
              type="radio"
              name="farmacia"
              :value="oferta.farmacia.id"
              :disabled="!(oferta.stock > 0)"
            />
            <span class="oferta__datos">
              <span class="oferta__nombre">{{ oferta.farmacia.nombre }}</span>
              <span class="oferta__direccion">{{ oferta.farmacia.direccion }}</span>
            </span>
            <span class="oferta__precio">{{ formatearPrecio(oferta.precio) }}</span>
            <span :class="['oferta__stock', `oferta__stock--${describirStock(oferta.stock).modificador}`]">
              {{ describirStock(oferta.stock).texto }}
            </span>
          </label>
        </fieldset>

        <p v-if="!hayStock" class="detalle__nota">
          Este medicamento está agotado en todas las farmacias por ahora.
        </p>
        <template v-else>
          <p v-if="ofertaElegida && disponibles <= 0" class="detalle__nota">
            Ya tienes en el carrito todas las unidades disponibles de esta farmacia.
          </p>
          <div v-else class="detalle__cantidad">
            <span class="detalle__etiqueta">Cantidad</span>
            <ControlCantidad
              v-model="cantidad"
              :min="1"
              :max="Math.max(disponibles, 1)"
              :etiqueta="`Cantidad de ${medicamento.nombre}`"
            />
            <span v-if="ofertaElegida" class="detalle__maximo">
              Máximo {{ disponibles }} {{ disponibles === 1 ? 'unidad' : 'unidades' }}
            </span>
          </div>
        </template>

        <button class="fa-boton detalle__agregar" type="submit" :disabled="!puedeAgregar">
          Agregar al carrito
        </button>

        <!-- Zona "viva": existe siempre (vacía) y el texto aparece después, así el lector
             de pantalla anuncia la confirmación. -->
        <div class="detalle__aviso" role="status">
          <p v-if="aviso" class="detalle__confirmacion">
            {{ aviso }}
            <RouterLink class="detalle__enlace" :to="{ name: 'carrito' }">Ver carrito</RouterLink>
          </p>
        </div>
      </form>
    </article>
  </main>
</template>

<style scoped>
/* Zona principal: flex:1 empuja el pie hacia abajo. */
.detalle {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-3);
  padding-block: var(--fa-espacio-3) var(--fa-espacio-4);
}
.detalle:focus {
  outline: none; /* foco programático del enlace "saltar": los controles sí tienen aro */
}
.detalle p,
.detalle h1,
.detalle dl,
.detalle dd {
  margin: 0;
  overflow-wrap: anywhere;
}

/* Enlaces de esta página: anulan el estilo global de "a" (padding, fondo al pasar el ratón...) */
.detalle__volver {
  margin: 0;
}
.detalle__enlace {
  display: inline-flex;
  align-items: center;
  gap: var(--fa-espacio-1);
  min-height: var(--fa-tactil-min);
  padding: 0;
  font-weight: 600;
  color: var(--fa-color-primario);
  background: transparent;
  text-decoration: underline;
  transition: none;
}
.detalle__enlace:hover {
  background: transparent;
  color: var(--fa-color-primario-hover);
}

/* No encontrado */
.detalle__vacio {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--fa-espacio-3);
  padding: var(--fa-espacio-4);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
}

/* Tarjeta de contenido */
.detalle__contenido {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-4);
  padding: var(--fa-espacio-3);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
  box-shadow: var(--fa-sombra-tarjeta);
}
/* Cabecera: en móvil la imagen es una franja ancha arriba y los datos debajo (apilado). */
.detalle__cabecera {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--fa-espacio-3);
}
/* :deep() llega al interior del componente hijo ImagenCategoria. En móvil la ilustración
   ocupa todo el ancho (franja de 160px de alto); el dibujo SVG se centra solo dentro. */
.detalle__cabecera :deep(.imagen-categoria) {
  width: 100%;
  height: 160px;
}
.detalle__datos {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-3);
  min-width: 0;
}
.detalle__titulo {
  font-size: var(--fa-texto-xl);
  line-height: 1.25;
  color: var(--fa-color-primario-oscuro);
}
/* Datos como pares "etiqueta pequeña / valor en negrita", separados por una línea fina */
.detalle__lista {
  display: flex;
  flex-direction: column;
}
.detalle__lista > div {
  padding-block: var(--fa-espacio-2);
  border-bottom: 1px solid var(--fa-borde);
}
.detalle__lista > div:first-child {
  border-top: 1px solid var(--fa-borde);
}
.detalle__lista dt {
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}
.detalle__lista dd {
  font-weight: 600;
}
/* Aviso de receta: ámbar con barra gruesa a la izquierda y la marca "Rx".
   #8a4b00 sobre #fff1d6 = contraste 6,1:1. El texto lo dice con palabras (no solo con color). */
.detalle__receta {
  display: flex;
  align-items: flex-start;
  gap: var(--fa-espacio-2);
  padding: var(--fa-espacio-2) var(--fa-espacio-3);
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  color: var(--fa-color-aviso);
  background: var(--fa-fondo-aviso);
  border-left: 4px solid var(--fa-color-aviso);
  border-radius: var(--fa-radio-sm);
}
.detalle__receta::before {
  content: 'Rx';
  content: 'Rx' / ''; /* el "/ ''" evita que el lector de pantalla lo lea (es decoración) */
  flex-shrink: 0;
  padding: 0 6px;
  font-weight: 800;
  line-height: 1.5;
  color: #ffffff;
  background: var(--fa-color-aviso);
  border-radius: 4px;
}

/* Compra: en móvil se separa del producto con una línea; en escritorio es un panel (ver abajo) */
.detalle__compra {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-3);
  padding-top: var(--fa-espacio-3);
  border-top: 1px solid var(--fa-borde);
}
.farmacias {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-2);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.farmacias__titulo {
  padding: 0;
  margin-bottom: var(--fa-espacio-2);
  font-family: var(--fa-fuente-titulos);
  font-size: var(--fa-texto-lg);
  font-weight: 700;
  color: var(--fa-color-primario-oscuro);
}
/* Fila de farmacia: rejilla [radio | datos | precio] y el stock debajo en móvil. */
.oferta {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'radio datos precio'
    '.     stock stock';
  align-items: center;
  gap: var(--fa-espacio-1) var(--fa-espacio-3);
  min-height: var(--fa-tactil-min);
  padding: var(--fa-espacio-3);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde-control);
  border-radius: var(--fa-radio);
  cursor: pointer;
}
.oferta:hover {
  border-color: var(--fa-color-primario);
}
/* Fila elegida: fondo verde suave y borde de 2px (1px + sombra: el tamaño no cambia, la fila no "salta") */
.oferta--elegida {
  background: var(--fa-color-marca-suave);
  border-color: var(--fa-color-primario);
  box-shadow: 0 0 0 1px var(--fa-color-primario);
}
/* Agotada: fondo gris y sin borde marcado, pero el texto sigue legible (#52606d sobre #f4f6f5 = 6,0:1).
   No usamos "opacity" porque bajaría el contraste por debajo de AA. */
.oferta--agotada {
  background: var(--fa-fondo-pagina);
  color: var(--fa-color-texto-suave);
  border-color: var(--fa-borde);
  border-style: dashed;
  cursor: not-allowed;
}
.oferta--agotada .oferta__nombre,
.oferta--agotada .oferta__precio {
  color: var(--fa-color-texto-suave);
}
/* Aro de foco en toda la fila cuando el radio recibe foco con teclado (:has = "que contenga") */
.oferta:has(.oferta__radio:focus-visible) {
  outline: 3px solid var(--fa-color-foco);
  outline-offset: 2px;
}
/* Radio propio y bien visible (24px). appearance:none quita el dibujo del navegador para poder
   pintarlo nosotros: borde gris oscuro (#7a8794, 3,7:1 sobre blanco, cumple 3:1 de componentes UI). */
.oferta__radio {
  grid-area: radio;
  appearance: none;
  width: 24px;
  height: 24px;
  margin: 0;
  background: var(--fa-fondo-superficie);
  border: 2px solid var(--fa-borde-control);
  border-radius: 50%;
  cursor: inherit;
}
/* Elegido: aro verde con punto verde dentro (el punto se dibuja con una sombra interior blanca) */
.oferta__radio:checked {
  background: var(--fa-color-primario);
  border-color: var(--fa-color-primario);
  box-shadow: inset 0 0 0 4px var(--fa-fondo-superficie);
}
.oferta__radio:disabled {
  background: var(--fa-borde);
  border-color: var(--fa-borde-control);
}
.oferta__radio:focus-visible {
  outline: 3px solid var(--fa-color-foco);
  outline-offset: 3px;
}
.oferta__datos {
  grid-area: datos;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.oferta__nombre {
  font-weight: 600;
}
.oferta__direccion {
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}
.oferta__precio {
  grid-area: precio;
  font-family: var(--fa-fuente-titulos);
  font-size: var(--fa-texto-lg);
  font-weight: 700;
  color: var(--fa-color-primario-oscuro);
}
.oferta__stock {
  grid-area: stock;
  justify-self: start;
  padding: 2px var(--fa-espacio-3);
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  border-radius: var(--fa-radio-pildora);
}
.oferta__stock--ok {
  color: var(--fa-color-ok);
  background: var(--fa-fondo-ok);
}
.oferta__stock--aviso {
  color: var(--fa-color-aviso);
  background: var(--fa-fondo-aviso);
}
.oferta__stock--agotado {
  color: var(--fa-color-error);
  background: var(--fa-fondo-error);
}

/* Cantidad: etiqueta + control + máximo en una fila (se parte en varias si no caben) */
.detalle__cantidad {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--fa-espacio-2) var(--fa-espacio-3);
}
.detalle__etiqueta {
  font-weight: 600;
}
.detalle__maximo {
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}
/* Nota informativa (agotado / ya tienes todo): ámbar con barra izquierda, igual que la receta */
.detalle__nota {
  padding: var(--fa-espacio-3);
  color: var(--fa-color-aviso);
  background: var(--fa-fondo-aviso);
  border-left: 4px solid var(--fa-color-aviso);
  border-radius: var(--fa-radio-sm);
  font-weight: 600;
}
/* Botón principal: grande (52px de alto) y ancho completo en móvil. Su color y su estado
   desactivado vienen de .fa-boton en farmaapp.css. Aquí solo el tamaño. */
.detalle__agregar {
  align-self: stretch;
  min-height: 52px;
  font-size: var(--fa-texto-lg);
}
/* Confirmación: verde con barra izquierda y marca de verificación. #146c2e sobre #e3f4e8 = 5,6:1.
   Se distingue de la receta (ámbar, "Rx") por color, por icono y por el texto. */
.detalle__confirmacion {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--fa-espacio-1) var(--fa-espacio-3);
  padding: var(--fa-espacio-3);
  color: var(--fa-color-ok);
  background: var(--fa-fondo-ok);
  border-left: 4px solid var(--fa-color-ok);
  border-radius: var(--fa-radio-sm);
  font-weight: 600;
}
.detalle__confirmacion::before {
  content: '✓';
  content: '✓' / '';
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-weight: 800;
  color: #ffffff;
  background: var(--fa-color-ok);
  border-radius: 50%;
}

/* ---- Tablet (>= 640px) ---- */
@media (min-width: 640px) {
  .detalle__contenido {
    padding: var(--fa-espacio-4);
  }
  .detalle__agregar {
    align-self: flex-start;
    min-width: 280px;
  }
  /* Con más ancho el stock pasa a la misma fila */
  .oferta {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    grid-template-areas: 'radio datos stock precio';
  }
}

/* ---- Tablet (>= 768px): imagen a la izquierda y datos a la derecha ---- */
@media (min-width: 768px) {
  .detalle__cabecera {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--fa-espacio-4);
  }
  .detalle__cabecera :deep(.imagen-categoria) {
    width: 180px;
    height: 180px;
    padding: 22px;
  }
  .detalle__datos {
    flex: 1;
  }
  .detalle__titulo {
    font-size: var(--fa-texto-2xl);
  }
}

/* ---- Escritorio (>= 1024px): dos columnas. Izquierda = producto; derecha = compra ---- */
@media (min-width: 1024px) {
  .detalle__contenido {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
    gap: var(--fa-espacio-5);
  }
  /* La compra pasa a ser un panel con fondo suave (gris muy claro) para distinguirla del producto */
  .detalle__compra {
    padding: var(--fa-espacio-4);
    background: var(--fa-fondo-pagina);
    border: 1px solid var(--fa-borde);
    border-radius: var(--fa-radio);
  }
  /* En la columna estrecha la imagen vuelve a ir arriba de los datos si no hay sitio para las dos */
  .detalle__cabecera {
    flex-direction: column;
  }
  .detalle__cabecera :deep(.imagen-categoria) {
    width: 100%;
    height: 200px;
  }
}
@media (min-width: 1360px) {
  .detalle__cabecera {
    flex-direction: row;
  }
  .detalle__cabecera :deep(.imagen-categoria) {
    width: 200px;
    height: 200px;
  }
}
</style>
