<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  highlight: string | number;
  prefix?: string;
  suffix?: string;
  topLegend?: string;
  bottomLegend?: string;
  color?: 'primary' | 'surface' | 'success' | 'info' | 'help' | 'danger' | 'warning';
}>();
</script>

<template>
  <div
    :class="[
      'flex flex-col justify-center',
      'w-1/2 md:w-48',
      'p-2 px-4 rounded-lg',
      'bg-surface-100 dark:bg-surface-900'
    ]"
  >
    <div class="top font-light text-center">
      {{ props.topLegend }}
    </div>
    <div
      :class="[
        'stat',
        'flex items-baseline justify-center font-bold my-2',
        'min-w-[8ch]',
        {
          'text-primary-500 dark:text-primary-400': props.color === 'primary' || props.color === undefined,
          'text-surface-0 dark:text-surface-950': props.color === 'surface',
          'text-green-500 dark:text-green-400': props.color === 'success',
          'text-blue-500 dark:text-blue-400': props.color === 'info',
          'text-purple-500 dark:text-purple-400': props.color === 'help',
          'text-red-500 dark:text-red-400': props.color === 'danger',
          'text-orange-500 dark:text-orange-400': props.color === 'warning',
        },
      ]"
    >
      <div
        v-if="props.prefix"
        class="prefix mr-1"
      >
        {{ props.prefix }}
      </div>
      <div class="highlight text-2xl">
        {{ props.highlight.toString() }}
      </div>
      <div
        v-if="props.suffix"
        class="suffix ml-1"
      >
        {{ props.suffix }}
      </div>
    </div>
    <div class="bottom font-light text-center">
      {{ props.bottomLegend }}
    </div>
  </div>
</template>
