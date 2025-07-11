<script setup lang="ts">
import { ref } from 'vue';

import { type ApiKey } from 'src/lib/api/api-key';

import Stepper from 'primevue/stepper';
import StepperPanel from 'primevue/stepperpanel';
import Message from 'primevue/message';
import Button from 'primevue/button';
import type { MenuItem } from 'primevue/menuitem';

import SettingsLayout from 'src/layouts/SettingsLayout.vue';
import CreateApiKeyForm from 'src/components/settings/CreateApiKeyForm.vue';
import ApiKeyCard from 'src/components/settings/ApiKeyCard.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Account' },
  { label: 'API Keys', url: '/account/api-keys' },
  { label: 'New', url: '/account/api-keys/new' },
];

const createdApiKey = ref<ApiKey>(null);
function handleApiKeyCreate({ created }: { created: ApiKey }) {
  createdApiKey.value = created;
}
</script>

<template>
  <SettingsLayout :breadcrumbs="breadcrumbs">
    <Stepper
      orientation="vertical"
      linear
      class="max-w-screen-md"
    >
      <StepperPanel header="Create API Key">
        <template #content="{ nextCallback }">
          <CreateApiKeyForm
            @api-key:create="handleApiKeyCreate"
            @form-success="nextCallback"
          />
        </template>
      </StepperPanel>
      <StepperPanel header="View API Key">
        <template #content>
          <div>Here is your new API key:</div>
          <ApiKeyCard
            v-if="createdApiKey"
            :api-key="createdApiKey"
          />
          <Message
            severity="warn"
            :closable="false"
          >
            This is the only time you will be able to view your API Key in full. Make sure to copy down the token value somewhere safe before continuing.
          </Message>
          <div>
            <RouterLink :to="{ name: 'api-keys' }">
              <Button
                label="I'm ready to leave"
              />
            </RouterLink>
          </div>
        </template>
      </StepperPanel>
    </Stepper>
  </SettingsLayout>
</template>
