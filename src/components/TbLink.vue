<script setup lang="ts">

import { RouterLink, type RouteLocationRaw } from 'vue-router';

export type LinkDestination = {
  to: RouteLocationRaw | null;
  href?: string | null;
  target?: string | null;
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
    :target="props.target ?? undefined"
    @click="emit('click')"
  >
    <slot />
  </a>
</template>
