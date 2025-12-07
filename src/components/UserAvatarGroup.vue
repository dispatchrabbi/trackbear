<script setup lang="ts">
import { computed } from 'vue';

import AvatarGroup from 'primevue/avatargroup';
import Avatar from 'primevue/avatar';
import UserAvatar, { type UserWithAvatar } from 'src/components/avatar/UserAvatar.vue';

const props = withDefaults(defineProps<{
  users: UserWithAvatar[];
  size?: 'normal' | 'large' | 'xlarge';
  limit?: number;
}>(), {
  size: 'normal',
  limit: Infinity,
});

const limitedUsers = computed(() => {
  return props.users.slice(0, props.limit);
});
</script>

<template>
  <AvatarGroup>
    <UserAvatar
      v-for="user of limitedUsers"
      :key="user.displayName"
      :user="user"
      :size="props.size"
    />
    <Avatar
      v-if="props.limit < props.users.length"
      :label="'+' + (props.users.length - props.limit)"
      shape="circle"
      :size="props.size"
      :title="`And ${props.users.length - props.limit} more`"
    />
  </AvatarGroup>
</template>
