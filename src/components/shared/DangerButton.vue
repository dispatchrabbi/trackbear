<script setup lang="ts">
import { ref, defineEmits, withDefaults } from 'vue';

import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import DangerConfirmationForm from './DangerConfirmationForm.vue';

const props = withDefaults(defineProps<{
  /** The label for the danger button */
  dangerButtonLabel: string;
  dangerButtonSize?: string;
  dangerButtonIcon?: string;
  dangerButtonOutlined?: boolean;

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
  dangerButtonSize: 'large',
  dangerButtonIcon: PrimeIcons.MINUS_CIRCLE,
  dangerButtonOutlined: false,
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
    :label="props.dangerButtonLabel"
    :icon="props.dangerButtonIcon"
    :outlined="props.dangerButtonOutlined"
    @click="isDangerDialogVisible = true"
  />
  <Dialog
    v-model:visible="isDangerDialogVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span :class="props.dangerButtonIcon" />
        {{ props.dangerButtonLabel }}
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
    />
  </Dialog>
</template>
