<!--
  MenuEscritorio.vue  (src/components/layout/)
  Qué es: el MEGA-MENÚ de categorías para pantallas de escritorio (>= 1024px). Es un panel NO modal
  que se despliega justo debajo de la cabecera, con dos zonas:
    - izquierda: la lista de categorías (la activa se marca con --activa);
    - derecha: el título de la categoría activa, el enlace "Ver todo" y la rejilla de subcategorías.
  Quién lo usa: CabeceraTienda.vue, SOLO cuando la ventana mide >= 1024px (en móvil/tablet se usa
  el cajón MenuLateral.vue). Es hijo de <header class="cabecera">; se colocará con
  position:absolute; top:100% respecto a la cabecera (eso lo pone el CSS, que añade el diseñador).

  "No modal" significa: NO usa <dialog>/showModal(). La página de atrás sigue accesible y NO se
  bloquea el scroll. Por eso el teclado se gestiona a mano (ver más abajo).

  Props:  abierto (Boolean) -> true muestra el panel, false lo quita del DOM (v-if: así no recibe foco).
  Emits:  cerrar -> pide al padre cerrar el menú. Puede llevar { devolverFoco: false } cuando el foco
          ya se fue a otro sitio (así la cabecera no se lo "roba" devolviéndolo al botón naranja).

  Teclado (patrón "navegación con submenús", sin role="menu"):
    - Tab recorre en el orden del HTML (filas, luego el panel). Solo con Tab el panel NO cambia.
    - Enter / Espacio / clic / pasar el ratón (con una pequeña espera de 100 ms) activan una categoría.
    - Flechas ↑ / ↓ mueven el foco entre las filas.
    - → (en una fila con subcategorías) activa la categoría y pasa el foco al primer enlace del panel.
    - ← o Esc (desde el panel) devuelven el foco a la fila. Esc (desde una fila) cierra el menú.
    - Si el foco sale del menú (y no va al botón naranja), el menú se cierra.
-->
<script setup>
// 'vue' y 'vue-router' son paquetes instalados en node_modules.
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
// Alias @ -> src/. Categorías que vienen de la API (estado compartido) y lógica del buscador.
import { useCategorias } from '@/composables/useCategorias.js'
import { useBusquedaMedicamentos } from '@/composables/useBusquedaMedicamentos.js'
// Componente local: icono lineal de cada categoría (alias @ -> src/components/comunes/).
import IconoCategoria from '@/components/comunes/IconoCategoria.vue'

const props = defineProps({
  abierto: { type: Boolean, default: false },
})
const emit = defineEmits(['cerrar'])

const { seleccionarCategoria } = useBusquedaMedicamentos()
// `categorias` es un ref ([] mientras carga): en el script se lee con `.value`, en la plantilla no.
const { categorias } = useCategorias()

const mega = ref(null) // referencia al <nav> (template ref): sirve para buscar filas y enlaces dentro

// Categoría que se muestra en el panel derecho. Empieza vacía y el computed cae en la primera
// categoría cuando llegan de la API; al reabrir el menú conserva la última usada (el componente
// sigue montado: solo el contenido va con v-if).
const categoriaElegidaId = ref('') // lo que eligió el usuario ('' = todavía nada)
const categoriaActiva = computed(
  () => categorias.value.find((c) => c.id === categoriaElegidaId.value) ?? categorias.value[0],
)
// Id de la categoría activa (la elegida o, por defecto, la primera). Solo lectura.
const categoriaActivaId = computed(() => categoriaActiva.value?.id ?? '')
// `?.` y `?? []` toleran que una categoría no tenga `subcategorias` (ausente o vacío).
const subcategorias = computed(() => categoriaActiva.value?.subcategorias ?? [])

function tieneSubcategorias(categoria) {
  return (categoria.subcategorias?.length ?? 0) > 0
}

