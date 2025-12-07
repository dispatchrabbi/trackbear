<script setup lang="ts">
import { computed } from 'vue';

import { useTheme } from 'src/lib/theme';
const theme = useTheme();

import Avatar from 'primevue/avatar';

import CLASSES from 'src/components/classes.ts';
import { userColorLevel, userColorOrFallback } from '../chart/user-colors';

const props = withDefaults(defineProps<{
  name: string;
  color: string;
  size?: 'normal' | 'large' | 'xlarge';
  icon?: string | null;
  iconClass?: 'primary' | 'accent';
}>(), {
  size: 'normal',
  icon: null,
  iconClass: 'primary',
});

const initial = computed(() => {
  if(props.name.length > 0) {
    // Make this unicode-aware
    return String.fromCodePoint(props.name.codePointAt(0)!);
  } else {
    return '';
  }
});
</script>

<template>
  <div class="relative leading-[0]">
    <Avatar
      :label="initial"
      :size="props.size"
      shape="circle"
      :title="props.name"
      :class="[
        `!text-white/90`,
        `!bg-${userColorOrFallback(color, 'primary')}-${userColorLevel(theme.theme.value)}`,
        `dark:!bg-${userColorOrFallback(color, 'primary')}-${userColorLevel(theme.theme.value)}`,
        'font-bold'
      ]"
    />
    <div
      v-if="props.icon"
      :class="['absolute -top-2 -left-2', CLASSES.TEXT[props.iconClass] ]"
    >
      <i :class="props.icon" />
    </div>
  </div>
</template>
