<script setup>
// Vista del buscador (ruta "/"): une la lógica (composable) con los componentes de búsqueda.
// La cabecera, la barra de búsqueda y el pie los pone App.vue en todas las páginas;
// esta vista solo dibuja el banner y la zona de filtros + resultados.

// Archivos locales de FarmaApp (alias @ -> src/).
import {
  useBusquedaMedicamentos,
  OPCIONES_ORDEN,
  OPCIONES_MOSTRAR,
} from '@/composables/useBusquedaMedicamentos.js'
import { nombreCategoria } from '@/mocks/categorias.mock.js'
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
  orden,
  mostrar,
  resultadosVisibles,
  totalResultados,
  terminoBuscado,
  farmacias,
  marcas,
  error,
  estado,
  actualizando,
  reintentar,
  limpiarFiltros,
  quitarCategoria,
} = useBusquedaMedicamentos()
</script>

<template>
  <!-- Esta vista tiene DOS elementos raíz (banner + main): Vue 3 lo permite (fragmento).
       Los dos hijos directos de .fa-app (en App.vue) son los que reparte el flex del layout. -->

  <!-- Banner: ya no se ve (el diseño de tienda va directo a los filtros y los productos), pero el
       <h1> y su texto siguen en el HTML para lectores de pantalla y buscadores: toda página necesita
       un <h1>. Se oculta con el patrón "visualmente oculto" (ver CSS), NO con display:none. -->
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
      :marcas="marcas"
      @limpiar-filtros="limpiarFiltros"
    />

    <section class="principal__resultados" aria-labelledby="titulo-resultados">
      <!-- fa-visualmente-oculto: el título "Resultados" ya no se ve (la maqueta no lo lleva) pero
           sigue nombrando la región para lectores de pantalla (aria-labelledby). -->
      <h2 id="titulo-resultados" class="resultados__titulo fa-visualmente-oculto">Resultados</h2>

      <!-- Categoría elegida desde el menú: se muestra como "chip" con botón para quitarla. -->
      <p v-if="filtros.categoria" class="resultados__categoria">
        <span class="resultados__categoria-texto">
          Categoría: <strong>{{ nombreCategoria(filtros.categoria) }}</strong>
        </span>
        <button class="resultados__categoria-quitar" type="button" @click="quitarCategoria">
          Quitar<span class="fa-visualmente-oculto"> categoría {{ nombreCategoria(filtros.categoria) }}</span>
        </button>
      </p>

      <!-- Barra de resultados: ordenar y cuántos productos mostrar. Cada <select> tiene su <label>
           real (for + id). Cambiarlos solo reordena/recorta la lista ya cargada (sin pedir datos).
           Se pone fuera de .principal__estados para que no se atenúe ni bloquee al recargar.
           Con `:value` en cada <option>, v-model conserva el tipo (mostrar sigue siendo número). -->
      <div v-if="estado === 'resultados'" class="barra-resultados">
        <div class="barra-resultados__campo">
          <label for="fa-ordenar-resultados">Ordenar</label>
          <select id="fa-ordenar-resultados" v-model="orden">
            <option v-for="o in OPCIONES_ORDEN" :key="o.valor" :value="o.valor">{{ o.texto }}</option>
          </select>
        </div>
        <div class="barra-resultados__campo">
          <label for="fa-mostrar-resultados">Mostrar</label>
          <select id="fa-mostrar-resultados" v-model="mostrar">
            <option v-for="n in OPCIONES_MOSTRAR" :key="n" :value="n">{{ n }} productos</option>
          </select>
        </div>
      </div>

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
        <ListaResultados
          v-else-if="estado === 'resultados'"
          :resultados="resultadosVisibles"
          :total="totalResultados"
        />
      </div>
      <!-- Indicador solo visual: el aviso accesible lo da aria-busy del contenedor
           (un role="status" creado ya con texto no se anuncia de forma fiable).
           Posicionado en absoluto: no ocupa espacio, así no altera la altura. -->
      <span v-if="actualizando" class="resultados__actualizando">
        Actualizando…
      </span>
    </section>
  </main>
</template>

<style scoped>
/* "scoped": estos estilos solo afectan a ESTA vista (Vue añade un atributo data-v único). */

/* ---- Banner: oculto a la vista, disponible para lectores de pantalla ----
   Es el mismo patrón "sr-only" de .fa-visualmente-oculto (farmaapp.css): se saca de la
   pantalla (1px, recortado, posición absoluta) pero sigue en el árbol de accesibilidad.
   Se repite aquí para que sea explícito que ESTA sección ya no se dibuja. */
