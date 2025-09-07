<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { watchDebounced } from '@vueuse/core';

import { getUsers, User } from 'src/lib/api/admin/user.ts';
import { getUserStats, type UserStats } from 'src/lib/api/admin/stats.ts';
import { USER_STATE_INFO } from 'src/lib/user.ts';

import AdminLayout from 'src/layouts/AdminLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import IconField from 'primevue/iconfield';
import InputText from 'primevue/inputtext';
import InputIcon from 'primevue/inputicon';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { PrimeIcons } from 'primevue/api';
import StatTile from 'src/components/goal/StatTile.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Admin', url: '/admin' },
  { label: 'Users', url: '/admin/users' },
];

const stats = ref<UserStats>({
  active: -1,
  verified: -1,
  signedUpLast30Days: -1,
  signedUpLast7Days: -1,
});
const isStatsLoading = ref<boolean>(false);
const statsErrorMessage = ref<string | null>(null);

const loadUserStats = async function() {
  isStatsLoading.value = true;
  statsErrorMessage.value = null;

  try {
    const response = await getUserStats();
    stats.value = response;
  } catch (err) {
    statsErrorMessage.value = err.message;
  } finally {
    isStatsLoading.value = false;
  }
};

const ROWS_PER_PAGE_OPTIONS = [50, 100, 250];
const savedRows = ref<number>(ROWS_PER_PAGE_OPTIONS[0]);
const savedFirst = ref<number>(0);

const usersSlice = ref<User[]>([]);
const totalUsers = ref<number>(0);

const isUsersLoading = ref<boolean>(false);
const usersErrorMessage = ref<string | null>(null);
const loadUsersSlice = async function(first: number, rows: number, search?: string) {
  if(rows === 0) {
    return;
  }

  isUsersLoading.value = true;
  usersErrorMessage.value = null;

  try {
    const response = await getUsers({
      skip: first,
      take: rows,
      search: search ? search.toString() : '',
    });
    usersSlice.value = response.users;
    totalUsers.value = response.total;
  } catch (err) {
    usersErrorMessage.value = err.message;
  } finally {
    isUsersLoading.value = false;
  }
};

const usersFilter = ref<string>('');
const debouncedUsersFilter = ref<string>('');
watchDebounced(usersFilter, async () => {
  debouncedUsersFilter.value = usersFilter.value;
  await loadUsersSlice(savedFirst.value, savedRows.value, debouncedUsersFilter.value);
}, { debounce: 500, maxWait: 1000 });

onMounted(async () => {
  await loadUserStats();
  await loadUsersSlice(0, 50);
});

</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="data flex flex-wrap justify-center gap-4 mb-4">
      <StatTile
        :highlight="stats.active"
        top-legend="users"
        bottom-legend="active"
      />
      <StatTile
        :highlight="stats.verified"
        top-legend="users"
        bottom-legend="active & verified"
      />
      <StatTile
        :highlight="stats.signedUpLast7Days"
        top-legend="signups"
        bottom-legend="signups past 7 days"
      />
      <StatTile
        :highlight="stats.signedUpLast30Days"
        top-legend="signups"
        bottom-legend="past 30 days"
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
    </div>
    <div
      class="user-list"
    >
      <DataTable
        :value="usersSlice"
        paginator
        :rows="ROWS_PER_PAGE_OPTIONS[0]"
        :rows-per-page-options="ROWS_PER_PAGE_OPTIONS"
        :total-records="totalUsers"
        paginator-template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
        current-page-report-template="{first} to {last} of {totalRecords}"
        :loading="isUsersLoading"
        :lazy="true"
        @page="ev => { loadUsersSlice(ev.first, ev.rows, debouncedUsersFilter)}"
        @update:rows="value => savedRows = value"
        @update:first="value => savedFirst = value"
      >
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
            <span :class="data.isEmailVerified ? [ PrimeIcons.CHECK_CIRCLE, 'text-success-500 dark:text-success-400' ] : [ PrimeIcons.TIMES_CIRCLE, 'text-danger-500 dark:text-danger-400' ]" />
          </template>
        </Column>
      </DataTable>
    </div>
    <div v-if="totalUsers === 0 && debouncedUsersFilter.length > 0">
      No users found with those filters.
    </div>
    <div v-if="totalUsers === 0">
      No users found. Are you sure this thing is on?
    </div>
  </AdminLayout>
</template>

<style scoped>
</style>