// ---- Activación de una categoría ----
// "Hover intent": al pasar el ratón por una fila esperamos 100 ms antes de cambiar el panel. Si el
// ratón solo pasa de largo (camino hacia el panel), no hay parpadeos.
let temporizador = null
function cancelarHover() {
  clearTimeout(temporizador)
  temporizador = null
}
function programarHover(id) {
  cancelarHover()
  if (id === categoriaActivaId.value) return
  temporizador = setTimeout(() => {
    categoriaElegidaId.value = id
    temporizador = null
  }, 100)
}
function activar(id) {
  cancelarHover()
  categoriaElegidaId.value = id
}
// Limpiamos el temporizador si el componente se destruye (evita que se ejecute "en el vacío").
onBeforeUnmount(cancelarHover)

// ---- Elegir "Ver todo" o una subcategoría ----
// Los medicamentos todavía NO tienen subcategoría, así que de momento se aplica el filtro de la
// categoría PADRE. En el futuro (con la API FastAPI) cada subcategoría podrá filtrar por sí misma.
// La navegación a 'inicio' la hace el propio <RouterLink :to="{ name: 'inicio' }"> al hacer clic.
function elegir(idCategoria) {
  seleccionarCategoria(idCategoria)
  emit('cerrar')
}

// ---- Foco y teclado ----
function filas() {
  return Array.from(mega.value?.querySelectorAll('.menu__categoria') ?? [])
}
function enfocarFila(id) {
  filas()
    .find((fila) => fila.dataset.categoria === id)
    ?.focus()
}
function enfocarPrimerEnlaceDelPanel() {
  mega.value?.querySelector('.menu__contenido a')?.focus()
}

// Al abrir (clic o teclado) el foco pasa a la fila activa. Esperamos a nextTick porque el panel
// se crea con v-if y todavía no existe en el DOM cuando cambia la prop.
watch(
  () => props.abierto,
  async (abierto) => {
    if (abierto) {
      await nextTick()
      enfocarFila(categoriaActivaId.value)
    } else {
      cancelarHover()
    }
  },
)

// Un solo manejador de teclado en el <nav> (event delegation): el evento "sube" desde el elemento
// con foco y aquí miramos de dónde viene.
function alPulsarTecla(evento) {
  const fila = evento.target.closest('.menu__categoria')
  const enPanel = evento.target.closest('.menu__contenido')

  if (fila) {
    const lista = filas()
    const indice = lista.indexOf(fila)
    if (evento.key === 'ArrowDown') {
      evento.preventDefault() // evita que la página haga scroll
      lista[(indice + 1) % lista.length].focus()
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      lista[(indice - 1 + lista.length) % lista.length].focus()
    } else if (evento.key === 'ArrowRight') {
      const categoria = categorias.value.find((c) => c.id === fila.dataset.categoria)
      if (categoria && tieneSubcategorias(categoria)) {
        evento.preventDefault()
        activar(categoria.id)
        // El panel se vuelve a dibujar con la nueva categoría: esperamos antes de enfocar su enlace.
        nextTick(enfocarPrimerEnlaceDelPanel)
      }
    } else if (evento.key === 'Escape') {
      emit('cerrar') // la cabecera devuelve el foco al botón naranja
    }
  } else if (enPanel) {
    if (evento.key === 'ArrowLeft' || evento.key === 'Escape') {
      evento.preventDefault()
      enfocarFila(categoriaActivaId.value)
    }
  } else if (evento.key === 'Escape') {
    emit('cerrar') // foco en el propio <nav> (tras un clic en una zona vacía): Esc cierra
  }
}

// Si el foco sale del menú por completo, lo cerramos. `relatedTarget` es el elemento que RECIBE el foco.
// Excepción: el botón naranja (el que tiene aria-controls="menu-escritorio"), porque su propio clic
// ya se encarga de abrir/cerrar y no queremos que se pisen.
// Otra excepción: si `relatedTarget` es null puede ser que Vue esté quitando del DOM el enlace que
// tenía el foco (el hover cambió de categoría y se repinta la lista). Chrome lanza `focusout` ANTES
// de quitarlo, así que esperamos un instante (setTimeout) y miramos qué pasó: si el elemento ya no
// existe, no cerramos y devolvemos el foco a la fila activa; si la ventana perdió el foco, cerramos.
function alPerderFoco(evento) {
  const destino = evento.relatedTarget
  if (destino && mega.value?.contains(destino)) return
  if (destino?.closest?.('[aria-controls="menu-escritorio"]')) return
  if (!destino) {
    const elemento = evento.target
    setTimeout(() => {
      if (!mega.value) return // el menú ya se cerró por otro camino
      if (mega.value.contains(document.activeElement)) return // el foco volvió dentro
      if (!elemento.isConnected && document.hasFocus()) {
        enfocarFila(categoriaActivaId.value) // se repintó la lista: no dejamos el foco en <body>
        return
      }
      emit('cerrar', { devolverFoco: false }) // la ventana perdió el foco (p. ej. Alt-Tab)
    }, 0)
    return
  }
  emit('cerrar', { devolverFoco: false }) // el foco ya se fue a otro sitio: que no se lo quiten
}
</script>

