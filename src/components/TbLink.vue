<script setup lang="ts">
import { defineProps } from 'vue';
import { RouterLink, RouteLocationRaw } from 'vue-router';

export type LinkDestination = {
  to?: RouteLocationRaw;
  href?: string;
  target?: string;
};

const props = defineProps<LinkDestination>();
</script>

<template>
  <RouterLink
    v-if="props.to"
    :to="props.to"
  >
    <slot />
  </RouterLink>
  <a
    v-if="props.href"
    :href="props.href"
    :target="props.target"
  >
    <slot />
  </a>
</template>
