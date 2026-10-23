

<script setup>
import { ref } from 'vue'

const nombre = ref('')
</script>

<template>
  <h1>Mi primer formulario en Vue</h1>
  <h1>O.M.E.E.I.E.A.P.S.</h1>
   <h2>O.M.O.V.O.T.E.P.S.D.L.P</h2>

  <input
    v-model="nombre"
    placeholder="Escribe algo azul"
  />

  <p>Hola, {{ nombre }}</p>
</template>
