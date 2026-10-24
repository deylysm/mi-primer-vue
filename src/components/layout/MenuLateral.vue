<!--
  MenuLateral.vue  (src/components/layout/)
  Qué es: el menú desplegable (cajón lateral) que se abre con el botón hamburguesa naranja en
  móvil y tablet (< 1024px; en escritorio se usa el mega-menú MenuEscritorio.vue). Contiene Inicio,
  Categorías, Carrito e "Identifícate" (próximamente).
  Cada categoría con subcategorías es un ACORDEÓN: al tocarla se despliega su sublista
  ("Ver todo en ..." + subcategorías) y solo puede haber una abierta a la vez.
  Quién lo usa: CabeceraTienda.vue (le pasa `abierto` y escucha `cerrar`).

  Cómo funciona: usa el elemento HTML nativo <dialog>. Al llamar a showModal() el NAVEGADOR se encarga de:
    - atrapar el foco dentro del menú (Tab no sale a la página de atrás),
    - cerrar con la tecla Esc,
    - dejar inerte (sin clic ni teclado) el resto de la página,
    - devolver el foco al botón que lo abrió al cerrarse.
  Nosotros añadimos: cerrar al pulsar fuera del panel, cerrar al elegir una opción y bloquear el
  scroll de la página mientras está abierto.

  Props:  abierto (Boolean) -> true muestra el menú, false lo oculta.   id (String) -> id del <dialog>.
  Emits:  cerrar -> el menú pide al padre ponerse en cerrado (Esc, "Cerrar", clic fuera, elegir opción).
-->
<script setup>
// 'vue' y 'vue-router' son paquetes instalados en node_modules.
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
// Archivos locales de FarmaApp (alias @ -> src/).
import { categorias } from '@/mocks/categorias.mock.js'
import { useBusquedaMedicamentos } from '@/composables/useBusquedaMedicamentos.js'
import { useCarrito } from '@/composables/useCarrito.js'
// Componente local (alias @ -> src/): el icono lineal de cada categoría.
import IconoCategoria from '@/components/comunes/IconoCategoria.vue'

const props = defineProps({
  abierto: { type: Boolean, default: false },
  id: { type: String, default: 'menu-lateral' },
})
const emit = defineEmits(['cerrar'])

const router = useRouter()
const { seleccionarCategoria } = useBusquedaMedicamentos()
const { totalProductos } = useCarrito()

const dialogo = ref(null) // referencia al elemento <dialog> (template ref)
// Acordeón: id de la categoría desplegada (null = ninguna). Un solo valor => solo una abierta a la vez.
const categoriaAbiertaId = ref(null)

// Abre/cierra el <dialog> nativo según la prop `abierto`.
watch(
  () => props.abierto,
  (abierto) => {
    const el = dialogo.value
    if (!el) return
    if (abierto && !el.open) el.showModal()
    if (!abierto && el.open) el.close()
    // Con el menú abierto la página de atrás no debe desplazarse.
    document.body.style.overflow = abierto ? 'hidden' : ''
  },
)

// El <dialog> avisa con el evento "close" cuando se cierra (Esc, close()...). Se lo contamos al padre.
function alCerrarse() {
  document.body.style.overflow = ''
  categoriaAbiertaId.value = null // al cerrar el cajón, el acordeón vuelve a estar todo plegado
  emit('cerrar')
}

// El menú ahora también se abre en escritorio (botón naranja "Menú de Categorías"), así que ya no
// se cierra al cambiar el ancho de la ventana. Solo devolvemos el scroll de la página al desmontar.
onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

// Elegir una categoría: la deja aplicada como filtro (sin texto de búsqueda), va al inicio y cierra.
// También se usa para "Ver todo" y para las subcategorías: los medicamentos todavía no tienen
// subcategoría, así que de momento se filtra por la categoría PADRE (en el futuro vendrá de la API).
function elegirCategoria(idCategoria) {
  seleccionarCategoria(idCategoria)
  router.push({ name: 'inicio' })
  emit('cerrar')
}

