<!--
  CarritoView.vue  (src/views/)
  Qué es: la página del carrito (ruta /carrito). Lista lo que el usuario agregó, deja cambiar
  la cantidad, quitar productos o vaciar el carrito, y muestra el total.
  Quién la usa: src/router/index.js (la ruta 'carrito'). Cabecera y pie los pone App.vue.
  Los datos vienen de useCarrito.js (estado compartido, guardado en localStorage).
-->
<script setup>
// 'vue' y 'vue-router' son paquetes instalados en node_modules.
import { ref, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
// Archivos locales de FarmaApp (alias @ -> src/).
import { useCarrito } from '@/composables/useCarrito.js'
import { formatearPrecio } from '@/utils/normalizar.js'
import ImagenCategoria from '@/components/comunes/ImagenCategoria.vue'
import ControlCantidad from '@/components/comunes/ControlCantidad.vue'

const { items, totalProductos, totalPrecio, cambiarCantidad, quitar, vaciar } = useCarrito()

// Referencia al <h1> (template ref): tras quitar algo, el foco va ahí para que quien usa teclado
// no lo pierda (el botón que pulsó desaparece).
const titulo = ref(null)
// Zona "viva" (role="status"): existe siempre y el texto cambia, así se anuncia el resultado.
const mensaje = ref('')

async function quitarProducto(item) {
  quitar(item.medicamentoId, item.farmaciaId)
  mensaje.value = `Quitaste ${item.nombre} del carrito.`
  await nextTick()
  titulo.value?.focus()
}

async function vaciarCarrito() {
  vaciar()
  mensaje.value = 'Carrito vaciado.'
  await nextTick()
  titulo.value?.focus()
}

// Clave única de cada línea: un mismo medicamento puede estar en dos farmacias.
const clave = (item) => `${item.medicamentoId}-${item.farmaciaId}`
const subtotal = (item) => Math.round(item.precio * item.cantidad * 100) / 100
</script>

<template>
  <main id="contenido" class="carrito fa-contenedor" tabindex="-1">
    <h1 ref="titulo" class="carrito__titulo" tabindex="-1">Tu carrito</h1>

    <!-- Zona viva: siempre en el DOM; solo cambia su texto. -->
    <p class="carrito__mensaje" role="status">{{ mensaje }}</p>

    <!-- Carrito vacío -->
    <section v-if="items.length === 0" class="carrito__vacio">
      <!-- Icono de bolsa decorativo (aria-hidden: no aporta información, el texto ya la da) -->
      <svg class="carrito__vacio-icono" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <path d="M12 22h40l-3 34a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3z" />
        <path d="M22 22v-5a10 10 0 0 1 20 0v5" />
        <path d="M24 36c2 4 5 6 8 6s6-2 8-6" />
      </svg>
      <p class="carrito__vacio-titulo">Tu carrito está vacío.</p>
      <p class="carrito__vacio-texto">Busca un medicamento y agrégalo desde su ficha para verlo aquí.</p>
      <RouterLink class="fa-boton" :to="{ name: 'inicio' }">Buscar medicamentos</RouterLink>
    </section>

    <div v-else class="carrito__contenido">
      <ul class="lista">
        <li v-for="item in items" :key="clave(item)" class="linea">
          <ImagenCategoria :categoria="item.categoria" tamano="sm" />

          <div class="linea__datos">
            <h2 class="linea__nombre">
              <RouterLink
                class="linea__enlace"
                :to="{
                  name: 'medicamento',
                  params: { id: item.medicamentoId },
                  query: { farmacia: item.farmaciaId },
                }"
              >
                {{ item.nombre }}
              </RouterLink>
            </h2>
            <p class="linea__farmacia">{{ item.farmaciaNombre }}</p>
            <p class="linea__precio">{{ formatearPrecio(item.precio) }} c/u</p>
          </div>

          <div class="linea__cantidad">
            <ControlCantidad
              :model-value="item.cantidad"
              :min="1"
              :max="item.stock"
              :etiqueta="`Cantidad de ${item.nombre}`"
              @update:model-value="cambiarCantidad(item.medicamentoId, item.farmaciaId, $event)"
            />
            <p class="linea__maximo">Máx. {{ item.stock }}</p>
          </div>

          <p class="linea__subtotal">
            <span class="fa-visualmente-oculto">Subtotal: </span>{{ formatearPrecio(subtotal(item)) }}
          </p>

          <button class="linea__quitar" type="button" @click="quitarProducto(item)">
            Quitar<span class="fa-visualmente-oculto"> {{ item.nombre }} del carrito</span>
          </button>
        </li>
      </ul>

      <aside class="resumen" aria-labelledby="titulo-resumen">
        <h2 id="titulo-resumen" class="resumen__titulo">Resumen</h2>
        <p class="resumen__fila">
          <span>Productos</span>
          <span>{{ totalProductos }}</span>
        </p>
        <p class="resumen__fila resumen__fila--total">
          <span>Total</span>
          <span>{{ formatearPrecio(totalPrecio) }}</span>
        </p>

        <!-- Aún no hay pagos: botón desactivado de verdad y con la razón visible. -->
        <button class="fa-boton" type="button" disabled aria-describedby="proximamente">
          Finalizar compra
        </button>
        <p id="proximamente" class="resumen__nota">Próximamente</p>

        <button class="fa-boton fa-boton--secundario" type="button" @click="vaciarCarrito">
          Vaciar carrito
        </button>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.carrito {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-3);
  padding-block: var(--fa-espacio-4);
}
.carrito:focus,
.carrito__titulo:focus {
  outline: none; /* foco programático: los controles sí tienen aro */
}
.carrito p,
.carrito h1,
.carrito h2 {
  margin: 0;
  overflow-wrap: anywhere;
}
.carrito__titulo {
  font-size: var(--fa-texto-xl);
  color: var(--fa-color-primario-oscuro);
}
/* La zona viva no ocupa espacio cuando está vacía */
.carrito__mensaje:empty {
  display: none;
}
.carrito__mensaje {
  padding: var(--fa-espacio-2) var(--fa-espacio-3);
  color: var(--fa-color-ok);
  background: var(--fa-fondo-ok);
  border-radius: var(--fa-radio-sm);
  font-weight: 600;
}

