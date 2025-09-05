<script setup lang="ts">
import { ref, reactive, defineEmits } from 'vue';
import { addDays, set } from 'date-fns';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { useValidation } from 'src/lib/form.ts';

import { createBanner, BannerCreatePayload } from 'src/lib/api/admin/banner.ts';

import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import AnnouncementBanner from './AnnouncementBanner.vue';

const emit = defineEmits(['banner:create', 'formSuccess']);

const formModel = reactive({
  message: '',
  icon: 'campaign',
  color: 'info',
  showUntil: set(addDays(new Date(), 7), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }),
  enabled: false,
});

const colorOptions = [
  { label: 'Info (blue)', value: 'info' },
  { label: 'Success (green)', value: 'success' },
  { label: 'Warning (orange)', value: 'warning' },
  { label: 'Error (red)', value: 'error' },
];
const validations = z.object({
  message: z.string().min(1, { message: 'Please enter a title.' }),
  icon: z.string().min(1, { message: 'Please enter an icon.' }),
  color: z.enum(colorOptions.map(opt => opt.value) as NonEmptyArray<string>, { required_error: 'Please choose a color.' }),
  showUntil: z.date().min(new Date(), { message: 'Please choose a date and time after now.' }),
  enabled: z.boolean(),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const data = formData();
    const createdBanner = await createBanner(data as BannerCreatePayload);

    emit('banner:create', { banner: createdBanner });
    successMessage.value = `Banner has been created.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch {
    errorMessage.value = 'Could not create the banner: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-message="Submit"
    :loading-message="isLoading ? 'Creating...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <AnnouncementBanner
      :message="formModel.message"
      :color="formModel.color"
      :icon="formModel.icon"
    />
    <FieldWrapper
      for="banner-form-message"
      label="Message"
      required
      :rule="ruleFor('message')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Textarea
          id="banner-form-message"
          v-model="formModel.message"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="banner-form-show-until"
      label="Show until"
      :rule="ruleFor('showUntil')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Calendar
          id="banner-form-show-until"
          v-model="formModel.showUntil"
          date-format="yy-mm-dd"
          :min-date="new Date()"
          show-time
          hour-format="24"
          show-icon
          icon-display="input"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="banner-form-icon"
      label="Icon"
      :rule="ruleFor('icon')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="banner-form-icon"
          v-model="formModel.icon"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="banner-form-color"
      label="Color"
      required
      :rule="ruleFor('color')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Dropdown
          id="banner-form-color"
          v-model="formModel.color"
          :options="colorOptions"
          option-label="label"
          option-value="value"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="banner-form-enabled"
      label="Enabled"
      required
      :rule="ruleFor('enabled')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputSwitch
          id="banner-form-enabled"
          v-model="formModel.enabled"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