// `?.` y `?? 0` toleran una categoría sin `subcategorias` (ausente o vacío).
function tieneSubcategorias(categoria) {
  return (categoria.subcategorias?.length ?? 0) > 0
}

// Abre o cierra el acordeón de una categoría. Si ya estaba abierta se pliega; si no, pasa a ser la
// única abierta (la anterior se pliega sola porque solo guardamos UN id).
async function alternarAcordeon(idCategoria, evento) {
  const grupo = evento.currentTarget.closest('li') // <li> con el botón y su sublista
  const abrir = categoriaAbiertaId.value !== idCategoria
  categoriaAbiertaId.value = abrir ? idCategoria : null
  if (abrir) {
    await nextTick() // esperamos a que la sublista ya esté visible en el DOM
    grupo?.scrollIntoView({ block: 'nearest' }) // si queda cortada, desplaza solo lo necesario
  }
}
</script>

<template>
  <!-- @click.self: solo reacciona si el clic fue en el propio <dialog> (la zona oscura de fuera del
       panel), no en sus hijos. -->
  <dialog
    :id="id"
    ref="dialogo"
    class="menu"
    aria-labelledby="menu-titulo"
    @close="alCerrarse"
    @click.self="emit('cerrar')"
  >
    <div class="menu__panel">
      <!-- Encabezado fijo (no se desplaza): franja verde de marca con el título y el botón Cerrar -->
      <div class="menu__encabezado">
        <h2 id="menu-titulo" class="menu__titulo">Menú</h2>
        <button class="menu__cerrar" type="button" @click="emit('cerrar')">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          Cerrar
        </button>
      </div>

      <!-- Solo esta zona hace scroll si las categorías no caben en pantalla -->
      <nav class="menu__nav" aria-label="Menú principal">
        <ul class="menu__lista">
          <li>
            <RouterLink class="menu__enlace" :to="{ name: 'inicio' }" @click="emit('cerrar')">
              <span class="menu__icono menu__icono--simple" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
                  <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
                </svg>
              </span>
              <span class="menu__texto">Inicio</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink class="menu__enlace" :to="{ name: 'carrito' }" @click="emit('cerrar')">
              <span class="menu__icono menu__icono--simple" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
                  <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              </span>
              <span class="menu__texto">Carrito</span>
              <span v-if="totalProductos > 0" class="menu__contador">
                {{ totalProductos }}<span class="fa-visualmente-oculto"> productos</span>
              </span>
            </RouterLink>
          </li>
        </ul>

        <h3 class="menu__subtitulo" id="menu-categorias">Categorías</h3>
        <ul class="menu__lista" aria-labelledby="menu-categorias">
          <li v-for="categoria in categorias" :key="categoria.id">
            <!-- Con subcategorías: botón-acordeón (aria-expanded dice si está abierto; aria-controls
                 apunta al id de su sublista, único por categoría). -->
            <template v-if="tieneSubcategorias(categoria)">
              <button
                class="menu__enlace menu__enlace--acordeon"
                :class="{ 'menu__enlace--abierto': categoriaAbiertaId === categoria.id }"
                type="button"
                :aria-expanded="categoriaAbiertaId === categoria.id"
                :aria-controls="`menu-sub-${categoria.id}`"
                @click="alternarAcordeon(categoria.id, $event)"
              >
                <!-- Icono lineal de la categoría (decorativo: el nombre ya está como texto) -->
                <span class="menu__icono menu__icono--categoria"><IconoCategoria :categoria="categoria.id" /></span>
                <span class="menu__texto">{{ categoria.nombre }}</span>
                <span class="menu__flecha" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </button>
              <!-- Sublista justo después del botón. v-show la oculta con display:none (no se enfoca ni se lee). -->
              <ul
                v-show="categoriaAbiertaId === categoria.id"
                :id="`menu-sub-${categoria.id}`"
                class="menu__sublista"
              >
                <li>
                  <button
                    class="menu__subenlace menu__subenlace--todo"
                    type="button"
                    @click="elegirCategoria(categoria.id)"
                  >
                    Ver todo en {{ categoria.nombre }}
                  </button>
                </li>
                <li v-for="sub in categoria.subcategorias" :key="sub.id">
                  <button class="menu__subenlace" type="button" @click="elegirCategoria(categoria.id)">
                    {{ sub.nombre }}
                  </button>
                </li>
              </ul>
            </template>

            <!-- Sin subcategorías: se comporta como antes (filtra, va al inicio y cierra) -->
            <button v-else class="menu__enlace" type="button" @click="elegirCategoria(categoria.id)">
              <span class="menu__icono menu__icono--categoria"><IconoCategoria :categoria="categoria.id" /></span>
              <span class="menu__texto">{{ categoria.nombre }}</span>
            </button>
          </li>
        </ul>

        <ul class="menu__lista menu__lista--aparte">
          <li>
            <!-- Aún no existe el inicio de sesión: botón visible pero desactivado, con la razón a la vista. -->
            <button class="menu__enlace menu__enlace--desactivado" type="button" disabled>
              <span class="menu__icono menu__icono--simple" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                </svg>
              </span>
              <span class="menu__texto">Identifícate</span>
              <span class="menu__etiqueta">Próximamente</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </dialog>
