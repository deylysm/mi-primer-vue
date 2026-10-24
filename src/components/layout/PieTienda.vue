<!--
  PieTienda.vue  (src/components/layout/)
  Qué es: el pie de página oscuro (verde muy oscuro) con el aviso legal.
  Quién lo usa: src/App.vue (aparece en todas las páginas).
  Es presentación pura: sin props, sin eventos, sin lógica.
-->
<template>
  <footer class="pie">
    <div class="pie__interior fa-contenedor">
      <p class="pie__marca">FarmaApp</p>
      <p class="pie__aviso">
        Precios y stock referenciales (datos de demostración). Consulta siempre con tu
        farmacéutico.
      </p>
    </div>
  </footer>
</template>

<style scoped>
/* Fondo verde oscuro a todo el ancho. Texto blanco: 9.9:1; texto secundario ~8:1 (AA = 4.5:1). */
.pie {
  margin-top: var(--fa-espacio-5);
  padding-block: var(--fa-espacio-5);
  background: var(--fa-color-primario-oscuro);
  color: var(--fa-color-texto-sobre-verde);
  /* Borde superior verde vivo: detalle de marca */
  border-top: 4px solid var(--fa-color-marca);
}
.pie__interior {
  display: flex;
  flex-direction: column;
  gap: var(--fa-espacio-2);
}
.pie__marca {
  margin: 0;
  font-family: var(--fa-fuente-titulos);
  font-size: var(--fa-texto-lg);
  font-weight: 800;
}
.pie__aviso {
  margin: 0;
  max-width: 60ch; /* líneas de lectura cómoda */
  font-size: var(--fa-texto-sm);
  color: var(--fa-color-texto-pie-suave);
}
</style>