/* Carrito vacío: tarjeta centrada con icono, mensaje amable y un solo botón de acción */
.carrito__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--fa-espacio-2);
  padding: var(--fa-espacio-5) var(--fa-espacio-3);
  text-align: center;
  background: var(--fa-fondo-superficie);
  border: 1px dashed var(--fa-borde-control);
  border-radius: var(--fa-radio);
}
.carrito__vacio-icono {
  width: 96px;
  height: 96px;
  padding: var(--fa-espacio-3);
  margin-bottom: var(--fa-espacio-2);
  fill: var(--fa-color-marca-suave);
  stroke: var(--fa-color-primario);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  background: var(--fa-color-marca-suave);
  border-radius: 50%;
}
.carrito__vacio-icono path:first-child {
  fill: #ffffff;
}
.carrito__vacio-titulo {
  font-family: var(--fa-fuente-titulos);
  font-size: var(--fa-texto-lg);
  font-weight: 700;
  color: var(--fa-color-primario-oscuro);
}
.carrito__vacio-texto {
  max-width: 36ch;
  margin-bottom: var(--fa-espacio-2);
  color: var(--fa-color-texto-suave);
}

.carrito__contenido {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-3);
}

/* Lista de líneas */
.lista {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-3);
  margin: 0;
  padding: 0;
  list-style: none;
}
/* Móvil: imagen | datos arriba; cantidad, subtotal y quitar debajo */
.linea {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    'imagen datos'
    'cantidad cantidad'
    'subtotal quitar';
  align-items: center;
  gap: var(--fa-espacio-2) var(--fa-espacio-3);
  padding: var(--fa-espacio-3);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
  box-shadow: var(--fa-sombra-tarjeta);
}
.linea > :first-child {
  grid-area: imagen;
}
.linea__datos {
  grid-area: datos;
  min-width: 0;
}
.linea__nombre {
  font-size: var(--fa-texto-lg);
  line-height: 1.3;
}
/* Enlace del nombre: anula el estilo global de "a" */
.linea__enlace {
  padding: 0;
  font-weight: 700;
  color: var(--fa-color-texto);
  background: transparent;
  text-decoration: none;
  transition: none;
}
.linea__enlace:hover {
  background: transparent;
  color: var(--fa-color-primario);
  text-decoration: underline;
}
.linea__farmacia,
.linea__precio,
.linea__maximo {
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave); /* #52606d sobre blanco = 6,9:1 */
}
.linea__farmacia {
  margin-top: 2px;
}
.linea__cantidad {
  grid-area: cantidad;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--fa-espacio-2) var(--fa-espacio-3);
  padding-top: var(--fa-espacio-2);
  border-top: 1px solid var(--fa-borde);
}
/* Subtotal de la línea: el número que más importa, en la fuente de títulos */
.linea__subtotal {
  grid-area: subtotal;
  font-family: var(--fa-fuente-titulos);
  font-size: var(--fa-texto-lg);
  font-weight: 700;
  color: var(--fa-color-primario-oscuro);
}
/* "Quitar": discreto = solo texto rojo subrayado, sin borde ni relleno. Sigue teniendo 44px de
   alto táctil y #b3261e sobre blanco = 6,5:1. Al pasar el ratón se rellena de rojo muy suave. */
