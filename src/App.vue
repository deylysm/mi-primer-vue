

<script setup>
import { ref } from 'vue'

const nombre = ref('')
</script>

<template>
  <h1>Mi primer formulario en Vue</h1>

  <input
    v-model="nombre"
    placeholder="Escribe tu nombre"
  />

  <p>Hola, {{ nombre }}</p>
</template>
