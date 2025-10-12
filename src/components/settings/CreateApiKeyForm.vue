<script setup lang="ts">
import { reactive, defineEmits } from 'vue';
import { startOfDay, endOfDay, add } from 'date-fns';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { createApiKey, type ApiKeyCreatePayload } from 'src/lib/api/api-key';
import { useAsyncSignals } from 'src/lib/use-async-signals';

import InputText from 'primevue/inputtext';
import RadioButton from 'primevue/radiobutton';
import Calendar from 'primevue/calendar';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import { type NonEmptyArray } from 'server/lib/validators';

const START_OF_TODAY = startOfDay(new Date());

const emit = defineEmits(['api-key:create', 'formSuccess']);

// presets
type ExpirationPreset = {
  key: string;
  label: string;
  date: Date | null | undefined;
};
const EXPIRATION_PRESETS: ExpirationPreset[] = [
  { key: 'one-month', label: '1 month from now', date: endOfDay(add(START_OF_TODAY, { months: 1 })) },
  { key: 'three-months', label: '3 months from now', date: endOfDay(add(START_OF_TODAY, { months: 3 })) },
  { key: 'one-year', label: '1 year from now', date: endOfDay(add(START_OF_TODAY, { years: 1 })) },
  { key: 'never', label: 'Never', date: null },
  { key: 'custom', label: 'Pick a date:', date: undefined },
];

type CreateApiKeyFormModel = {
  name: string;
  expirationPreset: ExpirationPreset['key'];
  expiresAt: Date | null;
};
const formModel = reactive<CreateApiKeyFormModel>({
  name: '',
  expirationPreset: '',
  expiresAt: null,
});

function handleSelectPreset(preset: ExpirationPreset) {
  if(preset.date !== undefined) {
    formModel.expiresAt = preset.date;
  }
}

const validations = z.object({
  name: z.string().min(1, { message: 'Please enter a title.' }),
  expirationPreset: z.enum(EXPIRATION_PRESETS.map(preset => preset.key) as NonEmptyArray<string>),
  expiresAt: z
    .date({ invalid_type_error: 'Please select a valid expiration date.' })
    .min(START_OF_TODAY, 'The expiration date must be today or later.')
    .nullable()
    .transform(val => val === null ? null : endOfDay(val)),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const [handleSubmit, signals] = useAsyncSignals(
  async function() {
    const data = formData();
    const payload: ApiKeyCreatePayload = {
      name: data.name,
      expiresAt: data.expiresAt,
    };

    const createdApiKey = await createApiKey(payload);
    emit('api-key:create', { created: createdApiKey });
  },
  async () => 'Could not create the API key: something went wrong server-side.',
  async () => 'Your API key has been created.',
);
</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-label="Create"
    :loading-message="signals.isLoading ? 'Creating...' : null"
    :success-message="signals.successMessage"
    :error-message="signals.errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="api-key-form-title"
      label="Name"
      required
      :rule="ruleFor('name')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="api-key-form-name"
          v-model="formModel.name"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="api-key-form-expires-at"
      label="When will this API key expire?"
      required
      :rule="ruleFor('expiresAt')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex flex-col gap-1">
          <div
            v-for="preset in EXPIRATION_PRESETS"
            :key="preset.key"
            class="flex items-top md:items-center h-8"
          >
            <RadioButton
              v-model="formModel.expirationPreset"
              :input-id="'api-key-form-expiration-preset-' + preset.key"
              name="api-key-form-expiration-preset"
              :value="preset.key"
              class="mt-1 md:mt-0"
              @change="handleSelectPreset(preset)"
            />
            <div class="flex flex-wrap items-center ml-2">
              <label
                :for="'api-key-form-expiration-preset-' + preset.key"
                class="mr-2"
              >{{ preset.label }}</label>
              <Calendar
                v-if="preset.key === 'custom'"
                id="api-key-form-expires-at"
                v-model="formModel.expiresAt"
                :disabled="formModel.expirationPreset !== 'custom'"
                placeholder="yyyy-mm-dd"
                date-format="yy-mm-dd"
                :min-date="START_OF_TODAY"
                show-icon
                show-button-bar
                :invalid="!isFieldValid"
                @update:model-value="onUpdate"
              />
            </div>
          </div>
        </div>
      </template>
    </FieldWrapper>
  </TbForm>
</template>
