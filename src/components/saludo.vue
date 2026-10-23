
<script setup>
const mensaje = '¡Hola desde mi componente!'
</script>

<template>
  <div>
    <h2>{{ mensaje }}</h2>
    <p>Este texto viene desde Saludo.vue</p>
  </div>
</template>

<style scoped>
h2 {
  color: green;
}
</style>
