<!--
  CabeceraTienda.vue  (src/components/layout/)
  Qué es: la cabecera de la "tienda": barra blanca pegajosa (logotipo, menú, "Identifícate",
  bolsa del carrito y buscador) + franja verde de ubicación.
  Quién la usa: src/App.vue (aparece en todas las páginas).
  Slot: <slot /> es un "hueco". El padre escribe dentro de <CabeceraTienda>...</CabeceraTienda>
  y ese contenido aparece aquí. Así el buscador (<BarraBusqueda>) y su lógica viven en App.vue,
  y esta cabecera solo se ocupa del aspecto y de la navegación.

  Elementos REALES:
    - Botón del menú (<button>): círculo naranja con tres rayas (y, desde 1024px, el texto
      "Menú de Categorías"). Abre/cierra el menú: en escritorio (>= 1024px) el mega-menú
      MenuEscritorio.vue (y las rayas pasan a ser una X); en móvil/tablet el cajón MenuLateral.vue.
      Solo UNO de los dos menús está montado a la vez (v-if / v-else según el ancho de pantalla).
    - Logotipo: enlace (<RouterLink>) al inicio.
    - "Identifícate": botón desactivado (aria-disabled, title "Próximamente"); aún no hay login.
    - Bolsa: enlace a /carrito con el contador real de productos (viene de useCarrito.js).

  Este componente tiene DOS elementos raíz (header + div): Vue 3 lo permite (fragmento).
  Van separados a propósito: solo el <header> es "pegajoso"; la franja verde se va con el scroll
  y así en el móvil no se gasta pantalla.
-->
<script setup>
// 'vue' y 'vue-router' son paquetes instalados en node_modules.
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
// Archivos locales (ruta relativa ./ = misma carpeta; alias @ -> src/).
import MenuLateral from './MenuLateral.vue'
import MenuEscritorio from './MenuEscritorio.vue'
import { useCarrito } from '@/composables/useCarrito.js'

const route = useRoute()
const { totalProductos } = useCarrito()

const menuAbierto = ref(false) // ¿está desplegado el menú (el de escritorio o el lateral)?
const botonMenu = ref(null) // referencia al <button> naranja (para devolverle el foco)

// ¿Pantalla de escritorio (>= 1024px)? matchMedia es la versión en JavaScript de una @media de CSS.
// Con `change` el navegador nos avisa cuando la ventana cruza esos 1024px.
const consultaEscritorio = window.matchMedia('(min-width: 1024px)')
const esEscritorio = ref(consultaEscritorio.matches)
function alCambiarAncho(evento) {
  esEscritorio.value = evento.matches
  menuAbierto.value = false // al cambiar de tipo de menú se cierra el abierto (no tendría sentido mantenerlo)
}
consultaEscritorio.addEventListener('change', alCambiarAncho)
onBeforeUnmount(() => consultaEscritorio.removeEventListener('change', alCambiarAncho))

// Texto para lectores de pantalla: "Carrito, 3 productos".
const etiquetaCarrito = computed(() => {
  const n = totalProductos.value
  return `Carrito, ${n} ${n === 1 ? 'producto' : 'productos'}`
})
// El globito no crece sin límite: a partir de 100 muestra "99+".
const contador = computed(() => (totalProductos.value > 99 ? '99+' : String(totalProductos.value)))

