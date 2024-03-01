<script setup lang="ts">

const props = defineProps<{
  icon?: string;
}>();

</script>

<template>
  <span class="icon material-icons">{{ props.icon }}</span>
</template>

<style scoped>
.icon {
  font-size: inherit;
  line-height: 1;
}
</style>