<template>
  <!-- Un único v-if raíz: si no está abierto, ni el fondo ni el panel existen en el DOM (sin foco). -->
  <div v-if="abierto" class="menu">
    <!-- Fondo (overlay): un clic fuera del panel cierra. Es decorativo para lectores y sin tabindex:
         el teclado se cierra con Esc. -->
    <div class="menu__fondo" aria-hidden="true" @click="emit('cerrar')"></div>

    <!-- tabindex="-1": al hacer clic en una zona sin enlaces (p. ej. el título) el foco se queda en el
         propio <nav> y NO se considera "salir del menú" (si no, el menú se cerraría solo). No entra en el orden de Tab. -->
    <nav
      id="menu-escritorio"
      ref="mega"
      class="menu__mega"
      aria-label="Categorías de medicamentos"
      tabindex="-1"
      @keydown="alPulsarTecla"
      @focusout="alPerderFoco"
    >
      <!-- Zona izquierda: lista de categorías -->
      <ul class="menu__categorias">
        <li v-for="categoria in categorias" :key="categoria.id" class="menu__categorias-item">
          <button
            type="button"
            class="menu__categoria"
            :class="{
              'menu__categoria--activa': categoria.id === categoriaActivaId,
              'menu__categoria--sin-sub': !tieneSubcategorias(categoria),
            }"
            :data-categoria="categoria.id"
            aria-controls="menu-panel"
            :aria-expanded="tieneSubcategorias(categoria) ? categoria.id === categoriaActivaId : undefined"
            @click="activar(categoria.id)"
            @mouseenter="programarHover(categoria.id)"
            @mouseleave="cancelarHover"
          >
            <span class="menu__categoria-icono"><IconoCategoria :categoria="categoria.id" /></span>
            <span class="menu__categoria-texto">{{ categoria.nombre }}</span>
            <!-- Chevron ">" solo si hay subcategorías -->
            <span v-if="tieneSubcategorias(categoria)" class="menu__categoria-flecha" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>
        </li>
      </ul>

      <!-- Zona derecha: título + "Ver todo" + subcategorías de la categoría activa -->
      <div id="menu-panel" class="menu__contenido" role="region" aria-labelledby="menu-panel-titulo">
        <div class="menu__contenido-cabecera">
          <span class="menu__contenido-icono"><IconoCategoria :categoria="categoriaActiva?.id" /></span>
          <h2 id="menu-panel-titulo" class="menu__contenido-titulo">{{ categoriaActiva?.nombre }}</h2>
          <RouterLink
            class="menu__ver-todo"
            :to="{ name: 'inicio' }"
            @click="elegir(categoriaActiva.id)"
          >
            Ver todo<span class="fa-visualmente-oculto"> en {{ categoriaActiva?.nombre }}</span>
          </RouterLink>
        </div>

        <ul v-if="subcategorias.length > 0" class="menu__subcategorias">
          <li v-for="sub in subcategorias" :key="sub.id" class="menu__subcategoria">
            <RouterLink
              class="menu__subcategoria-enlace"
              :to="{ name: 'inicio' }"
              @click="elegir(categoriaActiva.id)"
            >
              {{ sub.nombre }}
            </RouterLink>
          </li>
        </ul>
        <p v-else class="menu__vacio">Esta categoría aún no tiene subcategorías.</p>
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* "scoped": Vue marca cada elemento de ESTE componente con un atributo data-v-xxxx y añade ese
   atributo a cada regla, así estos estilos no se "escapan" al resto de la página. */

