<script setup lang="ts">
import { computed, defineProps } from 'vue';

export type WorkWithCover = {
  cover?: string;
  title: string;
};
const props = withDefaults(defineProps<{
  work: WorkWithCover;
  rounded?: 'none' | 'normal' | 'md' | 'lg' | 'full';
  shadow?: 'none' | 'normal' | 'md' | 'lg';
  // size?: 'normal' | 'large' | 'xlarge';
  // icon?: string;
  // iconClass?: 'primary' | 'accent';
}>(), {
  rounded: 'normal',
  shadow: 'normal',
  // size: 'normal',
  // icon: null,
  // iconClass: 'primary',
});

const src = computed(() => {
  return props.work.cover ? `/uploads/covers/${props.work.cover}` : '/images/placeholder-cover.png';
});

const ROUNDED_CLASSES = {
  none: 'rounded-none',
  normal: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const SHADOW_CLASSES = {
  none: 'shadow-none',
  normal: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
};
</script>

<template>
  <img
    :class="[
      'max-h-full max-w-full aspect-2/3 object-contain',
      ROUNDED_CLASSES[props.rounded],
      SHADOW_CLASSES[props.shadow],
    ]"
    :src="src"
  >
</template>
