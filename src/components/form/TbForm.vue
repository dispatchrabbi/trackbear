<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { PrimeIcons } from 'primevue/api';

import Button from 'primevue/button';
import InlineMessage from 'primevue/inlinemessage';

const props = defineProps<{
  isValid: boolean;

  submitMessage: string;
  loadingMessage: string | null;
  successMessage: string | null;
  errorMessage: string | null;
}>();

const emit = defineEmits(['submit']);

const handleSubmit = function() {
  if(!props.isValid) { return; }

  emit('submit');
};
</script>

<template>
  <form
    class="tb-form flex flex-col gap-4"
    @submit.prevent="handleSubmit"
  >
    <slot />
    <slot name="actions">
      <div class="actions flex flex-col-reverse md:flex-row gap-2">
        <div class="buttons">
          <!-- TODO: maybe more buttons/button options? -->
          <Button
            :label="successMessage || loadingMessage || submitMessage"
            size="large"
            :disabled="!props.isValid"
            :loading="loadingMessage !== null"
            :icon="successMessage && PrimeIcons.CHECK"
            :pt="{ root: { type: 'submit' } }"
            :pt-options="{ mergeSections: true, mergeProps: true }"
          />
        </div>
        <InlineMessage
          v-if="errorMessage"
          severity="error"
        >
          {{ errorMessage }}
        </InlineMessage>
      </div>
    </slot>
  </form>
</template>

<style scoped>
</style>