</template>

<style scoped>
/* El <dialog> ocupa TODA la pantalla y es transparente; el "panel" blanco va a la izquierda.
   Así un clic fuera del panel cae sobre el <dialog> mismo (lo detecta @click.self). */
.menu {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--fa-color-texto);
  overflow: hidden; /* el panel está fuera de pantalla antes de entrar: no debe crear scroll */
  /* Truco para animar también la SALIDA: un <dialog> cerrado pasa a display:none al instante.
     Con "display ... allow-discrete" el navegador lo mantiene visible mientras dura la transición. */
  transition:
    display 0.25s allow-discrete,
    overlay 0.25s allow-discrete;
}
/* El navegador pinta la capa oscura con ::backdrop. Más oscura que antes (0.55 -> 0.6) para
   separar bien el menú del contenido. Aparece con un fundido (opacity). */
.menu::backdrop {
  background: rgba(4, 36, 20, 0.6);
  opacity: 0;
  transition:
    opacity 0.25s ease,
    display 0.25s allow-discrete,
    overlay 0.25s allow-discrete;
}
.menu[open]::backdrop {
  opacity: 1;
}

/* Panel: cajón lateral. Cerrado está desplazado fuera de la pantalla (translateX(-100%));
   abierto vuelve a su sitio y la transición lo hace deslizar. */
.menu__panel {
  display: flex;
  flex-direction: column;
  width: min(360px, 88vw);
  height: 100%;
  overflow: hidden; /* el scroll lo hace .menu__nav; el encabezado queda fijo */
  background: var(--fa-fondo-superficie);
  border-radius: 0 var(--fa-radio) var(--fa-radio) 0;
  box-shadow: 8px 0 32px rgba(4, 36, 20, 0.35);
  transform: translateX(-100%);
  transition: transform 0.25s ease-out;
}
.menu[open] .menu__panel {
  transform: none;
}
/* @starting-style = "estado de partida" al abrir: sin esto el panel aparecería ya colocado,
   sin deslizar (el <dialog> pasa de display:none a visible en el mismo instante). */
@starting-style {
  .menu[open] .menu__panel {
    transform: translateX(-100%);
  }
  .menu[open]::backdrop {
    opacity: 0;
  }
}
/* Quien pide "menos movimiento" (ajuste del sistema) ve el menú aparecer y desaparecer sin animar.
   Va aquí dentro porque el <dialog> vive en la "capa superior" del navegador y la regla global
   de farmaapp.css (.fa-app *) no llega al ::backdrop. */
@media (prefers-reduced-motion: reduce) {
  .menu,
  .menu::backdrop,
  .menu__panel,
  .menu__flecha,
  .menu__enlace,
  .menu__subenlace {
    transition: none; /* (el giro del chevron es instantáneo: no es una animación) */
  }
}