.banner {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
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

/* Chip de la categoría activa: píldora verde suave con el botón "Quitar" */
/* Texto y "Quitar" forman UNA sola píldora (el chip), con el botón al final separado por una línea.
   #064e24 sobre #e6f6ec = 8,9:1. width:fit-content = el chip mide lo que mide su contenido. */
.resultados__categoria {
  display: flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  margin: 0 0 var(--fa-espacio-3);
  padding-left: var(--fa-espacio-3);
  background: var(--fa-color-marca-suave);
  border: 1px solid var(--fa-color-primario);
  border-radius: var(--fa-radio-pildora);
}
.resultados__categoria-texto {
  min-width: 0;
  padding-block: var(--fa-espacio-1);
  color: var(--fa-color-primario-oscuro);
  overflow-wrap: anywhere;
}
.resultados__categoria-quitar {
  flex-shrink: 0;
  min-height: var(--fa-tactil-min);
  margin-left: var(--fa-espacio-2);
  padding: 0 var(--fa-espacio-3);
  font: inherit;
  font-weight: 700;
  color: var(--fa-color-primario-oscuro);
  text-decoration: underline;
  background: transparent;
  border: 0;
  border-left: 1px solid var(--fa-color-primario);
  border-radius: 0 var(--fa-radio-pildora) var(--fa-radio-pildora) 0;
  cursor: pointer;
}
.resultados__categoria-quitar:hover {
  background: #cdebd8; /* un tono más oscuro que el fondo del chip */
}

/* Barra de resultados: "Ordenar" y "Mostrar" en una fila que pasa a otra línea si no caben */
.barra-resultados {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fa-espacio-2) var(--fa-espacio-4);
  margin: 0 0 var(--fa-espacio-3);
}
/* Móvil: cada campo ocupa su fila y el select se estira (fácil de tocar). */
.barra-resultados__campo {
  display: flex;
  align-items: center;
  gap: var(--fa-espacio-2);
  flex: 1 1 100%;
  min-width: 0; /* sin esto el campo no baja de su ancho "natural" y en 320px desborda la pantalla */
}
.barra-resultados__campo select {
  flex: 1;
  min-width: 0;
}
.barra-resultados__campo label {
  font-weight: 600;
  color: var(--fa-color-texto);
}
/* Select en forma de píldora. appearance:none quita la flecha del sistema y dibujamos la nuestra
   con un SVG verde como imagen de fondo (data-URI: no hay archivo extra). #0b7a38 sobre blanco
   = 5,4:1. El borde se mantiene oscuro (--fa-borde-control) para cumplir WCAG 1.4.11 (3:1). */
.barra-resultados__campo select {
  appearance: none;
  min-height: var(--fa-tactil-min);
  padding: 0 40px 0 var(--fa-espacio-4);
  font: inherit;
  color: var(--fa-color-texto);
  background-color: var(--fa-fondo-superficie);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230b7a38' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 16px;
  border: 1px solid var(--fa-borde-control);
  border-radius: var(--fa-radio-pildora);
  cursor: pointer;
}
.barra-resultados__campo select:hover {
  border-color: var(--fa-color-primario);
}
/* Tablet y escritorio: cada campo mide lo que necesita (no se estira) */
@media (min-width: 640px) {
  .barra-resultados__campo {
    flex: 0 0 auto;
  }
  .barra-resultados__campo select {
    flex: 0 0 auto;
  }
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

/* ---- Tablet (≥640px): "Ordenar" y "Mostrar" alineados a la derecha, como en la maqueta ---- */
@media (min-width: 640px) {
  .barra-resultados {
    justify-content: flex-end;
  }
}

/* ---- Escritorio (≥1024px): filtros laterales y resultados a la derecha ---- */
@media (min-width: 1024px) {
  .principal {
    grid-template-columns: var(--fa-ancho-filtros) minmax(0, 1fr);
    align-items: start;
    gap: var(--fa-espacio-5);
  }

  /* Filtros fijos al hacer scroll, justo debajo de la cabecera pegajosa.
     max-height + overflow-y: si el panel es más alto que la ventana, se desplaza por dentro
     en vez de quedar cortado. El padding de 6px con margen negativo igual deja sitio al aro
     de foco (outline) para que overflow no lo recorte, sin mover el diseño. */
  .principal__filtros {
    position: sticky;
    top: calc(var(--fa-alto-cabecera) + var(--fa-espacio-3));
    max-height: calc(100dvh - var(--fa-alto-cabecera) - var(--fa-espacio-3) - var(--fa-espacio-3));
    overflow-y: auto;
    padding: 6px;
    margin: -6px;
  }
}
</style>
