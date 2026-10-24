<script setup>
// Vista principal: une la lógica (composable) con los componentes de búsqueda.

// Estilos globales de FarmaApp (tokens --fa-*). Ruta con alias @ -> src/.
// Vite los inyecta en la página al importarlos.
import '@/assets/farmaapp.css'

// Archivos locales de FarmaApp (alias @ -> src/).
import { useBusquedaMedicamentos, MIN_CARACTERES } from '@/composables/useBusquedaMedicamentos.js'
// Componentes NUEVOS de diseño (carpeta layout): cabecera de tienda y pie de página.
import CabeceraTienda from '@/components/layout/CabeceraTienda.vue'
import PieTienda from '@/components/layout/PieTienda.vue'
import BarraBusqueda from '@/components/busqueda/BarraBusqueda.vue'
import FiltrosBusqueda from '@/components/busqueda/FiltrosBusqueda.vue'
import ListaResultados from '@/components/busqueda/ListaResultados.vue'
import EstadoCarga from '@/components/busqueda/EstadoCarga.vue'
import EstadoVacio from '@/components/busqueda/EstadoVacio.vue'
import EstadoError from '@/components/busqueda/EstadoError.vue'

// El composable devuelve refs reactivas; al usarlas en el template Vue las "desenvuelve".
// `filtros` es reactive: FiltrosBusqueda lo muta directamente a propósito.
const {
  termino,
  filtros,
  resultados,
  terminoBuscado,
  farmacias,
  error,
  estado,
  actualizando,
  faltanCaracteres,
  buscarAhora,
  reintentar,
  limpiarFiltros,
} = useBusquedaMedicamentos()
</script>

<template>
  <div class="fa-app">
    <a class="fa-saltar-contenido" href="#contenido">Saltar al contenido</a>

    <!-- CabeceraTienda dibuja logo, iconos decorativos y franja verde.
         Lo que ponemos entre sus etiquetas (la barra de búsqueda) entra por su <slot />. -->
    <CabeceraTienda>
      <BarraBusqueda
        v-model="termino"
        :faltan-caracteres="faltanCaracteres"
        :min-caracteres="MIN_CARACTERES"
        @buscar="buscarAhora"
      />
    </CabeceraTienda>

    <!-- Banner promocional hecho solo con CSS (degradado verde + círculos), sin imágenes. -->
    <section class="banner" aria-labelledby="titulo-banner">
      <div class="banner__interior fa-contenedor">
        <h1 id="titulo-banner" class="banner__titulo">Encuentra tu medicamento al mejor precio</h1>
        <p class="banner__texto">Compara precios y disponibilidad en farmacias de Lima.</p>
      </div>
    </section>

    <!-- tabindex="-1": permite que el enlace "saltar" le pase el foco. -->
    <main id="contenido" class="principal fa-contenedor" tabindex="-1">
      <FiltrosBusqueda
        class="principal__filtros"
        :filtros="filtros"
        :farmacias="farmacias"
        @limpiar-filtros="limpiarFiltros"
      />

      <section class="principal__resultados" aria-labelledby="titulo-resultados">
        <h2 id="titulo-resultados" class="resultados__titulo">Resultados</h2>

        <!-- Los componentes de estado ya traen su role/aria-live: no lo repetimos aquí.
             Al recargar con resultados visibles, el bloque se atenúa (clase modificadora)
             en vez de desmontarse: así la altura no cambia y no hay saltos. -->
        <div
          class="principal__estados"
          :class="{ 'principal__estados--actualizando': actualizando }"
          :aria-busy="actualizando"
        >
          <p v-if="estado === 'inicial'" class="bienvenida">
            Escribe el nombre de un medicamento o principio activo para empezar.
          </p>
          <EstadoCarga v-else-if="estado === 'cargando'" />
          <EstadoError v-else-if="estado === 'error'" :mensaje="error" @reintentar="reintentar" />
          <EstadoVacio
            v-else-if="estado === 'sin-resultados'"
            :termino="terminoBuscado"
            @limpiar-filtros="limpiarFiltros"
          />
          <ListaResultados v-else-if="estado === 'resultados'" :resultados="resultados" />
        </div>
        <!-- Indicador solo visual: el aviso accesible lo da aria-busy del contenedor
             (un role="status" creado ya con texto no se anuncia de forma fiable).
             Posicionado en absoluto: no ocupa espacio, así no altera la altura. -->
        <span v-if="actualizando" class="resultados__actualizando">
          Actualizando…
        </span>
      </section>
    </main>

    <PieTienda />
  </div>