/* Encabezado: franja verde oscuro (blanco sobre #064e24 = contraste 10,5:1) */
.menu__encabezado {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--fa-espacio-3);
  min-height: 4rem;
  padding: var(--fa-espacio-2) var(--fa-espacio-3);
  color: #ffffff;
  background: var(--fa-color-primario-oscuro);
}
.menu__titulo,
.menu__subtitulo {
  margin: 0;
  font-family: var(--fa-fuente-titulos);
}
.menu__titulo {
  font-size: var(--fa-texto-xl);
  color: #ffffff;
}
/* "Categorías": rótulo de sección en mayúsculas pequeñas; separa visualmente los grupos */
.menu__subtitulo {
  margin-top: var(--fa-espacio-3);
  padding: var(--fa-espacio-2) var(--fa-espacio-2) var(--fa-espacio-1);
  font-size: var(--fa-texto-sm);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--fa-color-texto-suave);
  border-top: 1px solid var(--fa-borde);
}
.menu__cerrar {
  display: inline-flex;
  align-items: center;
  gap: var(--fa-espacio-1);
  min-height: var(--fa-tactil-min);
  padding: 0 var(--fa-espacio-3);
  font: inherit;
  font-weight: 600;
  color: #ffffff;
  background: transparent;
  border: 1px solid #ffffff;
  border-radius: var(--fa-radio-pildora);
  cursor: pointer;
  transition: none;
}
.menu__cerrar svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
}
.menu__cerrar:hover {
  color: var(--fa-color-primario-oscuro);
  background: #ffffff;
}
/* Sobre fondo verde oscuro el aro azul global tiene poco contraste: usamos un aro blanco con
   un borde exterior azul-claro para que se vea en cualquier fondo. */
.menu__cerrar:focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
  box-shadow: 0 0 0 6px var(--fa-color-foco);
}

.menu__nav {
  flex: 1;
  min-height: 0; /* imprescindible para que un hijo flex pueda hacer scroll */
  padding: var(--fa-espacio-2) var(--fa-espacio-2) var(--fa-espacio-4);
  overflow-y: auto;
  overscroll-behavior: contain; /* el scroll del menú no "arrastra" la página de atrás */
}
.menu__lista {
  margin: 0;
  padding: 0;
  list-style: none;
}
.menu__lista--aparte {
  margin-top: var(--fa-espacio-3);
  padding-top: var(--fa-espacio-2);
  border-top: 1px solid var(--fa-borde);
}

/* Opción del menú: vale para <a> (RouterLink) y <button>. Anula el estilo global de "a"
   (padding 3px, fondo verde al pasar el ratón...) y los estilos por defecto del botón. */
.menu__enlace {
  display: flex;
  align-items: center;
  gap: var(--fa-espacio-2);
  width: 100%;
  min-height: 52px; /* >= 44px táctiles; 52px da aire al icono de 40px */
  padding: var(--fa-espacio-1) var(--fa-espacio-2);
  font: inherit;
  font-size: var(--fa-texto-base);
  text-align: left;
  color: var(--fa-color-texto);
  background: transparent;
  border: 0;
  border-radius: var(--fa-radio-sm);
  text-decoration: none;
  cursor: pointer;
  transition: none;
}
.menu__enlace:hover {
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-color-marca-suave);
}
/* Página actual (RouterLink añade esta clase solo en la ruta exacta): fondo suave + barra a la izquierda.
   No dependemos solo del color: la negrita y la barra lo indican también. */
.menu__enlace.router-link-exact-active {
  font-weight: 700;
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-color-marca-suave);
  box-shadow: inset 4px 0 0 var(--fa-color-primario);
}

/* Caja del icono (40x40): en las categorías contiene la ilustración; en Inicio/Carrito/Identifícate un
   icono lineal verde sobre fondo suave. */
.menu__icono {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}
.menu__icono--simple {
  color: var(--fa-color-primario);
  background: var(--fa-color-marca-suave);
  border-radius: var(--fa-radio-sm);
}
.menu__icono--simple svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* :deep() = "atraviesa" el scoped para tocar el interior del componente hijo ImagenCategoria.
   Reducimos su tamaño 'sm' (48px) a 40px para que quepa en la fila. */
