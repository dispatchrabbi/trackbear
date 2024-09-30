<script setup lang="ts">
import { defineProps } from 'vue';

import Avatar from 'primevue/avatar';

import CLASSES from 'src/components/classes.ts'

export type UserWithAvatar = {
  avatar?: string;
  displayName: string;
};
const props = withDefaults(defineProps<{
  user: UserWithAvatar;
  size?: 'normal' | 'large' | 'xlarge';
  icon?: string;
  iconClass?: 'primary' | 'accent';
}>(), {
  size: 'normal',
  icon: null,
  iconClass: 'primary',
});
</script>

<template>
  <div class="relative leading-[0]">
    <Avatar
      :label="props.user.avatar ? null : '🐻'"
      :image="'/uploads/avatars/' + props.user.avatar"
      :size="props.size"
      shape="circle"
      :pt="{ image: { class: [ 'object-cover' ] } }"
      :pt-options="{ mergeSections: true, mergeProps: true }"
      :title="props.user.displayName"
    />
    <div
      v-if="props.icon"
      :class="['absolute -top-2 -left-2', CLASSES.TEXT[props.iconClass] ]"
    >
      <i :class="props.icon" />
    </div>
  </div>
</template>