</template>

<style scoped>
/* "scoped": estos estilos solo afectan a ESTA vista (Vue añade un atributo data-v único). */

/* ---- Banner promocional (solo CSS) ---- */
.banner {
  position: relative;
  overflow: hidden; /* recorta los círculos decorativos: evita scroll horizontal */
  background: linear-gradient(120deg, var(--fa-color-marca-suave) 0%, #ffffff 70%);
  border-bottom: 1px solid var(--fa-borde);
}
/* Círculos decorativos con pseudo-elementos (no existen en el HTML, no los lee el lector) */
.banner::before,
.banner::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: var(--fa-color-marca);
  opacity: 0.12;
  pointer-events: none;
}
.banner::before {
  width: 220px;
  height: 220px;
  top: -90px;
  right: -60px;
}
.banner::after {
  width: 120px;
  height: 120px;
  bottom: -50px;
  right: 90px;
}
.banner__interior {
  position: relative; /* queda por encima de los círculos */
  padding-block: var(--fa-espacio-4);
}
.banner__titulo {
  margin: 0;
  max-width: 18ch;
  font-size: var(--fa-texto-xl);
  line-height: 1.2;
  /* Verde muy oscuro sobre fondo casi blanco: 9.9:1 */
  color: var(--fa-color-primario-oscuro);
  overflow-wrap: anywhere;
}
.banner__texto {
  margin: var(--fa-espacio-2) 0 0;
  max-width: 40ch;
  color: var(--fa-color-texto-suave);
}

/* ---- Zona principal ---- */
/* Móvil: una columna (filtros arriba, resultados debajo). flex:1 empuja el pie hacia abajo. */
.principal {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--fa-espacio-3);
  padding-block: var(--fa-espacio-4);
  /* El margen para no quedar tapado por la cabecera fija ya lo da
     "scroll-padding-top" en farmaapp.css (sumar otro duplicaría el desplazamiento). */
}

/* min-width: 0 evita que contenido ancho desborde la columna de la rejilla. */
.principal__resultados {
  min-width: 0;
  position: relative; /* referencia para el indicador "Actualizando…" */
}

/* Estado normal: la transición suaviza la vuelta a opacidad completa. */
.principal__estados {
  transition: opacity 0.15s ease;
}

/* Recargando con resultados a la vista: se atenúa sin cambiar el tamaño. */
.principal__estados--actualizando {
  opacity: 0.6;
  pointer-events: none;
}

/* Indicador pequeño en la esquina del título; absoluto = sin layout shift. */
.resultados__actualizando {
  position: absolute;
  top: 0;
  right: 0;
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}

/* Sin movimiento si el usuario lo pidió en su sistema. */
@media (prefers-reduced-motion: reduce) {
  .principal__estados {
    transition: none;
  }
}

.principal:focus {
  outline: none; /* el foco programático (salto) no necesita aro; los controles sí lo tienen */
}

.resultados__titulo {
  margin: 0 0 var(--fa-espacio-3);
  font-size: var(--fa-texto-lg);
  color: var(--fa-color-primario-oscuro);
}

/* Mensaje de bienvenida: tarjeta verde suave */
.bienvenida {
  margin: 0;
  padding: var(--fa-espacio-4);
  background: var(--fa-color-marca-suave);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
  color: var(--fa-color-texto);
  text-align: center;
}

/* ---- Tablet (≥640px) ---- */
@media (min-width: 640px) {
  .banner__interior {
    padding-block: var(--fa-espacio-5);
  }
  .banner__titulo {
    max-width: 24ch;
    font-size: var(--fa-texto-2xl);
  }
  .banner::before {
    width: 320px;
    height: 320px;
  }
}

/* ---- Escritorio (≥1024px): filtros laterales y resultados a la derecha ---- */
@media (min-width: 1024px) {
  .principal {
    grid-template-columns: var(--fa-ancho-filtros) minmax(0, 1fr);
    align-items: start;
    gap: var(--fa-espacio-4);
  }

  /* Filtros fijos al hacer scroll, justo debajo de la cabecera pegajosa */
  .principal__filtros {
    position: sticky;
    top: calc(var(--fa-alto-cabecera) + var(--fa-espacio-3));
  }
}
</style>
