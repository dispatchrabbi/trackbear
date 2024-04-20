<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { RouterLink, RouteLocationRaw } from 'vue-router';

export type LinkDestination = {
  to?: RouteLocationRaw;
  href?: string;
  target?: string;
};

const props = defineProps<LinkDestination>();
const emit = defineEmits(['click']);
</script>

<template>
  <RouterLink
    v-if="props.to"
    :to="props.to"
    @click="emit('click')"
  >
    <slot />
  </RouterLink>
  <a
    v-if="props.href"
    :href="props.href"
    :target="props.target"
    @click="emit('click')"
  >
    <slot />
  </a>
</template>
