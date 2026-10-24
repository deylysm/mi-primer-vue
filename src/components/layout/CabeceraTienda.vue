<!--
  CabeceraTienda.vue  (src/components/layout/)
  Qué es: la cabecera de la "tienda": barra blanca pegajosa (logotipo, menú, "Identifícate",
  bolsa del carrito y buscador) + franja verde de ubicación.
  Quién la usa: src/App.vue (aparece en todas las páginas).
  Slot: <slot /> es un "hueco". El padre escribe dentro de <CabeceraTienda>...</CabeceraTienda>
  y ese contenido aparece aquí. Así el buscador (<BarraBusqueda>) y su lógica viven en App.vue,
  y esta cabecera solo se ocupa del aspecto y de la navegación.

  Elementos REALES:
    - Botón hamburguesa (<button>): solo se ve por debajo de 1024px; abre MenuLateral.vue.
    - Logotipo: enlace (<RouterLink>) al inicio.
    - "Identifícate": botón desactivado (aria-disabled, title "Próximamente"); aún no hay login.
    - Bolsa: enlace a /carrito con el contador real de productos (viene de useCarrito.js).

  Este componente tiene DOS elementos raíz (header + div): Vue 3 lo permite (fragmento).
  Van separados a propósito: solo el <header> es "pegajoso"; la franja verde se va con el scroll
  y así en el móvil no se gasta pantalla.
-->
<script setup>
// 'vue' y 'vue-router' son paquetes instalados en node_modules.
import { ref, computed, watch, nextTick } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
// Archivos locales (ruta relativa ./ = misma carpeta; alias @ -> src/).
import MenuLateral from './MenuLateral.vue'
import { useCarrito } from '@/composables/useCarrito.js'

const route = useRoute()
const { totalProductos } = useCarrito()

const menuAbierto = ref(false) // ¿está desplegado el menú lateral?
const botonMenu = ref(null) // referencia al <button> hamburguesa (para devolverle el foco)

// Texto para lectores de pantalla: "Carrito, 3 productos".
const etiquetaCarrito = computed(() => {
  const n = totalProductos.value
  return `Carrito, ${n} ${n === 1 ? 'producto' : 'productos'}`
})
// El globito no crece sin límite: a partir de 100 muestra "99+".
const contador = computed(() => (totalProductos.value > 99 ? '99+' : String(totalProductos.value)))

function abrirMenu() {
  menuAbierto.value = true
}
// Cierra el menú y devuelve el foco al botón hamburguesa (si está visible).
async function cerrarMenu() {
  if (!menuAbierto.value) return
  menuAbierto.value = false
  await nextTick()
  botonMenu.value?.focus()
}

// Si la URL cambia (se navegó a otra página), el menú se cierra.
watch(() => route.fullPath, () => {
  menuAbierto.value = false
})
</script>

<template>
  <header class="cabecera">
    <div class="cabecera__fila fa-contenedor">
      <!-- Menú hamburguesa: botón real, solo visible por debajo de 1024px.
           aria-expanded dice si el menú está abierto; aria-controls apunta al id del <dialog>. -->
      <button
        ref="botonMenu"
        class="cabecera__menu"
        type="button"
        aria-label="Abrir menú"
        aria-controls="menu-lateral"
        :aria-expanded="menuAbierto"
        @click="abrirMenu"
      >
        <svg class="icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <!-- Logotipo propio: cruz dibujada en SVG + texto "FarmaApp" (Poppins 800).
           El texto es real (no imagen): los lectores de pantalla lo leen. -->
      <RouterLink class="logo" :to="{ name: 'inicio' }" aria-label="FarmaApp, ir al inicio">
        <svg class="logo__icono" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <rect width="32" height="32" rx="9" />
          <path d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6z" />
        </svg>
        <span class="logo__texto"><span class="logo__farma">Farma</span><span class="logo__app">App</span></span>
      </RouterLink>

      <!-- Zona derecha: Identifícate (aún no disponible) + bolsa del carrito -->
      <div class="cabecera__acciones">
        <!-- aria-disabled (no "disabled"): sigue siendo enfocable y el lector lo anuncia como no disponible.
             El clic no hace nada (.prevent). El title muestra "Próximamente" al pasar el ratón. -->
        <button class="acceso" type="button" aria-disabled="true" title="Próximamente" @click.prevent>
          <span class="acceso__texto">Identifícate</span>
          <svg class="icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
          </svg>
          <span class="fa-visualmente-oculto">(próximamente)</span>
        </button>
        <RouterLink class="bolsa" :to="{ name: 'carrito' }" :aria-label="etiquetaCarrito">
          <svg class="icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 8h14l-1 12H6L5 8z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <!-- aria-hidden: el número ya está en el aria-label del enlace -->
          <span v-if="totalProductos > 0" class="bolsa__contador" aria-hidden="true">{{ contador }}</span>
        </RouterLink>
      </div>

      <!-- Hueco del buscador (lo rellena BuscadorView con <BarraBusqueda>) -->
      <div class="cabecera__buscador">
        <slot />
      </div>
    </div>

    <!-- Cajón lateral (<dialog>): se muestra encima de todo cuando menuAbierto es true. -->
    <MenuLateral id="menu-lateral" :abierto="menuAbierto" @cerrar="cerrarMenu" />
  </header>

  <!-- Franja verde de ubicación (a todo el ancho). Texto blanco sobre #0b7a38 = 5.4:1. -->
  <div class="franja">
    <div class="franja__interior fa-contenedor">
      <p class="franja__ubicacion">
        <svg class="franja__icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        Farmacias en Lima
      </p>
      <p class="franja__nota">Precios y stock referenciales</p>
    </div>
  </div>
