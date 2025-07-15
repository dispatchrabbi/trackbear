<script setup lang="ts">
import { type ApiKey } from 'src/lib/api/api-key';
import { AUTHORIZATION_SCHEME } from 'server/lib/auth-consts';
import { formatExpirationDate } from 'src/lib/api-key';

import Panel from 'primevue/panel';

const props = defineProps<{
  apiKey: ApiKey;
}>();
</script>

<template>
  <Panel>
    <template #header>
      <div class="flex flex-col">
        <div class="font-heading text-lg font-bold">
          {{ props.apiKey.name }}
        </div>
        <div class="text-sm font-light italic">
          Expires {{ formatExpirationDate(props.apiKey.expiresAt) }}
        </div>
      </div>
    </template>
    <div class="flex flex-col gap-1">
      <div class="text-sm">
        API Token:
      </div>
      <div class="text-2xl font-mono font-bold text-primary-500 dark:text-primary-400 break-all">
        {{ props.apiKey.token }}
      </div>
      <div class="text-sm">
        When making an API call, pass this token in the Authorization header like so:
      </div>
      <div class="text-sm font-mono whitespace-nowrap overflow-auto bg-surface-100 dark:bg-surface-700 p-2 rounded-md">
        Authorization: {{ AUTHORIZATION_SCHEME }} {{ props.apiKey.token }}
      </div>
    </div>
  </Panel>
</template>