// El botón naranja abre y (en escritorio, donde el menú no tapa el botón) también cierra.
function alternarMenu() {
  if (menuAbierto.value) cerrarMenu()
  else menuAbierto.value = true
}
// Cierra el menú y devuelve el foco al botón naranja (si está visible).
// `opciones.devolverFoco === false` lo usa MenuEscritorio cuando el foco ya se fue a otro elemento
// (p. ej. con Tab): así no se lo quitamos.
async function cerrarMenu(opciones) {
  if (!menuAbierto.value) return
  menuAbierto.value = false
  if (opciones?.devolverFoco === false) return
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
      <!-- Botón del menú: círculo naranja con tres rayas (en escritorio, una X mientras está abierto).
           En móvil/tablet solo se ve el círculo; desde 1024px aparece al lado el texto "Menú de / Categorías".
           aria-expanded dice si el menú está abierto; aria-controls apunta al id del menú que toca:
           el mega-menú en escritorio o el <dialog> en móvil.
           aria-label contiene el texto visible ("Menú de Categorías"): así quien usa control por
           voz puede decir "clic en Menú de categorías" (WCAG 2.5.3, etiqueta en el nombre). Es fijo:
           el estado (abierto/cerrado) ya lo comunica aria-expanded. -->
      <button
        ref="botonMenu"
        class="cabecera__menu"
        type="button"
        aria-label="Menú de categorías"
        :aria-controls="esEscritorio ? 'menu-escritorio' : 'menu-lateral'"
        :aria-expanded="menuAbierto"
        @click="alternarMenu"
      >
        <span class="cabecera__menu-icono">
          <svg class="icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <!-- En móvil el icono no cambia: el cajón modal tiene su propio botón "Cerrar" -->
            <path :d="esEscritorio && menuAbierto ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'" />
          </svg>
        </span>
        <!-- aria-hidden: el nombre del botón ya lo da aria-label (así no se lee dos veces) -->
        <span class="cabecera__menu-texto" aria-hidden="true">
          <span class="cabecera__menu-linea1">Menú de</span>
          <span class="cabecera__menu-linea2">Categorías</span>
        </span>
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

      <!-- Ubicación: se ve en la cabecera solo en pantallas anchas (>= 1360px); en las demás
           sigue la franja verde de abajo. Es el mismo dato ("Farmacias en Lima"), no una función nueva:
           nunca se muestran las dos a la vez (la oculta display:none, que también la quita del lector). -->
      <p class="cabecera__ubicacion">
        <svg class="cabecera__pin" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        <span class="cabecera__ubicacion-texto">
          <strong class="cabecera__ubicacion-titulo">Farmacias en Lima</strong>
          <span class="cabecera__ubicacion-nota">Precios y stock referenciales</span>
        </span>
      </p>

      <!-- Zona derecha: Identifícate (aún no disponible) + bolsa del carrito -->
      <div class="cabecera__acciones">
        <!-- aria-disabled (no "disabled"): sigue siendo enfocable y el lector lo anuncia como no disponible.
             El clic no hace nada (.prevent). El title muestra "Próximamente" al pasar el ratón. -->
        <button class="acceso" type="button" aria-disabled="true" title="Próximamente" @click.prevent>
          <span class="acceso__texto">
            <!-- aria-hidden: "Bienvenid@" es solo un saludo decorativo (un lector diría "arroba") -->
            <span class="acceso__saludo" aria-hidden="true">Bienvenid@</span>
            <span class="acceso__accion">Iniciar sesión</span>
          </span>
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

    <!-- Solo UNO de los dos menús existe a la vez:
         - escritorio: mega-menú (panel no modal bajo la cabecera);
         - móvil/tablet: cajón lateral (<dialog> modal), que se muestra encima de todo. -->
    <MenuEscritorio v-if="esEscritorio" :abierto="menuAbierto" @cerrar="cerrarMenu" />
    <MenuLateral v-else id="menu-lateral" :abierto="menuAbierto" @cerrar="cerrarMenu" />
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
.cabecera__ubicacion {
  grid-area: ubic;
  display: none; /* oculta hasta 1360px: ahí la ubicación la muestra la franja verde */
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

/* La bolsa del carrito (un <a>): caja de 44x44 (tamaño táctil estándar) que centra el icono.
   Anula el estilo global de "a" de main.css (padding, fondo verde al pasar el ratón, transición). */
.bolsa {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--fa-tactil-min);
  height: var(--fa-tactil-min);
  padding: 0;
  color: var(--fa-color-primario); /* verde de marca: 5,4:1 sobre blanco */
  background: transparent;
  border: 0;
  border-radius: var(--fa-radio-sm);
  cursor: pointer;
  transition: none;
}
.bolsa:hover {
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-color-marca-suave);
}

/* Botón del menú: un <button> sin aspecto de botón nativo que agrupa
   [círculo naranja con icono] + [texto en dos líneas, solo en escritorio]. */
.cabecera__menu {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: var(--fa-tactil-min);
  padding: 0;
  color: var(--fa-color-texto);
  background: transparent;
  border: 0;
  border-radius: var(--fa-radio-pildora); /* el aro de foco sigue la forma redondeada */
  cursor: pointer;
  text-align: left;
  transition: none;
}
/* El círculo naranja: 44x44 (área táctil mínima). Icono OSCURO sobre naranja = ~7:1.
   El naranja solo se usa aquí, como acento: el texto va sobre fondo claro. */
.cabecera__menu-icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--fa-tactil-min);
  height: var(--fa-tactil-min);
  color: var(--fa-color-texto);
  background: var(--fa-color-naranja);
  border-radius: 50%;
}
.cabecera__menu:hover .cabecera__menu-icono {
  background: var(--fa-color-naranja-hover);
}
/* Mientras el menú está abierto (aria-expanded="true") el círculo lleva un doble aro
   blanco + verde: se nota que está "activo" sin depender solo del color naranja. */
