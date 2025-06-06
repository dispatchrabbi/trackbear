<script setup lang="ts">
import { ref, reactive, computed, defineEmits } from 'vue';
import { useEventBus } from '@vueuse/core';
import wait from 'src/lib/wait.ts';
import { toTitleCase } from 'src/lib/str.ts';

import { useTagStore } from 'src/stores/tag.ts';
const tagStore = useTagStore();
tagStore.populate();

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { createTag, type Tag, type TagCreatePayload } from 'src/lib/api/tag.ts';
import { TAG_COLORS, TAG_DEFAULT_COLOR } from 'server/lib/models/tag/consts';
// import { TAG_COLOR_CLASSES } from 'src/components/tag/tag-color-classes.ts';

import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import { PrimeIcons } from 'primevue/api';

const emit = defineEmits(['tag:create', 'formSuccess']);
const eventBus = useEventBus<{ tag: Tag }>('tag:create');

const formModel = reactive({
  name: '',
  color: TAG_DEFAULT_COLOR,
});

const validations = z.object({
  name: z.string()
    .min(1, { message: 'Please enter a tag name.' })
    .regex(/^[^#]/, { message: 'There is no need to type the #.' }),
  // TODO: add something that disallows current tag names
  color: z.enum(TAG_COLORS, { required_error: 'Please pick a color.' }),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const colorOptions = computed(() => {
  return TAG_COLORS.map(color => ({
    label: toTitleCase(color),
    value: color,
  }));
});

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const data = formData();
    const createdTag = await createTag(data as TagCreatePayload);

    emit('tag:create', { tag: createdTag });
    eventBus.emit({ tag: createdTag });

    successMessage.value = `#${createdTag.name} has been created.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch (err) {
    if(err.code === 'TAG_EXISTS') {
      errorMessage.value = 'Could not create the tag: a tag with this name already exists.';
    } else {
      errorMessage.value = 'Could not create the tag: something went wrong server-side.';
    }

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-message="Create"
    :loading-message="isLoading ? 'Creating...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="tag-form-name"
      label="Name"
      required
      :rule="ruleFor('name')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <IconField icon-position="left">
          <InputIcon><span :class="PrimeIcons.HASHTAG" /></InputIcon>
          <InputText
            id="tag-form-name"
            v-model="formModel.name"
            class="w-full"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
        </IconField>
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="tag-form-color"
      label="Color"
      required
      :rule="ruleFor('color')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Dropdown
          id="tag-form-color"
          v-model="formModel.color"
          :options="colorOptions"
          option-label="label"
          option-value="value"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
src/components/tag/tag
server/lib/models/tag
