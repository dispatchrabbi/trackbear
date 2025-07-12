<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import { getApiKeys, deleteApiKey, type ApiKey } from 'src/lib/api/api-key';
import { formatExpirationDate, formatLastUsedDate, isExpired } from 'src/lib/api-key';
import { useAsyncSignals } from 'src/lib/use-async-signals';

import DangerButton from 'src/components/shared/DangerButton.vue';

import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from 'primevue/api';
import SettingsLayout from 'src/layouts/SettingsLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

const breadcrumbs: MenuItem[] = [
  { label: 'Account' },
  { label: 'API Keys', url: '/account/api-keys' },
];

const apiKeys = ref<ApiKey[]>(null);
const [loadApiKeys, signals] = useAsyncSignals(async function() {
  const result = await getApiKeys();

  const now = new Date();
  apiKeys.value = result.toSorted((a, b) => {
    // unexpired goes before expired
    const aExpired = a.expiresAt < now;
    const bExpired = b.expiresAt < now;
    if(aExpired !== bExpired) {
      return aExpired ? 1 : -1;
    }

    // if both are expired or unexpired, most recently created goes first
    return a.createdAt < b.createdAt ? 1 : -1;
  });
});

onMounted(async () => {
  await loadApiKeys();
});

</script>

<template>
  <SettingsLayout
    :breadcrumbs="breadcrumbs"
  >
    <SectionTitle title="API Keys" />
    <div v-if="signals.errorMessage">
      {{ signals.errorMessage }}
    </div>
    <div v-if="signals.isLoading">
      Loading...
    </div>
    <div v-if="apiKeys !== null">
      <DataTable
        :value="apiKeys"
        data-key="id"
      >
        <Column
          field="name"
          header="Name"
        >
          <template #body="{data}">
            {{ data.name }}
            <Tag
              v-if="isExpired(data.expiresAt)"
              value="expired"
              severity="danger"
              :pt="{ root: { class: 'font-normal uppercase' } }"
              :pt-options="{ mergeSections: true, mergeProps: true }"
            />
          </template>
        </Column>
        <Column
          field="expiresAt"
          header="Expires"
        >
          <template #body="{data}">
            {{ formatExpirationDate(data.expiresAt) }}
          </template>
        </Column>
        <Column
          field="lastUsed"
          header="Last Used"
        >
          <template #body="{data}">
            {{ formatLastUsedDate(data.lastUsed) }}
          </template>
        </Column>
        <Column
          header=""
          class="w-0 text-center"
        >
          <template #header>
            <RouterLink :to="{ name: 'new-api-key' }">
              <Button
                label="New"
                size="small"
                :icon="PrimeIcons.PLUS"
              />
            </RouterLink>
          </template>
          <template #body="{ data }">
            <div class="flex gap-1">
              <DangerButton
                :icon="PrimeIcons.TRASH"
                text
                rounded
                dialog-title="Delete API Key"
                action-description="delete this API key"
                action-command="Delete"
                action-in-progress-message="Deleting"
                action-success-message="Deleted"
                :confirmation-code="data.name"
                confirmation-code-description="the API key's name"
                :action-fn="async () => { await deleteApiKey(data.id); }"
                @inner-form-success="loadApiKeys"
              />
              <!-- <Button
                :icon="PrimeIcons.TRASH"
                severity="danger"
                text
                rounded
                @click="currentlyDeletingApiKey = data"
              /> -->
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </SettingsLayout>
</template>