.menu__icono :deep(.imagen-categoria) {
  width: 40px;
  height: 40px;
  padding: 3px;
  border-radius: var(--fa-radio-sm);
}
/* Icono lineal de categoría (IconoCategoria): mismo aspecto que los iconos simples. */
.menu__icono--categoria {
  box-sizing: border-box;
  padding: 8px;
  color: var(--fa-color-primario);
  background: var(--fa-color-marca-suave);
  border-radius: var(--fa-radio-sm);
}
/* ---- Acordeón de categorías ----
   El botón reutiliza .menu__enlace (52px de alto); aquí solo se añade lo propio del acordeón. */
.menu__enlace--acordeon {
  font-weight: 600;
}
/* Abierto (clase que pone el script con aria-expanded="true"): fondo suave + texto verde oscuro
   (~12:1) + negrita. El chevron girado indica el estado sin depender solo del color. */
.menu__enlace--abierto,
.menu__enlace--abierto:hover {
  font-weight: 700;
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-color-marca-suave);
}
/* Chevron: a la derecha del texto (el .menu__texto con flex:1 lo empuja). Gira 180° al abrir. */
.menu__flecha {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--fa-color-texto-suave); /* 7:1 sobre blanco; sobre el fondo suave sigue > 5:1 */
  transition: none;
}
.menu__enlace--abierto .menu__flecha {
  color: var(--fa-color-primario-oscuro);
  transform: rotate(180deg); /* chevron hacia arriba cuando está abierto */
}
/* Sublista: sangrada bajo el icono, con una línea vertical gris a la izquierda que muestra que
   pertenece a la categoría de arriba. 28px = 8px de padding del botón + mitad del icono (20px). */
.menu__sublista {
  margin: var(--fa-espacio-1) 0 var(--fa-espacio-2) 28px;
  padding: 0 0 0 var(--fa-espacio-3);
  list-style: none;
  border-left: 2px solid var(--fa-borde);
}
/* Subopciones: <button> de 48px de alto (>= 44px), a todo el ancho, sin aspecto nativo. */
.menu__subenlace {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding: var(--fa-espacio-2);
  font: inherit;
  line-height: 1.3;
  text-align: left;
  color: var(--fa-color-texto);
  background: transparent;
  border: 0;
  border-radius: var(--fa-radio-sm);
  cursor: pointer;
  transition: none;
  overflow-wrap: anywhere;
}
.menu__subenlace:hover {
  color: var(--fa-color-primario-oscuro);
  background: var(--fa-color-marca-suave);
}
/* "Ver todo en ...": primera opción, en negrita y verde (#0b7a38 sobre blanco 5,4:1). */
.menu__subenlace--todo {
  font-weight: 700;
  color: var(--fa-color-primario);
}
.menu__subenlace--todo:hover {
  color: var(--fa-color-primario-oscuro);
}
/* Foco del teclado explícito (azul 3px sobre fondo claro; el cajón ya es blanco). */
.menu__enlace:focus-visible,
.menu__subenlace:focus-visible {
  outline: 3px solid var(--fa-color-foco);
  outline-offset: 2px;
}
/* El texto ocupa el espacio sobrante y empuja contador/etiqueta a la derecha */
.menu__texto {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.menu__enlace--desactivado,
.menu__enlace--desactivado:hover {
  color: var(--fa-color-texto-suave); /* #52606d sobre blanco = 6,9:1 */
  background: transparent;
  cursor: not-allowed;
}
.menu__enlace--desactivado .menu__icono--simple {
  color: var(--fa-color-texto-suave);
  background: var(--fa-fondo-pagina);
}
.menu__etiqueta {
  padding: 2px var(--fa-espacio-2);
  font-size: var(--fa-texto-sm);
  font-weight: 600;
  color: var(--fa-color-texto-suave);
  background: var(--fa-fondo-pagina);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio-pildora);
}
/* Contador del carrito: blanco sobre rojo #b3261e = 6,5:1 */
.menu__contador {
  min-width: 24px;
  padding: 0 var(--fa-espacio-2);
  font-size: var(--fa-texto-sm);
  font-weight: 700;
  line-height: 24px;
  text-align: center;
  color: #ffffff;
  background: var(--fa-color-error);
  border-radius: var(--fa-radio-pildora);
}
</style>
