<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { parseISO, addDays, addMonths, startOfDay } from 'date-fns';

import { getUsers, User } from 'src/lib/api/admin/user.ts'
import { USER_STATE } from 'server/lib/models/user.ts';
import { USER_STATE_INFO } from 'src/lib/user.ts';

import AdminLayout from 'src/layouts/AdminLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import IconField from 'primevue/iconfield';
import InputText from 'primevue/inputtext';
import InputIcon from 'primevue/inputicon';
import InputSwitch from 'primevue/inputswitch';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { PrimeIcons } from 'primevue/api';
import StatTile from 'src/components/goal/StatTile.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Admin', url: '/admin' },
  { label: 'Users', url: '/admin/users' },
];

const users = ref<User[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadUsers = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    users.value = await getUsers();
  } catch(err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

const activeUsers = computed(() => {
  return users.value.filter(user => user.state === USER_STATE.ACTIVE).length;
});

const verifiedActiveUsers = computed(() => {
  return users.value.filter(user => user.state === USER_STATE.ACTIVE && user.isEmailVerified).length;
});

const newWeekUsers = computed(() => {
  const aWeekAgo = startOfDay(addDays(new Date(), -6));
  return users.value.filter(user => parseISO(user.createdAt) >= aWeekAgo).length;
});

const wowPercentage = computed(() => {
  const aWeekAgo = startOfDay(addDays(new Date(), -6));
  const twoWeeksAgo = addDays(aWeekAgo, -7);
  const lastWeekUsers = users.value.filter(user => parseISO(user.createdAt) < aWeekAgo && parseISO(user.createdAt) >= twoWeeksAgo).length;
  return Math.round(100* (newWeekUsers.value / lastWeekUsers));
});

const newMonthUsers = computed(() => {
  const aMonthAgo = startOfDay(addMonths(new Date(), -1));
  return users.value.filter(user => parseISO(user.createdAt) >= aMonthAgo).length;
});

const momPercentage = computed(() => {
  const aMonthAgo = startOfDay(addMonths(new Date(), -1));
  const twoMonthsAgo = addMonths(aMonthAgo, -1);
  const lastMonthUsers = users.value.filter(user => parseISO(user.createdAt) < aMonthAgo && parseISO(user.createdAt) >= twoMonthsAgo).length;
  return Math.round(100* (newMonthUsers.value / lastMonthUsers));
});

const usersFilter = ref<string>('');
const onlyShowActiveUsers = ref<boolean>(false);
const sortedFilteredUsers = computed(() => {
  let sortedUsers = users.value.toSorted((a, b) => a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0);

  if(usersFilter.value.length > 0) {
    sortedUsers = sortedUsers.filter(user =>
      user.username.includes(usersFilter.value) ||
      user.displayName.includes(usersFilter.value) ||
      user.email.includes(usersFilter.value) ||
      user.uuid.includes(usersFilter.value) ||
      user.id.toString().includes(usersFilter.value)
    );
  }

  if(onlyShowActiveUsers.value === true) {
    sortedUsers = sortedUsers.filter(user => user.state === USER_STATE.ACTIVE);
  }

  return sortedUsers;
});

onMounted(() => loadUsers());

</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="data flex justify-center gap-4 mb-4">
      <StatTile
        :highlight="users.length"
        bottom-legend="total users"
      />
      <StatTile
        :highlight="activeUsers"
        bottom-legend="active users"
      />
      <StatTile
        :highlight="verifiedActiveUsers"
        bottom-legend="verified active"
      />
      <StatTile
        :highlight="newWeekUsers"
        bottom-legend="past week"
      />
      <StatTile
        :highlight="wowPercentage"
        suffix="%"
        bottom-legend="week over week"
      />
      <StatTile
        :highlight="newMonthUsers"
        bottom-legend="past month"
      />
      <StatTile
        :highlight="momPercentage"
        suffix="%"
        bottom-legend="month over month"
      />
    </div>
    <div class="actions flex justify-end gap-4 mb-4">
      <div class="">
        <IconField>
          <InputIcon>
            <span :class="PrimeIcons.SEARCH" />
          </InputIcon>
          <InputText
            v-model="usersFilter"
            class="w-full"
            placeholder="Type to filter..."
          />
        </IconField>
      </div>
      <div class="flex gap-1 items-center">
        <span :class="PrimeIcons.USERS" />
        <InputSwitch
          v-model="onlyShowActiveUsers"
        />
        <span :class="PrimeIcons.STAR_FILL" />
      </div>
    </div>
    <div
      class="user-list"
    >
      <DataTable :value="sortedFilteredUsers">
        <Column
          header="ID"
        >
          <template #body="{ data }">
            <RouterLink
              :to="{ name: 'admin-user', params: { userId: data.id } }"
              class="text-underline text-primary-500 dark:text-primary-400"
            >
              {{ data.id }}
            </RouterLink>
          </template>
        </Column>
        <Column header="State">
          <template #body="{ data }">
            <Tag
              :value="data.state"
              :severity="USER_STATE_INFO[data.state].color"
              :pt="{ root: { class: 'font-normal uppercase' } }"
              :pt-options="{ mergeSections: true, mergeProps: true }"
            />
          </template>
        </Column>
        <Column
          header="UUID"
        >
          <template #body="{ data }">
            <pre>{{ data.uuid }}</pre>
          </template>
        </Column>
        <Column header="Username (Display)">
          <template #body="{ data }">
            <RouterLink
              :to="{ name: 'admin-user', params: { userId: data.id } }"
              class="text-underline text-primary-500 dark:text-primary-400"
            >
              {{ data.username }} ({{ data.displayName }})
            </RouterLink>
          </template>
        </Column>
        <Column header="Email">
          <template #body="{ data }">
            {{ data.email }}
            <span :class="data.isEmailVerified ? [ PrimeIcons.CHECK_CIRCLE, 'text-green-500 dark:text-green-400' ] : [ PrimeIcons.TIMES_CIRCLE, 'text-red-500 dark:text-red-400' ]" />
          </template>
        </Column>
      </DataTable>
    </div>
    <div v-if="users.length > 0 && sortedFilteredUsers.length === 0">
      No users found with those filters.
    </div>
    <div v-if="users.length === 0">
      No users found. Are you sure this thing is on?
    </div>
  </AdminLayout>
</template>

<style scoped>
</style>
