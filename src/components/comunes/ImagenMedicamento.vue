<!--
  ImagenMedicamento.vue  (src/components/comunes/)
  Qué es: la imagen de producto de UN medicamento (un <img> con la URL que trae el dato `imagen`).
  Si el medicamento no tiene `imagen`, o el archivo no carga (404, red caída...), muestra en su
  lugar la ilustración de su categoría (ImagenCategoria.vue): nunca queda un hueco ni el icono roto.
  Quién la usa: TarjetaMedicamento.vue (tamano lg), DetalleMedicamentoView.vue (lg) y
  CarritoView.vue (sm). Los menús (MenuLateral, MenuEscritorio) siguen usando iconos de categoría.

  CONTRATO (el mismo que ImagenCategoria, para poder intercambiarlos):
    - prop `imagen` (String): URL de la imagen, p. ej. '/medicamentos/paracetamol-500.svg'.
    - prop `categoria` (String): id de la categoría; solo se usa para el respaldo.
    - prop `nombre` (String): nombre del medicamento; solo se usa como texto alternativo si
      `decorativa` es false.
    - prop `decorativa` (Boolean, por defecto true): true = alt="" (la imagen no se lee).
    - prop `tamano` ('sm' 48px | 'md' 80px | 'lg' 140px). Por defecto 'md'.

  Sobre el `alt`: en la tarjeta, el detalle y el carrito el nombre del medicamento YA aparece
  como texto junto a la imagen. Si el alt repitiera el nombre, el lector de pantalla lo diría
  dos veces seguidas. Por eso alt="" (decorativa) por defecto. Solo habría que poner
  :decorativa="false" si algún día se usa la imagen sin texto cercano.
-->
<script setup>
import { ref, computed, watch } from 'vue' // paquete 'vue' (node_modules)
// Archivo local (misma carpeta, ruta relativa): el dibujo de categoría que sirve de respaldo.
import ImagenCategoria from './ImagenCategoria.vue'

const props = defineProps({
  imagen: { type: String, default: '' },
  categoria: { type: String, default: '' },
  nombre: { type: String, default: '' },
  decorativa: { type: Boolean, default: true },
  tamano: {
    type: String,
    default: 'md',
    validator: (valor) => ['sm', 'md', 'lg'].includes(valor),
  },
})

// true cuando el navegador no pudo cargar la imagen (evento @error del <img>).
const fallo = ref(false)
// Si cambia la URL (p. ej. se reutiliza el componente con otro medicamento), se vuelve a intentar.
watch(
  () => props.imagen,
  () => {
    fallo.value = false
  },
)

// Solo se muestra el <img> si hay URL y no ha fallado; si no, el respaldo.
const mostrarImagen = computed(() => !!props.imagen && !fallo.value)

// Tamaño en píxeles: igual que los de ImagenCategoria. Se pasa a width/height del <img> para que
// el navegador reserve el sitio antes de descargar (evita saltos de diseño).
const medidas = { sm: 48, md: 80, lg: 140 }
const lado = computed(() => medidas[props.tamano])
</script>

<template>
  <!-- Las clases `imagen-categoria` + `imagen-categoria--tamano` se ponen A PROPÓSITO: son las que
       usan las reglas :deep(.imagen-categoria) de DetalleMedicamentoView.vue para ensanchar la
       imagen, así el diseño del detalle no cambia. Los estilos base están más abajo. -->
  <span
    v-if="mostrarImagen"
    :class="['imagen-medicamento', 'imagen-categoria', `imagen-categoria--${tamano}`]"
  >
    <img
      :src="imagen"
      :alt="decorativa ? '' : nombre"
      :width="lado"
      :height="lado"
      loading="lazy"
      decoding="async"
      @error="fallo = true"
    />
  </span>
  <!-- Respaldo: ilustración de la categoría (ya es decorativa: aria-hidden). -->
  <ImagenCategoria v-else :categoria="categoria" :tamano="tamano" />
</template>

<style scoped>
/* Cuadro que contiene la foto. Mismos tamaños y radios que .imagen-categoria--* de ImagenCategoria.vue
   (48 / 80 / 140 px). Fondo blanco: las imágenes de producto se ven sobre blanco, como en una tienda. */
.imagen-medicamento {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--fa-fondo-superficie);
  border-radius: var(--fa-radio);
  /* Línea finísima que define el borde del cuadro, igual que la ilustración de categoría */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  user-select: none;
}
.imagen-medicamento.imagen-categoria--sm {
  width: 48px;
  height: 48px;
  padding: 3px;
}
.imagen-medicamento.imagen-categoria--md {
  width: 80px;
  height: 80px;
  padding: 5px;
}
.imagen-medicamento.imagen-categoria--lg {
  width: 140px;
  height: 140px;
  padding: 8px;
  border-radius: calc(var(--fa-radio) * 1.5);
}
/* La imagen llena el cuadro sin deformarse (object-fit: contain) aunque el cuadro se ensanche. */
.imagen-medicamento img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
