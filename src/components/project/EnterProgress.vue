<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

import { parseDateStringSafe, formatDate, validateTimeString } from '../../lib/date.ts';
import { Project, TYPE_INFO } from '../../lib/project.ts';
import { createUpdate } from '../../lib/api/project.ts';
import { CreateUpdatePayload } from '../../../server/api/projects.ts';

const props = defineProps<{ project: Project }>();
const emit = defineEmits(['newUpdate']);

const progressForm = reactive({
  date: null,
  count: '',
  time: '',
});

const isLoading = ref<boolean>(false);
const successMessage = ref<string>('');
const errorMessage = ref<string>('');

function validate() {
  const dateIsValid = progressForm.date instanceof Date;

  let countIsValid = true;
  let timeIsValid = true;
  if(props.project.type === 'time') {
    timeIsValid = validateTimeString(progressForm.time);
  } else {
    countIsValid = progressForm.count.length > 0 && Number.isInteger(+progressForm.count);
  }

  return dateIsValid && countIsValid && timeIsValid;
}
const isValid = computed(() => validate());

let timeout = null;
async function handleSubmit() {
  successMessage.value = '';
  errorMessage.value = '';
  isLoading.value = true;

  const date = formatDate(progressForm.date);

  let value;
  if(props.project.type === 'time') {
    const [ hours, minutes ] = progressForm.time.split(':').map(x => +x);
    value = (hours * 60) + minutes;
  } else {
    value = +progressForm.count;
  }

  const formData = {
    date,
    value,
  } as CreateUpdatePayload;

  let update;
  try {
    update = await createUpdate(props.project, formData);

    successMessage.value = 'Progress logged!';
    // clear the message after 10 seconds
    if(timeout) { clearTimeout(timeout); }
    timeout = setTimeout(() => successMessage.value = '', 5 * 1000);
  } catch(err) {
    errorMessage.value = err.message;
    return;
  } finally {
    isLoading.value = false;
  }

  emit('newUpdate', update);

  // clear out the form
  progressForm.count = '';
  progressForm.date = null;
}
</script>

<template>
  <VaCard class="h-full">
    <VaCardTitle>Log your progress!</VaCardTitle>
    <VaCardContent>
      <VaForm
        ref="form"
        class="flex flex-col gap-2"
        tag="form"
        @submit.prevent="validate() && handleSubmit()"
      >
        <VaAlert
          v-if="successMessage"
          class="mb-4 mx-0"
          color="success"
          border="left"
          icon="insights"
          closeable
          :description="successMessage"
        />
        <VaAlert
          v-if="errorMessage"
          class="mb-4 mx-0"
          color="danger"
          border="left"
          icon="error"
          closeable
          :description="errorMessage"
        />
        <VaInput
          v-if="props.project.type === 'time'"
          v-model="progressForm.time"
          :label="TYPE_INFO[props.project.type].description"
          :rules="[(v) => validateTimeString(v) || 'Please enter a duration in hours and minutes']"
          placeholder="HH:MM"
          required-mark
        />
        <VaInput
          v-if="props.project.type !== 'time'"
          v-model="progressForm.count"
          :label="TYPE_INFO[props.project.type].description"
          :rules="[v => { return (v === '') || (Number.parseInt(v, 10) === +v) || ('Please enter a number for your progress') }]"
          required-mark
        />
        <VaDateInput
          v-model="progressForm.date"
          label="date"
          placeholder="YYYY-MM-DD"
          :format="formatDate"
          :parse="parseDateStringSafe"
          required-mark
          manual-input
          clearable
        />
        <VaButton
          type="submit"
          :loading="isLoading"
          :disabled="!isValid"
          class="mt-3"
        >
          Submit
        </VaButton>
      </VaForm>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
