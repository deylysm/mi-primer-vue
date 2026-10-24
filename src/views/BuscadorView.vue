2<script setup>
// Vista principal: une la lógica (composable) con los componentes de búsqueda.

// Estilos globales de FarmaApp (tokens --fa-*). Ruta con alias @ -> src/.
// Vite los inyecta en la página al importarlos.
import '@/assets/farmaapp.css'

// Archivos locales de FarmaApp (alias @ -> src/).
import { useBusquedaMedicamentos, MIN_CARACTERES } from '@/composables/useBusquedaMedicamentos.js'
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

    <header class="cabecera">
      <div class="contenedor">
        <h1 class="cabecera__titulo">FarmaApp</h1>
        <p class="cabecera__subtitulo">Busca medicamentos en farmacias cercanas</p>
        <BarraBusqueda
          v-model="termino"
          :faltan-caracteres="faltanCaracteres"
          :min-caracteres="MIN_CARACTERES"
          @buscar="buscarAhora"
        />
      </div>
    </header>

    <!-- tabindex="-1": permite que el enlace "saltar" le pase el foco. -->
    <main id="contenido" class="principal contenedor" tabindex="-1">
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

    <footer class="pie">
      <div class="contenedor">
        <p class="pie__aviso">
          Precios y stock referenciales (datos de demostración). Consulta siempre con tu
          farmacéutico.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Contenedor centrado de ancho máximo ~1200px con padding lateral por tokens. */
.contenedor {
  max-width: 1200px;
  margin: 0 auto;
  padding-inline: var(--fa-espacio-3);
}

.cabecera {
  background: var(--fa-fondo-superficie);
  border-bottom: 1px solid var(--fa-borde);
  padding-block: var(--fa-espacio-4);
}

.cabecera__titulo {
  margin: 0;
  font-size: var(--fa-texto-xl);
  color: var(--fa-color-primario);
}

.cabecera__subtitulo {
  margin: var(--fa-espacio-1) 0 var(--fa-espacio-3);
  color: var(--fa-color-texto-suave);
}

/* Móvil: una columna (filtros arriba, resultados debajo). */
.principal {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--fa-espacio-4);
  padding-block: var(--fa-espacio-4);
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
}

.bienvenida {
  margin: 0;
  padding: var(--fa-espacio-4);
  background: var(--fa-fondo-superficie);
  border: 1px dashed var(--fa-borde-control);
  border-radius: var(--fa-radio);
  color: var(--fa-color-texto-suave);
  text-align: center;
}

.pie {
  border-top: 1px solid var(--fa-borde);
  padding-block: var(--fa-espacio-4);
}

.pie__aviso {
  margin: 0;
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-suave);
}

@media (min-width: 640px) {
  .contenedor {
    padding-inline: var(--fa-espacio-4);
  }

  .cabecera__titulo {
    font-size: var(--fa-texto-2xl);
  }
}

/* Escritorio: filtros como barra lateral de 280px y resultados a la derecha. */
@media (min-width: 1024px) {
  .principal {
    grid-template-columns: 280px 1fr;
    align-items: start;
    gap: var(--fa-espacio-5);
  }

  .principal__filtros {
    position: sticky;
    top: var(--fa-espacio-3);
  }
}
</style>