.linea__quitar {
  grid-area: quitar;
  justify-self: end;
  min-height: var(--fa-tactil-min);
  min-width: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-2);
  font: inherit;
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  color: var(--fa-color-error);
  text-decoration: underline;
  background: transparent;
  border: 0;
  border-radius: var(--fa-radio-sm);
  cursor: pointer;
  transition: none;
}
.linea__quitar:hover {
  background: var(--fa-fondo-error);
}

/* Resumen */
.resumen {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-3);
  padding: var(--fa-espacio-3);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
  box-shadow: var(--fa-sombra-tarjeta);
}
.resumen__titulo {
  padding-bottom: var(--fa-espacio-2);
  font-size: var(--fa-texto-lg);
  color: var(--fa-color-primario-oscuro);
  border-bottom: 1px solid var(--fa-borde);
}
.resumen__fila {
  display: flex;
  justify-content: space-between;
  gap: var(--fa-espacio-3);
  color: var(--fa-color-texto-suave);
}
/* Total: separado por una línea y en grande, es la cifra clave del resumen */
.resumen__fila--total {
  padding-top: var(--fa-espacio-3);
  font-family: var(--fa-fuente-titulos);
  font-size: var(--fa-texto-xl);
  font-weight: 700;
  color: var(--fa-color-primario-oscuro);
  border-top: 1px solid var(--fa-borde);
}
/* "Próximamente": pegada al botón desactivado para que se entienda por qué no funciona */
.resumen__nota {
  margin-top: calc(var(--fa-espacio-2) * -1);
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
  text-align: center;
}

/* ---- Tablet (>= 640px): una sola fila por producto ---- */
@media (min-width: 640px) {
  .linea {
    grid-template-columns: auto minmax(0, 1fr) auto auto auto;
    grid-template-areas: 'imagen datos cantidad subtotal quitar';
    gap: var(--fa-espacio-3);
  }
  .linea__cantidad {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--fa-espacio-1);
    padding-top: 0;
    border-top: 0; /* la línea separadora solo se necesita cuando la cantidad va en su propia fila (móvil) */
  }
  .linea__subtotal {
    min-width: 5.5rem;
    text-align: right;
  }
}

/* ---- Escritorio (>= 1024px): lista + resumen a un lado ---- */
@media (min-width: 1024px) {
  .carrito__contenido {
    flex-direction: row;
    align-items: flex-start;
  }
  .lista {
    flex: 1;
    min-width: 0;
  }
  .resumen {
    flex: 0 0 320px;
    position: sticky;
    top: calc(var(--fa-alto-cabecera) + var(--fa-espacio-3));
  }
}
</style>
