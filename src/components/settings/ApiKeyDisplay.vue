<script setup lang="ts">
import { type ApiKey } from 'src/lib/api/api-key';
import { API_TOKEN_HEADER } from 'server/lib/auth-consts';
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
        Pass this value in the <span class="font-mono">{{ API_TOKEN_HEADER }}</span> header when making an API call.
      </div>
    </div>
  </Panel>
</template>
