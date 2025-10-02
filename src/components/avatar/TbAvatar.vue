<script setup lang="ts">
import { computed, defineProps } from 'vue';

import CLASSES from 'src/components/classes.ts';
import { userColorLevel, userColorOrFallback } from 'src/components/chart/user-colors';
import { useTheme } from 'src/lib/theme';
const theme = useTheme();

import Avatar from 'primevue/avatar';

const props = withDefaults(defineProps<{
  /** The name that goes with this Avatar. */
  name: string;
  /** The background color to use if there's no avatar image. */
  color?: string;
  /** Path to an image to use as the avatar. */
  avatarImage?: string | null;
  /**
   * A single character to use if there's no avatar image.
   * When not provided, the first character of the name will be used.
   */
  initial?: string | null;
  /** What size this avatar is. */
  size?: 'normal' | 'large' | 'xlarge';
  /** An icon to decorate the avatar with. */
  decorationIcon?: string | null;
  /** What color to make the decoration icon. */
  decorationIconColor?: 'primary' | 'accent';
}>(), {
  color: '',
  avatarImage: null,
  initial: null,
  size: 'normal',
  decorationIcon: null,
  decorationIconColor: 'primary',
});

const initial = computed(() => {
  const sourceStr = props.initial ?? props.name ?? '';
  if(sourceStr.length > 0) {
    return String.fromCodePoint(sourceStr.codePointAt(0)!);
  } else {
    return '';
  }
});

const imagePath = computed(() => {
  return props.avatarImage ? '/uploads/avatars/' + props.avatarImage : undefined;
});
</script>

<template>
  <div class="relative leading-[0]">
    <Avatar
      :image="imagePath"
      :label="imagePath ? undefined : initial"
      :size="props.size"
      shape="circle"
      :title="props.name"
      :class="[
        `!text-white/90`,
        `!bg-${userColorOrFallback(color, 'primary')}-${userColorLevel(theme.theme.value)}`,
        `dark:!bg-${userColorOrFallback(color, 'primary')}-${userColorLevel(theme.theme.value)}`,
        'font-bold'
      ]"
      :pt="{ image: { class: [ 'object-cover' ] } }"
      :pt-options="{ mergeSections: true, mergeProps: true }"
    />
    <div
      v-if="props.decorationIcon"
      :class="[
        'absolute -top-2 -left-2',
        CLASSES.TEXT[props.decorationIconColor]
      ]"
    >
      <i :class="props.decorationIcon" />
    </div>
  </div>
</template>
