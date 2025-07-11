<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import { getApiKeys, updateApiKey, deleteApiKey, type ApiKey } from 'src/lib/api/api-key';
import { useAsyncSignals } from 'src/lib/use-async-signals';

import SettingsLayout from 'src/layouts/SettingsLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import DataView from 'primevue/dataview';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from 'primevue/api';

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
    <div class="flex justify-between items-center mb-4">
      <SectionTitle title="API Keys" />
      <div class="actions flex flex-wrap gap-2">
        <RouterLink :to="{ name: 'new-api-key' }">
          <Button
            label="New"
            :icon="PrimeIcons.PLUS"
          />
        </RouterLink>
      </div>
    </div>
    <div v-if="signals.errorMessage">
      {{ signals.errorMessage }}
    </div>
    <div v-if="signals.isLoading">
      Loading...
    </div>
    <div v-if="apiKeys !== null">
      <DataView
        :value="apiKeys"
        data-key="id"
      >
        <template #list>
          <div class="flex flex-col">
            <div
              v-for="apiKey of apiKeys"
              :key="apiKey.id"
            >
              <pre>{{ JSON.stringify(apiKey, null, 2) }}</pre>
            </div>
          </div>
        </template>
        <template #empty>
          You haven't created any API keys yet. To get started, click <b>New</b>.
        </template>
      </DataView>
    </div>
  </SettingsLayout>
</template>