/* ---- Contenedor y fondo oscuro ----
   .menu es el hijo de <header class="cabecera"> (que tiene position: relative/sticky).
   position:absolute + top:100% = "colócate justo debajo del borde inferior de la cabecera".
   left/right: 0 = ocupa todo el ancho de la cabecera, o sea, de la ventana. */
.menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1; /* dentro de la cabecera (que ya tiene z-index 100): por encima del contenido de la página */
}

/* Fondo (overlay) que oscurece la página de abajo. position:fixed con top:auto lo deja en la
   posición donde "caería" normalmente (justo debajo de la cabecera, así NO tapa la barra blanca),
   y como es fixed no alarga el scroll de la página. Mide el alto de la ventana (100dvh). */
.menu__fondo {
  position: fixed;
  top: auto;
  left: 0;
  right: 0;
  height: 100vh;
  height: 100dvh;
  background: var(--fa-fondo-overlay);
}

/* ---- Panel blanco a todo el ancho ----
   Rejilla de 2 columnas: [categorías] [contenido]. El padding lateral alinea el contenido con
   el resto de la página: en pantallas más anchas que --fa-ancho-max suma el margen sobrante
   ((100% - ancho-max) / 2). max() elige el mayor de los dos valores. */
.menu__mega {
  position: relative; /* para quedar por encima del .menu__fondo */
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  padding-inline: max(var(--fa-espacio-4), calc((100% - var(--fa-ancho-max)) / 2 + var(--fa-espacio-4)));
  background: var(--fa-fondo-superficie);
  border-top: 1px solid var(--fa-borde);
  border-radius: 0 0 var(--fa-radio) var(--fa-radio);
  box-shadow: var(--fa-sombra-megamenu);
  /* Si la ventana es baja, el panel hace scroll por dentro en vez de salirse de la pantalla. */
  max-height: calc(100vh - var(--fa-alto-cabecera) - var(--fa-espacio-4));
  max-height: calc(100dvh - var(--fa-alto-cabecera) - var(--fa-espacio-4));
  overflow-y: auto;
  overscroll-behavior: contain; /* el scroll del panel no arrastra la página de atrás */
  animation: menu-aparecer 0.15s ease-out;
}
/* El <nav> tiene tabindex="-1" solo para recibir foco por programa: no necesita aro de foco. */
.menu__mega:focus,
.menu__mega:focus-visible {
  outline: none;
}
@keyframes menu-aparecer {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ---- Columna izquierda: lista de categorías ---- */
.menu__categorias {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-1);
  margin: 0;
  padding: var(--fa-espacio-4) var(--fa-espacio-3) var(--fa-espacio-4) 0;
  list-style: none;
  border-right: 1px solid var(--fa-borde); /* línea gris que separa las dos zonas */
}
.menu__categorias-item {
  margin: 0;
}

/* Fila de categoría: es un <button>, así que anulamos el aspecto nativo. 56px de alto. */
.menu__categoria {
  display: flex;
  align-items: center;
  gap: var(--fa-espacio-3);
  width: 100%;
  min-height: 56px;
  padding: var(--fa-espacio-2) var(--fa-espacio-3);
  font: inherit;
  font-weight: 600;
  line-height: 1.3;
  text-align: left;
  color: var(--fa-color-texto); /* #1f2933 sobre blanco: ~14:1 */
  background: transparent;
  border: 0;
  border-radius: var(--fa-radio-sm);
  cursor: pointer;
  transition: none;
}
.menu__categoria-icono {
  display: inline-flex;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: var(--fa-color-primario); /* icono verde: 5,4:1 sobre blanco */
}
.menu__categoria-texto {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.menu__categoria-flecha {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--fa-color-texto-suave);
}

/* Al pasar el ratón / teclado: fondo verde clarito + texto verde muy oscuro (~12:1). */
.menu__categoria:hover {
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-color-marca-suave);
}
/* Fila ACTIVA: verde sólido con texto, icono y chevron blancos (5,4:1). Va después de :hover
   para ganar cuando ambos coinciden. La diferencia no depende solo del color: también es
   más "pesada" (fondo sólido) y el chevron apunta a su panel. */
