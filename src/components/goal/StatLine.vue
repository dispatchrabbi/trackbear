<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  stat?: string | number;
  description: string;
}>();
</script>

<template>
  <div>
    <div class="text-xs uppercase font-light mb-1">
      {{ props.description }}
    </div>
    <slot>
      <div>{{ (props.stat ?? '??').toString() }}</div>
    </slot>
  </div>
</template>