</template>

<style scoped>
/* "scoped": estos estilos solo afectan a los elementos de ESTE componente
   (Vue añade un atributo data-v-xxxx a cada elemento y a cada regla). */

/* ---- Barra blanca ---- */
.cabecera {
  position: relative; /* necesario para que z-index funcione */
  z-index: 100;       /* por encima del contenido que pasa por debajo al hacer scroll */
  background: var(--fa-fondo-superficie);
  box-shadow: var(--fa-sombra-cabecera);
}

/* Pegajosa (sticky) solo si la ventana tiene altura suficiente (>= 36rem ~ 576px).
   En móviles en horizontal o con mucho zoom (ventana muy baja) una cabecera fija
   taparía media pantalla, así que ahí se desplaza con la página. */
@media (min-height: 36rem) {
  .cabecera {
    position: sticky;
    top: 0;
  }
}

/* Móvil: rejilla de 2 filas.
     fila 1:  [menú] [logotipo ............ ] [acciones]
     fila 2:  [buscador ocupando todo el ancho]
   grid-template-areas dibuja la maqueta con nombres: es fácil de leer y de cambiar. */
.cabecera__fila {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'menu logo acciones'
    'buscar buscar buscar';
  align-items: center;
  column-gap: var(--fa-espacio-1);
  row-gap: var(--fa-espacio-2);
  padding-block: var(--fa-espacio-2) var(--fa-espacio-3);
}

.cabecera__menu {
  grid-area: menu;
}
.logo {
  grid-area: logo;
}
.cabecera__acciones {
  grid-area: acciones;
}
.cabecera__buscador {
  grid-area: buscar;
  min-width: 0; /* deja que el buscador se encoja en vez de ensanchar la página */
}

/* ---- Iconos (todos de 24px, dibujados con trazo del color del texto) ---- */
.icono {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Caja de 44x44 (tamaño táctil estándar) que centra un icono.
   El botón hamburguesa y la bolsa (un <a>) anulan los estilos por defecto del botón y el
   estilo global de "a" de main.css (padding, fondo verde al pasar el ratón, transición). */
.cabecera__menu,
.bolsa {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--fa-tactil-min);
  height: var(--fa-tactil-min);
  padding: 0;
  color: var(--fa-color-primario-oscuro);
  background: transparent;
  border: 0;
  border-radius: var(--fa-radio-sm);
  cursor: pointer;
  transition: none;
}
.cabecera__menu:hover,
.bolsa:hover {
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-color-marca-suave);
}
/* Hamburguesa: con un borde fino parece un botón (y no un simple dibujo). #7a8794 sobre blanco
   = 3,7:1, cumple el mínimo de 3:1 para componentes de interfaz (WCAG 1.4.11). */
.cabecera__menu {
  border: 1px solid var(--fa-borde-control);
}
/* Mientras el menú está abierto el botón queda resaltado (aria-expanded="true") */
.cabecera__menu[aria-expanded='true'] {
  background: var(--fa-color-marca-suave);
  border-color: var(--fa-color-primario);
}

