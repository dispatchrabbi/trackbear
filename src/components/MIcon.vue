<script setup lang="ts">

const props = defineProps<{
  icon?: string;
  class?: string;
}>();

</script>

<template>
  <span :class="[ 'icon material-icons', props.class || 'font-size-inherit' ]">{{ props.icon }}</span>
</template>

<style scoped>
.icon {
  line-height: 1;
}

.font-size-inherit {
  font-size: inherit;
}
</style>
