<script setup>
// Indicador de carga. Sin props ni emits. Usado por la vista de búsqueda (Fase 4).
</script>

<template>
  <div class="carga" role="status">
    <!-- Hueco para el spinner; decorativo, el lector de pantalla lo ignora -->
    <span class="carga__spinner" aria-hidden="true"></span>
    <span class="carga__texto">Buscando medicamentos…</span>
  </div>
</template>

<style scoped>
.carga {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--fa-espacio-2);
  padding: var(--fa-espacio-5) var(--fa-espacio-3);
  color: var(--fa-color-texto-suave);
  background: var(--fa-fondo-superficie);
  border: 1px solid var(--fa-borde);
  border-radius: var(--fa-radio);
}
/* Spinner: círculo con un borde de otro color que gira */
.carga__spinner {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 3px solid var(--fa-borde);
  border-top-color: var(--fa-color-primario);
  border-radius: 50%;
  animation: carga-giro 0.8s linear infinite;
}
@keyframes carga-giro {
  to {
    transform: rotate(360deg);
  }
}
/* Movimiento reducido: sin giro; queda un anillo estático (el texto ya informa) */
@media (prefers-reduced-motion: reduce) {
  .carga__spinner {
    animation: none;
    border-color: var(--fa-color-primario);
  }
}
</style>
