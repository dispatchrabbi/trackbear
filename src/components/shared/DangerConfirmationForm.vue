<script setup lang="ts">
import { ref, reactive, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const props = defineProps<{
  actionDescription: string;
  actionCommand: string;
  actionInProgressMessage: string;
  actionSuccessMessage: string;

  confirmationCode: string;
  confirmationCodeDescription: string;

  actionFn: () => Promise<void>;
}>();

const emit = defineEmits(['action:success', 'action:failure', 'formSuccess', 'cancel']);

const formModel = reactive({
  typedConfirmation: '',
});

const validations = z.object({
  // only allow exactly the confirmation code
  typedConfirmation: z.string().refine(val => val === props.confirmationCode, {
    message: `You must type ${props.confirmationCodeDescription} exactly.`,
  }),
});

const { ruleFor, validate, isValid } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  // let's just make extra sure
  if(!validate()) {
    return;
  }

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
    :is-valid="isValid"
    :submit-label="props.actionCommand"
    submit-severity="danger"
    :loading-message="isLoading ? props.actionInProgressMessage : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    cancel-button
    @submit="validate() && handleSubmit()"
    @cancel="emit('cancel')"
  >
    <p class="font-bold text-danger-500 dark:text-danger-400">
      You are about to {{ props.actionDescription }}.
    </p>
    <p>In order to confirm that you want to do this, please type <span class="font-bold">{{ props.confirmationCode }}</span> into the input below and click {{ props.actionCommand }}.</p>
    <FieldWrapper
      for="danger-form-confirmation"
      :label="`Type ${confirmationCodeDescription} to confirm:`"
      required
      :rule="ruleFor('typedConfirmation')"
    >
      <template #default>
        <InputText
          id="danger-form-confirmation"
          v-model="formModel.typedConfirmation"
          autocomplete="off"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>