.menu__categoria--activa,
.menu__categoria--activa:hover {
  color: #ffffff;
  background: var(--fa-color-primario);
}
.menu__categoria--activa .menu__categoria-icono,
.menu__categoria--activa .menu__categoria-flecha {
  color: #ffffff;
}
/* Foco de teclado DENTRO de la fila (offset negativo) para que el scroll del panel no lo recorte.
   Azul sobre filas claras (#0a5cad sobre blanco ~7:1)... */
.menu__categoria:focus-visible {
  outline: 3px solid var(--fa-color-foco);
  outline-offset: -3px;
}
/* ...y blanco sobre la fila verde (el azul sobre verde apenas se distinguiría). */
.menu__categoria--activa:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: -5px;
}
/* Categoría sin subcategorías (--sin-sub): no lleva chevron; por lo demás se ve igual que las otras,
   así que no necesita reglas propias (el panel derecho muestra el mensaje de .menu__vacio). */

/* ---- Columna derecha: título + subcategorías ---- */
.menu__contenido {
  min-width: 0; /* permite que la rejilla se encoja en vez de ensanchar el panel */
  padding: var(--fa-espacio-4) 0 var(--fa-espacio-4) var(--fa-espacio-5);
}
.menu__contenido-cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--fa-espacio-3);
  margin-bottom: var(--fa-espacio-4);
  padding-bottom: var(--fa-espacio-3);
  border-bottom: 1px solid var(--fa-borde); /* el divisor gris bajo el título */
}
.menu__contenido-icono {
  display: inline-flex;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  color: var(--fa-color-primario);
}
.menu__contenido-titulo {
  margin: 0;
  font-family: var(--fa-fuente-titulos);
  font-size: var(--fa-texto-2xl); /* 32px: texto grande */
  font-weight: 700;
  line-height: 1.2;
  color: var(--fa-color-primario);
}

/* "Ver todo": <a> (RouterLink) con aspecto de botón de contorno. Reescribimos color, fondo,
   padding y transición porque el estilo global de "a" (main.css) los pone por su cuenta. */
.menu__ver-todo {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  margin-left: auto; /* se va al extremo derecho de la cabecera del panel */
  padding: 0 var(--fa-espacio-4);
  font-weight: 700;
  color: var(--fa-color-primario);
  background: transparent;
  border: 2px solid var(--fa-color-primario);
  border-radius: var(--fa-radio-pildora);
  text-decoration: none;
  transition: none;
}
.menu__ver-todo:hover {
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-color-marca-suave);
  border-color: var(--fa-color-primario-oscuro);
}

/* Rejilla de subcategorías: 2 columnas desde 1024px, 3 desde 1200px (ver media query abajo). */
.menu__subcategorias {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--fa-espacio-1) var(--fa-espacio-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.menu__subcategoria {
  margin: 0;
}
.menu__subcategoria-enlace {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: var(--fa-espacio-2) var(--fa-espacio-3);
  color: var(--fa-color-texto);
  background: transparent;
  border-radius: var(--fa-radio-sm);
  text-decoration: none;
  overflow-wrap: anywhere;
  transition: none;
}
/* El hover no se apoya solo en el color: añadimos subrayado. */
.menu__subcategoria-enlace:hover {
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-color-marca-suave);
  text-decoration: underline;
}
.menu__subcategoria-enlace:focus-visible,
.menu__ver-todo:focus-visible {
  outline: 3px solid var(--fa-color-foco);
  outline-offset: 2px;
}

.menu__vacio {
  margin: 0;
  padding: var(--fa-espacio-3);
  color: var(--fa-color-texto-suave); /* 7:1 sobre blanco */
  background: var(--fa-fondo-pagina);
  border-radius: var(--fa-radio-sm);
}

/* ---- Pantallas desde 1200px: más sitio => 3 columnas de subcategorías y columna izquierda algo más ancha ---- */
@media (min-width: 1200px) {
  .menu__mega {
    grid-template-columns: 340px minmax(0, 1fr);
  }
  .menu__subcategorias {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Quien pide "menos movimiento" no ve la aparición con fundido ni ninguna transición. */
@media (prefers-reduced-motion: reduce) {
  .menu__mega {
    animation: none;
  }
  .menu__categoria,
  .menu__ver-todo,
  .menu__subcategoria-enlace {
    transition: none;
  }
}
</style>
