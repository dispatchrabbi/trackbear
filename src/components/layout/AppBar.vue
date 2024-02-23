<script setup lang="ts">
import { ref, defineProps } from "vue";

import { PrimeIcons } from 'primevue/api';
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Menu from "primevue/menu";
import Breadcrumb from "primevue/breadcrumb";
import type { MenuItem } from 'primevue/menuitem';

import { useToast } from 'primevue/usetoast';
const toast = useToast();

const props = defineProps<{
  breadcrumbs: MenuItem[];

}>();

const toggleSidebar = function() {
  toast.add({
    severity: 'info',
    detail: 'Boop!',
    life: 2000,
  });
}

const userMenu = ref();
const userMenuItems = ref([
  { label: 'Account Settings' },
  { label: 'Log Out', command: () => toast.add({ detail: 'Logged out!', life: 2000 }) },
]);
const toggleUserMenu = ev => userMenu.value.toggle(ev);

</script>

<template>
  <div class="appbar flex items-center gap-2 py-2">
    <Button
      :icon="PrimeIcons.BARS"
      size="large"
      severity="secondary"
      text
      @click="toggleSidebar"
    />
    <Breadcrumb
      :model="props.breadcrumbs"
    />
    <div class="spacer flex-auto" />
    <Avatar
      label="🐻"
      shape="circle"
      size="large"
    />
    <Button
      class="mr-2"
      type="button"
      :icon="PrimeIcons.CARET_DOWN"
      size="large"
      severity="secondary"
      text
      aria-haspopup="true"
      aria-controls="user-menu"
      @click="toggleUserMenu"
    />
    <Menu
      id="user-menu"
      ref="userMenu"
      :model="userMenuItems"
      :popup="true"
    />
  </div>
</template>

<style scoped>
</style>
