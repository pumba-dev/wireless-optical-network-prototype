<template>
  <a-config-provider :locale="ptBR">
    <MainSession />
  </a-config-provider>
</template>

<script setup lang="ts">
import MainSession from "./components/MainSession.vue";
import ptBR from "ant-design-vue/es/locale/pt_BR";
</script>

<style scoped></style>
