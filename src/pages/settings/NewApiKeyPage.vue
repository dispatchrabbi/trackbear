<script setup lang="ts">
import { ref } from 'vue';
import wait from 'src/lib/wait.ts';

import { type ApiKey } from 'src/lib/api/api-key';

import Stepper from 'primevue/stepper';
import StepperPanel from 'primevue/stepperpanel';
import Message from 'primevue/message';
import Button from 'primevue/button';
import type { MenuItem } from 'primevue/menuitem';

import SettingsLayout from 'src/layouts/SettingsLayout.vue';
import CreateApiKeyForm from 'src/components/settings/CreateApiKeyForm.vue';
import ApiKeyDisplay from 'src/components/settings/ApiKeyDisplay.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Account' },
  { label: 'API Keys', url: '/account/api-keys' },
  { label: 'New', url: '/account/api-keys/new' },
];

const createdApiKey = ref<ApiKey | null>(null);
async function handleApiKeyCreate({ created }: { created: ApiKey }, nextCallback) {
  createdApiKey.value = created;
  await wait(1 * 1000);
  nextCallback();
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
            @api-key:create="(data) => { handleApiKeyCreate(data, nextCallback); }"
          />
        </template>
      </StepperPanel>
      <StepperPanel header="View API Key">
        <template #content>
          <div>Here is your new API key:</div>
          <ApiKeyDisplay
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
