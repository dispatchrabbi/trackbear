<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  max: number;
  value: number;
  text?: string;
}>();

const strokeWidth = 32;
const scaleFactor = 180;
const aPath = computed(() => {
  const percent = props.value / props.max;
  const clampedPercent = Math.min(1, Math.max(-0.98, percent));
  const radians = 2 * Math.PI * clampedPercent;

  // not typos; we want to start at "north" (which is actually south on the SVG axes) and go clockwise
  const x = -Math.sin(radians) * scaleFactor;
  const y = Math.cos(radians) * scaleFactor;
  const largeArc = Math.abs(clampedPercent) > 0.5 ? 1 : 0;
  const clockwise = clampedPercent < 0 ? 0 : 1;

  return { x, y, largeArc, clockwise };
})
</script>

<template>
  <div class="aspect-square max-w-full max-h-full relative flex justify-center items-center">
    <div class="absolute w-full h-full">
      <svg
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="-180 -180 360 360"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <clipPath
          id="bounding-circle"
          clipPathUnits="userSpaceOnUse"
        >
          <circle
            cx="0"
            cy="0"
            r="180"
          />
        </clipPath>
        <circle
          cx="0"
          cy="0"
          r="180"
          class="fill-transparent stroke-surface-200 dark:stroke-surface-700"
          :stroke-width="strokeWidth / 2"
          clip-path="url(#bounding-circle)"
        />
        <path
          v-if="props.value < props.max"
          :d="`
            M 0,180
            A 180 180 0 ${aPath.largeArc} ${aPath.clockwise} ${aPath.x},${aPath.y}
          `"
          :class="['fill-transparent', {
            'stroke-primary-500 dark:stroke-primary-400': props.value >= 0,
            'stroke-danger-500 dark:stroke-danger-400': props.value < 0
          }]"
          :stroke-width="strokeWidth"
          clip-path="url(#bounding-circle)"
        />
        <circle
          v-else
          cx="0"
          cy="0"
          r="180"
          :class="['fill-transparent', {
            'stroke-accent-500 dark:stroke-accent-400': props.value >= 0,
            'stroke-danger-500 dark:stroke-danger-400': props.value < 0
          }]"
          :stroke-width="strokeWidth"
          clip-path="url(#bounding-circle)"
        />
      </svg>
    </div>
    <slot>
      <div class="p-2 text-center">
        {{ text }}
      </div>
    </slot>
  </div>
</template>