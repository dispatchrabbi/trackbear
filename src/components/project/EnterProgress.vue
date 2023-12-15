<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useForm } from 'vuestic-ui';

import { parseDateStringSafe, formatDate } from '../../lib/date.ts';
import { Project, TYPE_INFO } from '../../lib/project.ts';
import { createUpdate } from '../../lib/api/project';
import { CreateUpdatePayload } from '../../../server/api/projects';
import { Update } from '@prisma/client';

const props = defineProps<{ project: Project }>();
const emit = defineEmits(['newUpdate']);

const progressForm = reactive({
  date: null,
  count: '',
  time: '',
});
const errorMessage = ref('');

function validateTimeString(timeString: string) {
  const parts = timeString.split(':');
  const timeIsValid = parts.length === 2 &&
      parseInt(parts[0], 10) === +parts[0] && Number.isInteger(+parts[0]) &&
      parseInt(parts[1], 10) === +parts[1] && Number.isInteger(+parts[1]) && +parts[1] < 60;

  return timeIsValid;
}

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

async function handleSubmit() {
  errorMessage.value = '';

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

  let update: Update;
  try {
    update = await createUpdate(props.project, formData);
  } catch(err) {
    // TODO: better error handling here
    errorMessage.value = err;
    return;
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
        <VaInput
          v-if="props.project.type === 'time'"
          v-model="progressForm.time"
          :label="TYPE_INFO[props.project.type].count"
          :rules="[(v) => validateTimeString(v) || 'Please enter a duration in hours and minutes']"
          placeholder="HH:MM"
          messages="Required"
        />
        <VaInput
          v-if="props.project.type !== 'time'"
          v-model="progressForm.count"
          :label="TYPE_INFO[props.project.type].count"
          :rules="[v => { return (v === '') || (Number.parseInt(v, 10) === +v) || ('Please enter a number for your progress') }]"
          messages="Required"
        />
        <VaDateInput
          v-model="progressForm.date"
          label="date"
          placeholder="YYYY-MM-DD"
          :format="formatDate"
          :parse="parseDateStringSafe"
          messages="Required"
          manual-input
          clearable
        />
        <VaButton
          type="submit"
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
