<script setup lang="ts">
import { ref, defineProps } from "vue";

import { useRouter } from "vue-router";
const router = useRouter();

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

const userMenu = ref(null);
const userMenuItems = ref([
  { label: 'Account Settings', route: '/settings/account' },
  { label: 'Tags', route: '/settings/tags' },
  { label: 'Log Out', route: '/logout' },
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
    >
      <template #item="{ item, props: itemProps }">
        <RouterLink
          v-slot="{ href, navigate }"
          :to="item.route"
          custom
        >
          <a
            v-ripple
            :href="href"
            v-bind="itemProps.action"
            @click="navigate"
          >
            <span class="leading-6 text-sm font-medium">{{ item.label }}</span>
          </a>
        </RouterLink>
      </template>
    </Menu>
  </div>
</template>

<style scoped>
</style>