.cabecera__menu[aria-expanded='true'] .cabecera__menu-icono {
  background: var(--fa-color-naranja-hover); /* naranja un poco más intenso (icono oscuro: ~6:1) */
  box-shadow: 0 0 0 2px var(--fa-fondo-superficie), 0 0 0 4px var(--fa-color-primario);
}
/* Con foco de teclado y el menú abierto, el aro azul global (offset 2px) chocaría con el doble
   aro de arriba (4px). Lo separamos a 6px para que se vean los dos. */
.cabecera__menu[aria-expanded='true']:focus-visible {
  outline-offset: 6px;
}
/* El texto del menú: oculto en móvil/tablet (solo círculo); se muestra desde 1024px */
.cabecera__menu-texto {
  display: none;
  flex-direction: column;
  line-height: 1.2;
  white-space: nowrap;
}
.cabecera__menu-linea1 {
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave); /* 7:1 sobre blanco */
}
.cabecera__menu-linea2 {
  font-size: var(--fa-texto-base);
  font-weight: 700;
  color: var(--fa-color-texto);
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
  text-align: left;
  line-height: 1.2;
  color: var(--fa-color-texto-suave); /* atenuado: #52606d sobre blanco = 7:1 (sigue siendo legible) */
  background: transparent;
  border: 0;
  border-radius: var(--fa-radio-sm);
  cursor: not-allowed; /* el puntero "prohibido" avisa de que aún no funciona */
  transition: none;
}
.acceso:hover {
  background: transparent; /* no reacciona: no hace nada todavía */
}
/* El icono de usuario va ANTES del texto aunque en el HTML esté después (order: -1) y en verde. */
.acceso .icono {
  order: -1;
  width: 28px;
  height: 28px;
  color: var(--fa-color-primario);
}
.acceso__saludo {
  display: block;
  font-weight: 400;
}
.acceso__accion {
  display: block;
  font-weight: 700;
  color: var(--fa-color-texto-suave);
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
    display: block;
  }
  .franja__nota {
    display: block;
  }
}

/* ---- Escritorio (>= 1024px): todo en UNA fila ----
     [logotipo] [menú de categorías] [buscador ancho .......] [acciones]
   El buscador ocupa el hueco sobrante (minmax(0, 1fr)). */
@media (min-width: 1024px) {
  .cabecera__fila {
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    grid-template-areas: 'logo menu buscar acciones';
    column-gap: var(--fa-espacio-4);
    padding-block: var(--fa-espacio-3);
  }
  /* Ahora el botón del menú también se ve en escritorio, con su texto al lado del círculo. */
  .cabecera__menu-texto {
    display: flex;
  }
  .cabecera__menu {
    padding-right: var(--fa-espacio-2);
  }
  .cabecera__buscador {
    width: 100%;
    max-width: 880px;
  }
  .logo {
    font-size: 1.625rem;
  }
  .logo__icono {
    width: 32px;
    height: 32px;
  }
  .bolsa {
    width: 48px;
    height: 48px;
  }
  .bolsa .icono {
    width: 30px;
    height: 30px;
  }
}

/* ---- Pantalla ancha (>= 1360px): la ubicación pasa de la franja verde a la cabecera ----
   Con menos ancho no cabría sin apretar el buscador, por eso solo aquí. */
@media (min-width: 1360px) {
  .cabecera__fila {
    grid-template-columns: auto auto minmax(0, 1fr) auto auto;
    grid-template-areas: 'logo menu buscar ubic acciones';
  }
  .cabecera__ubicacion {
    display: inline-flex;
    align-items: center;
    gap: var(--fa-espacio-2);
    margin: 0;
    line-height: 1.25;
  }
  .cabecera__pin {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    fill: none;
    stroke: var(--fa-color-primario);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .cabecera__ubicacion-texto {
    display: flex;
    flex-direction: column;
  }
  .cabecera__ubicacion-titulo {
    font-size: var(--fa-texto-sm);
    font-weight: 700;
    color: var(--fa-color-texto);
  }
  .cabecera__ubicacion-nota {
    font-size: 0.75rem;
    color: var(--fa-color-texto-suave); /* 7:1 sobre blanco */
  }
  /* La franja verde sobra: su contenido ya está en la cabecera */
  .franja {
    display: none;
  }
}

/* Menos movimiento: esta cabecera no usa animaciones, solo dejamos las transiciones del botón
   explícitamente apagadas por si en el futuro se añade alguna. */
@media (prefers-reduced-motion: reduce) {
  .cabecera__menu,
  .cabecera__menu-icono,
  .bolsa,
  .logo {
    transition: none;
  }
}
</style>
