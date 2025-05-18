<script setup lang="ts">
import { ref, defineEmits, withDefaults } from 'vue';

import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import DangerConfirmationForm from './DangerConfirmationForm.vue';

const props = withDefaults(defineProps<{
  /** The label for the danger button */
  label: string;
  size?: string;
  icon?: string;
  outlined?: boolean;
  disabled?: boolean;

  /** A middle-of-a-sentence description of the dangerous action. */
  actionDescription: string;
  /** A short command description of the dangerous action (for a submit button). */
  actionCommand: string;
  /** A message to display while the dangerous action is in progress. */
  actionInProgressMessage: string;
  /** A message to display after the dangerous action has succeeded. */
  actionSuccessMessage: string;

  /** What to type to confirm the dangerous action. */
  confirmationCode: string;
  /** A middle-of-a-sentence description of the confirmation code. */
  confirmationCodeDescription: string;

  actionFn: () => Promise<void>;
}>(), {
  size: 'large',
  icon: PrimeIcons.TIMES_CIRCLE,
  outlined: false,
  disabled: false,
});

const emit = defineEmits(['innerFormSuccess']);

const isDangerDialogVisible = ref<boolean>(false);

const handleDangerFormSuccess = function() {
  emit('innerFormSuccess');
  isDangerDialogVisible.value = false;
};
</script>

<template>
  <Button
    severity="danger"
    :label="props.label"
    :icon="props.icon"
    :outlined="props.outlined"
    :disabled="props.disabled"
    @click="isDangerDialogVisible = true"
  />
  <Dialog
    v-model:visible="isDangerDialogVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span :class="props.icon" />
        {{ props.label }}
      </h2>
    </template>
    <DangerConfirmationForm
      :action-description="props.actionDescription"
      :action-command="props.actionCommand"
      :action-in-progress-message="props.actionInProgressMessage"
      :action-success-message="props.actionSuccessMessage"

      :confirmation-code="props.confirmationCode"
      :confirmation-code-description="props.confirmationCodeDescription"

      :action-fn="props.actionFn"

      @form-success="handleDangerFormSuccess"
      @cancel="isDangerDialogVisible = false"
    />
  </Dialog>
</template>
