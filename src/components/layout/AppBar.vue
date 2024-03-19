<script setup lang="ts">
import { ref, defineProps, defineEmits } from "vue";

import { RouterLink } from "vue-router";

import { PrimeIcons } from 'primevue/api';
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Menu from "primevue/menu";
import Breadcrumb from "primevue/breadcrumb";
import type { MenuItem } from 'primevue/menuitem';
import TrackbearMasthead from "./TrackbearMasthead.vue";

const props = defineProps<{
  breadcrumbs: MenuItem[];
  collapsed: boolean;
}>();

const emit = defineEmits([ 'sidebar:toggle' ]);

const toggleSidebar = function() {
  emit('sidebar:toggle');
}

const userMenu = ref(null);
const userMenuItems = ref<MenuItem[]>([
  { label: 'Account Settings', url: '/settings/account' },
  { label: 'Manage Tags', url: '/settings/tags' },
  { label: 'Log Out', url: '/logout' },
]);
const toggleUserMenu = ev => userMenu.value.toggle(ev);

</script>

<template>
  <div class="appbar flex items-center gap-2 px-4 py-2">
    <Button
      :icon="PrimeIcons.BARS"
      size="large"
      severity="secondary"
      text
      @click="toggleSidebar"
    />
    <TrackbearMasthead
      v-if="props.collapsed"
      :hide-logo="true"
    />
    <Breadcrumb
      class="hidden md:block"
      :model="props.breadcrumbs"
    >
      <template #item="{ item, props: itemProps }">
        <RouterLink
          v-if="item.url"
          :to="item.url"
          v-bind="itemProps.action"
        >
          <span :class="[item.icon, 'text-color']" />
          <span class="text-primary font-semibold">{{ item.label }}</span>
        </RouterLink>
        <a
          v-else
          :href="item.url"
          :target="item.target"
          v-bind="itemProps.action"
        >
          <span class="text-color">{{ item.label }}</span>
        </a>
      </template>
    </Breadcrumb>
    <div class="spacer flex-auto" />
    <div class="mr-2">
      <Avatar
        label="🐻"
        shape="circle"
        size="large"
        aria-haspopup="true"
        aria-controls="user-menu"
        @click="toggleUserMenu"
      />
    </div>
    <Menu
      id="user-menu"
      ref="userMenu"
      :model="userMenuItems"
      :popup="true"
    >
      <template #item="{ item, props: itemProps }">
        <RouterLink
          :to="item.url"
          v-bind="itemProps.action"
        >
          <span class="leading-6 text-sm font-medium">{{ item.label }}</span>
        </RouterLink>
      </template>
    </Menu>
  </div>
</template>

<style scoped>
</style>
