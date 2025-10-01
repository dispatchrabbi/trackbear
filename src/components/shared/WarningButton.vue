<script setup lang="ts">
import { ref, defineEmits, withDefaults } from 'vue';

import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import WarningConfirmationForm from './WarningConfirmationForm.vue';

const props = withDefaults(defineProps<{
  /** The label for the warning button */
  label?: string | null;
  size?: string;
  icon?: string;
  outlined?: boolean;
  rounded?: boolean;
  text?: boolean;
  disabled?: boolean;

  /** The title of the pop-up dialog (defaults to the same as the button label) */
  dialogTitle?: string | null;
  /** A middle-of-a-sentence description of the dangerous action. */
  actionDescription: string;
  /** A short command description of the dangerous action (for a submit button). */
  actionCommand: string;
  /** A message to display while the dangerous action is in progress. */
  actionInProgressMessage: string;
  /** A message to display after the dangerous action has succeeded. */
  actionSuccessMessage: string;

  actionFn: () => Promise<void>;
}>(), {
  label: null,
  size: 'large',
  icon: PrimeIcons.TIMES_CIRCLE,
  outlined: false,
  rounded: false,
  text: false,
  disabled: false,
  dialogTitle: null,
});

const emit = defineEmits(['innerFormSuccess']);

const isWarningDialogVisible = ref<boolean>(false);

const handleWarningFormSuccess = function() {
  emit('innerFormSuccess');
  isWarningDialogVisible.value = false;
};
</script>

<template>
  <Button
    severity="danger"
    :label="props.label ?? undefined"
    :icon="props.icon"
    :outlined="props.outlined"
    :rounded="props.rounded"
    :text="props.text"
    :disabled="props.disabled"
    @click="isWarningDialogVisible = true"
  />
  <Dialog
    v-model:visible="isWarningDialogVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span :class="props.icon" />
        {{ props.dialogTitle ?? props.label }}
      </h2>
    </template>
    <WarningConfirmationForm
      :action-description="props.actionDescription"
      :action-command="props.actionCommand"
      :action-in-progress-message="props.actionInProgressMessage"
      :action-success-message="props.actionSuccessMessage"

      :action-fn="props.actionFn"

      @form-success="handleWarningFormSuccess"
      @cancel="isWarningDialogVisible = false"
    />
  </Dialog>
</template>
