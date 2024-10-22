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
      'flex flex-col flex-1 justify-center',
      'whitespace-nowrap',
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
          'text-success-500 dark:text-success-400': props.color === 'success',
          'text-info-500 dark:text-info-400': props.color === 'info',
          'text-help-500 dark:text-help-400': props.color === 'help',
          'text-danger-500 dark:text-danger-400': props.color === 'danger',
          'text-warning-500 dark:text-warning-400': props.color === 'warning',
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
