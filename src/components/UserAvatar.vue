<script setup lang="ts">
import { defineProps } from 'vue';

import Avatar from 'primevue/avatar';

type UserWithAvatar = { avatar?: string; };
const props = defineProps<{
  user: UserWithAvatar;
  size?: 'normal' | 'large' | 'xlarge';
}>();
</script>

<template>
  <Avatar
    :label="props.user.avatar ? null : '🐻'"
    :image="'/uploads/avatars/' + props.user.avatar"
    :size="props.size ?? 'normal'"
    shape="circle"
    :pt="{ image: { class: [ 'object-cover' ] } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
  />
</template>