/* ---- Logotipo ---- */
.logo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  /* Poppins 800. 20px en negrita cuenta como "texto grande" (>= 18.66px negrita).
     Es 20px (no más) para que quepa junto al menú y los iconos a 320px de ancho. */
  font-family: var(--fa-fuente-titulos);
  font-weight: 800;
  font-size: 1.25rem;
  line-height: 1;
  letter-spacing: -0.02em;
  white-space: nowrap; /* "FarmaApp" nunca se parte en dos líneas */
  text-decoration: none;
  padding: 0; /* anula el padding global de "a" */
  background: transparent;
  transition: none;
}
.logo:hover {
  background: transparent; /* anula el fondo verde global de "a:hover" */
}
.logo__icono {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}
.logo__icono rect {
  fill: var(--fa-color-marca);
}
.logo__icono path {
  fill: #ffffff;
}
.logo__farma {
  color: var(--fa-color-primario-oscuro);
}
.logo__app {
  color: var(--fa-color-marca);
}

/* ---- Zona derecha ---- */
.cabecera__acciones {
  display: flex;
  align-items: center;
}
.acceso {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--fa-tactil-min);
  height: var(--fa-tactil-min);
  gap: var(--fa-espacio-2);
  padding: 0 var(--fa-espacio-2);
  font: inherit;
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  color: var(--fa-color-texto-suave); /* atenuado: #52606d sobre #f4f6f5 = 6,0:1 (sigue siendo legible) */
  background: var(--fa-fondo-pagina);
  border: 1px dashed var(--fa-borde-control); /* borde discontinuo = "aún no disponible" */
  border-radius: var(--fa-radio-sm);
  cursor: not-allowed;
  transition: none;
}
.acceso:hover {
  background: var(--fa-fondo-pagina); /* no reacciona: no hace nada todavía */
}
/* Un poco de aire entre "Identifícate" y la bolsa */
.acceso + .bolsa {
  margin-left: var(--fa-espacio-1);
}
/* En móvil solo el icono; el texto "Identifícate" aparece desde 640px */
.acceso__texto {
  display: none;
}

/* Globito rojo con contador. Blanco sobre #b3261e = 6.5:1. El anillo blanco (box-shadow) lo separa
   del dibujo de la bolsa y lo hace destacar. */
.bolsa__contador {
  position: absolute;
  top: 1px;
  right: -2px;
  min-width: 20px;
  height: 20px;
  padding-inline: 5px;
  box-shadow: 0 0 0 2px var(--fa-fondo-superficie);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  background: var(--fa-color-error);
  border-radius: var(--fa-radio-pildora);
}

/* ---- Franja verde de ubicación ---- */
.franja {
  background: var(--fa-color-primario);
  color: var(--fa-color-texto-sobre-verde);
}
.franja__interior {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fa-espacio-3);
  min-height: var(--fa-alto-franja);
}
.franja__ubicacion,
.franja__nota {
  margin: 0;
  font-size: var(--fa-texto-sm);
  font-weight: 600;
}
.franja__ubicacion {
  display: inline-flex;
  align-items: center;
  gap: var(--fa-espacio-2);
}
.franja__icono {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* A 320px no caben las dos frases en una línea: la nota se muestra desde 640px */
.franja__nota {
  display: none;
}

/* ---- Móviles muy estrechos (< 360px, p. ej. 320px) ----
   Con 320px el logotipo (20px) no cabía entre la hamburguesa y los iconos y se recortaba ~6px.
   Se reducen un poco el texto, el icono y el hueco para que quepa entero sin apretarse. */
@media (max-width: 359.98px) {
  .logo {
    gap: 4px;
    font-size: 1.125rem; /* 18px */
  }
  .logo__icono {
    width: 24px;
    height: 24px;
  }
  .acceso + .bolsa {
    margin-left: 0;
  }
}

/* ---- Tablet pequeña (>= 640px) ---- */
@media (min-width: 640px) {
  .logo {
    font-size: 1.375rem;
  }
  .acceso__texto {
    display: inline;
  }
  .franja__nota {
    display: block;
  }
}

/* ---- Escritorio (>= 1024px): todo en UNA fila: logotipo | buscador | acciones ---- */
@media (min-width: 1024px) {
  .cabecera__fila {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas: 'logo buscar acciones';
    column-gap: var(--fa-espacio-5);
    padding-block: var(--fa-espacio-3);
  }
  /* El menú hamburguesa solo existe en pantallas pequeñas */
  .cabecera__menu {
    display: none;
  }
  .cabecera__buscador {
    width: 100%;
    max-width: 680px;
    justify-self: center;
  }
  .logo {
    font-size: 1.625rem;
  }
  .logo__icono {
    width: 32px;
    height: 32px;
  }
}
</style>
