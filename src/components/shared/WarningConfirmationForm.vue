<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import TbForm from 'src/components/form/TbForm.vue';

const props = defineProps<{
  actionDescription: string;
  actionCommand: string;
  actionInProgressMessage: string;
  actionSuccessMessage: string;

  actionFn: () => Promise<void>;
}>();

const emit = defineEmits(['action:success', 'action:failure', 'formSuccess', 'cancel']);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    await props.actionFn();
    emit('action:success');

    successMessage.value = props.actionSuccessMessage;
    await wait(1 * 1000);

    emit('formSuccess');
  } catch {
    errorMessage.value = `Could not ${props.actionDescription}: something went wrong server-side.`;
    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="true"
    submit-label="Yes"
    submit-severity="danger"
    cancel-button
    cancel-label="No"
    :loading-message="isLoading ? props.actionInProgressMessage : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="handleSubmit()"
    @cancel="emit('cancel')"
  >
    <p class="font-bold text-danger-500 dark:text-danger-400">
      You are about to {{ props.actionDescription }}.
    </p>
    <p>Are you sure you want to do this?</p>
  </TbForm>
</template>
