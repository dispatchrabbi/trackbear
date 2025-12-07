<script setup lang="ts">

import Button from 'primevue/button';
import InlineMessage from 'primevue/inlinemessage';

const props = defineProps<{
  isValid: boolean;

  submitLabel: string;
  submitSeverity?: string;
  cancelButton?: boolean;
  cancelLabel?: string;

  loadingMessage: string | null;
  successMessage: string | null;
  errorMessage: string | null;
}>();

const emit = defineEmits(['submit', 'cancel']);

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
        <div class="buttons flex gap-2">
          <Button
            :label="loadingMessage || submitLabel"
            size="large"
            :severity="props.submitSeverity || undefined"
            :disabled="!props.isValid"
            :loading="loadingMessage !== null"
            :pt="{ root: { type: 'submit' } }"
            :pt-options="{ mergeSections: true, mergeProps: true }"
          />
          <Button
            v-if="props.cancelButton"
            :label="cancelLabel || 'Cancel'"
            size="large"
            :disabled="loadingMessage !== null"
            severity="secondary"
            outlined
            @click="emit('cancel')"
          />
        </div>
        <InlineMessage
          v-if="successMessage"
          severity="success"
        >
          {{ successMessage }}
        </InlineMessage>
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
