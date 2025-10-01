<script setup lang="ts">
import { z } from 'zod';

import { USER_COLOR_NAMES, userColorOrFallback } from 'src/components/chart/user-colors';

import { useModelValidation } from 'src/lib/form';
import TbForm from 'src/components/form/TbForm.vue';
import SimpleFieldWrapper from 'src/components/form/SimpleFieldWrapper.vue';
import InputText from 'primevue/inputtext';
import ColorDropdown from '../ColorDropdown.vue';

const props = withDefaults(defineProps<{
  isLoading: boolean;
  loadingMessage?: string | null;
  successMessage: string | null;
  errorMessage: string | null;
}>(), {
  loadingMessage: 'Saving...',
});

const emit = defineEmits(['submit', 'cancel']);

export type TeamFormModel = {
  name: string;
  color: string;
};
const model = defineModel<TeamFormModel>({ required: true });

const validations = z.object({
  name: z.string().min(1, { message: 'Please enter a team name.' }),
  color: z.enum(['', ...USER_COLOR_NAMES]).transform(v => userColorOrFallback(v)),
});

const { isValid, validationMessages, isFieldInvalid, getParsedData } = useModelValidation(validations, model);

function handleSubmit() {
  if(!isValid.value) {
    return;
  }

  emit('submit', getParsedData());
}

</script>

<template>
  <TbForm
    id="team-form"
    :is-valid="isValid"
    submit-label="Save"
    :loading-message="props.isLoading ? props.loadingMessage : null"
    :success-message="props.successMessage"
    :error-message="props.errorMessage"
    @submit="handleSubmit()"
    @cancel="emit('cancel')"
  >
    <SimpleFieldWrapper
      for="team-form-name"
      label="Name"
      required
      :error-message="validationMessages['name']"
    >
      <InputText
        id="team-form-name"
        v-model="model.name"
        :invalid="!!isFieldInvalid['name']"
      />
    </SimpleFieldWrapper>
    <SimpleFieldWrapper
      for="team-form-color"
      label="Color"
      :error-message="validationMessages['color']"
      help="This determines what color this team will be on the graph."
    >
      <ColorDropdown
        v-model="model.color"
        id-prefix="team-form"
        :invalid="!!isFieldInvalid['color']"
      />
    </SimpleFieldWrapper>
  </TbForm>
</template>
