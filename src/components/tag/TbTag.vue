<script setup lang="ts">
import { computed } from 'vue';

import { type Tag } from 'src/lib/api/tag.ts';
import { isTagColor, TAG_DEFAULT_COLOR } from 'server/lib/models/tag/consts';
import { TAG_COLOR_CLASSES } from 'src/components/tag/tag-color-classes.ts';

import Chip from 'primevue/chip';
import { PrimeIcons } from 'primevue/api';

type TagInfoProps =
  | { tag: Tag; name?: string; color?: string }
  | { tag?: Tag; name: string; color: string };
const props = defineProps<TagInfoProps & {
  removable?: boolean;
}>();

const name = computed(() => {
  return props.name ?? props.tag?.name ?? '';
});

const color = computed(() => {
  const givenColor = props.color ?? props.tag?.color ?? '';
  return isTagColor(givenColor) ? givenColor : TAG_DEFAULT_COLOR;
});
</script>

<template>
  <Chip
    :class="[ TAG_COLOR_CLASSES[color].background, TAG_COLOR_CLASSES[color].text]"
    :icon="PrimeIcons.HASHTAG"
    :label="name"
    :removable="props.removable"
  />
</template>

<style scoped>
</style>
