<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

import { isMatch, parse } from 'date-fns';
import { formatDate } from 'src/lib/date.ts';

import * as z from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { useProjectStore } from 'src/stores/project';
const projectStore = useProjectStore();

import { createProject, type ProjectCreatePayload } from 'src/lib/api/project';
import { PROJECT_PHASE } from 'server/lib/models/project/consts';
import { batchCreateTallies, type TallyCreatePayload } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE, type TallyMeasure } from 'server/lib/models/tally/consts';
import { formatCount, cmpTallies } from 'src/lib/tally.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

import type { MenuItem } from 'primevue/menuitem';
import Stepper from 'primevue/stepper';
import StepperPanel from 'primevue/stepperpanel';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InlineMessage from 'primevue/inlinemessage';
import { PrimeIcons } from 'primevue/api';

const emit = defineEmits(['project:create']);

const breadcrumbs: MenuItem[] = [
  { label: 'Projects', url: '/projects' },
  { label: 'Import', url: '/projects/import' },
  { label: 'Manually from NaNoWriMo', url: '/projects/import/nano-manual' },
];

type ImportNanoManuallyFormModel = {
  countsText: string;
  workId: number | null;
  workTitle: string;
};
const formModel = reactive<ImportNanoManuallyFormModel>({
  countsText: '',
  workId: null,
  workTitle: '',
});

const validations = z.object({
  countsText: z.string()
    .min(1, { error: 'Please fill in your NaNoWriMo progress updates.' })
    .superRefine((val, ctx) => {
      const validation = validateCountsText(val);

      if(!validation.valid) {
        ctx.issues.push({
          code: 'custom',
          message: validation.messages.join(' '),
          input: val,
        });
      }
    }),
  workId: z.number({ error: 'Please select a project.' }).int(),
  workTitle: z.string().refine(val => formModel.workId === -1 ? val.length > 0 : true, { error: 'Please enter a title for the new project.' }),
});

const { ruleFor, isValid } = useValidation(validations, formModel);

const validateCountsText = function(countsText: string) {
  if(countsText.length === 0) {
    return {
      valid: false,
      empty: true,
      messages: [`Please fill in your NaNoWriMo progress updates.`],
    };
  }

  // We expect to see something like:
  // Date\tCount\tActions
  // Nov 1, 2023\t1667
  // but: Firefox inserts spaces before the tabs. Chrome doesn't put a \t before Actions and copies alt-text of the
  // trash can action button after the count. Safari doesn't copy the Actions header and also copies the alt-text.
  // So we gotta Postel's law this thing.

  const lines = countsText.split('\n');

  // is the first line a valid header?
  const firstLine = lines.shift()!;
  const parts = firstLine.split(/\s+/);
  if(!(parts[0] === 'Date' && parts[1].startsWith('Count'))) {
    return {
      valid: false,
      empty: false,
      messages: [`The first line doesn't look right. Did you include the Date and Count header?`],
    };
  }

  // are the rest of the lines valid?
  for(let i = 0; i < lines.length; ++i) {
    const lineParts = lines[i].split('\t').map(x => x.trim());
    if(lineParts.length < 2) {
      return {
        valid: false,
        empty: false,
        messages: [`There is an issue with line ${i + 2}.`],
      };
    }

    const isDateValid = isMatch(lineParts[0], 'MMM d, y');
    const isCountValid = !Number.isNaN(Number.parseInt(lineParts[1], 10));

    if(!isDateValid) {
      return {
        valid: false,
        empty: false,
        messages: [`There is an issue with the date on line ${i + 2}.`],
      };
    } else if(!isCountValid) {
      return {
        valid: false,
        empty: false,
        messages: [`There is an issue with the count on line ${i + 2}.`],
      };
    }
  }

  return {
    valid: true,
    empty: false,
    messages: [],
  };
};
const isCountsTextValid = computed(() => {
  const validation = validateCountsText(formModel.countsText);
  return validation.valid;
});

await projectStore.populate();
const projectOptions = computed(() => {
  return [
    { title: '[New Project]', id: -1 },
    ...projectStore.allProjects,
  ];
});

const selectedProjectTitle = computed(() => {
  if(formModel.workId === null) {
    return '';
  } else if(formModel.workId === -1) {
    return formModel.workTitle;
  } else {
    return projectStore.allProjects.find(project => project.id === formModel.workId)?.title ?? '(unknown project)';
  }
});

const parsedCountsData = computed(() => {
  if(!isCountsTextValid.value) {
    return [];
  }

  type BareMinimumTally = {
    date: string;
    count: number;
    measure: TallyMeasure;
  };
  const tallies: BareMinimumTally[] = [];

  const now = new Date();
  const lines = formModel.countsText.split('\n');
  // i starts at 1 because we skip the first line
  for(let i = 1; i < lines.length; ++i) {
    const lineParts = lines[i].split('\t').map(x => x.trim());

    const date = formatDate(parse(lineParts[0].trim(), 'MMM d, y', now));
    const count = Number.parseInt(lineParts[1], 10);
    tallies.push({ date, count, measure: TALLY_MEASURE.WORD });
  }

  const sortedTallies = tallies.sort(cmpTallies);
  return sortedTallies;
});

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const progressMessage = ref<string | null>(null);
const hasUploadHappened = ref<boolean>(false);
async function handleImportClick() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;
  progressMessage.value = 'Starting import';

  if(!isValid) {
    isLoading.value = false;
    progressMessage.value = null;
    errorMessage.value = 'Somehow the import was started with invalid data. Please click back through the steps and make sure everything is correct.';
    return;
  }

  let workId = formModel.workId;

  // create the work if needed
  if(formModel.workId === -1) {
    progressMessage.value = `Creating ${formModel.workTitle}`;

    const workToCreate: ProjectCreatePayload = {
      title: formModel.workTitle,
      description: 'Imported from NaNoWriMo',
      phase: PROJECT_PHASE.DRAFTING,
      startingBalance: {},
    };

    try {
      const createdProject = await createProject(workToCreate);
      workId = createdProject.id;

      emit('project:create', { work: createdProject });
      projectStore.populate(true);
    } catch {
      errorMessage.value = 'Could not create the new project: something went wrong server-side.';
      isLoading.value = false;
      progressMessage.value = null;
      return;
    }
  }

  // batch upload the tallies
  progressMessage.value = `Importing progress`;

  const talliesToCreate: TallyCreatePayload[] = parsedCountsData.value.map(tally => ({
    date: tally.date,
    measure: tally.measure,
    count: tally.count,
    setTotal: false,
    note: '',
    workId: workId,
    tags: [],
  }));

  try {
    const createdTallies = await batchCreateTallies(talliesToCreate);
    // I don't think I need to emit a tally create event here

    successMessage.value = `The data has been imported (${createdTallies.length} ${createdTallies.length === 1 ? 'entry' : 'entries'}).`;
    hasUploadHappened.value = true;
  } catch {
    errorMessage.value = 'Could not import the data: something went wrong server-side.';
  } finally {
    isLoading.value = false;
    progressMessage.value = null;
  }
}

const activeStepperStep = ref<number>(0);
function resetWizard() {
  formModel.countsText = '';
  formModel.workId = null;
  formModel.workTitle = '';

  activeStepperStep.value = 0;
}

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="max-w-screen-lg">
      <header class="mb-4">
        <div class="actions flex gap-2 items-start">
          <SectionTitle
            title="Import Manually from NaNoWriMo"
          />
        </div>
      </header>
      <div>
        <Stepper
          v-model:active-step="activeStepperStep"
          orientation="vertical"
          linear
        >
          <StepperPanel header="Get Started">
            <template #content="{nextCallback}">
              <div class="mb-4 flex flex-col gap-2">
                <p>
                  Let's get started importing your project manually into TrackBear from NaNoWriMo! This page will walk
                  you through the process step-by-step. You will be copying the data from NaNoWriMo and pasting it in
                  here, and then you will have the chance to choose which project to import that data to, or you can
                  have TrackBear make a new project for it.
                </p>
                <p>
                  Before hitting <b>Next</b>, open <a
                    class="underline text-primary-500 dark:text-primary-400"
                    href="https://nanowrimo.org/stats"
                    target="_blank"
                  >https://nanowrimo.org/stats</a> in another tab and make sure you're logged in and that you've selected the project and challenge that you want to import.
                </p>
              </div>
              <div class="flex gap-2 mb-4">
                <div>
                  <Button
                    label="Next"
                    severity="secondary"
                    :icon="PrimeIcons.ARROW_RIGHT"
                    @click="nextCallback"
                  />
                </div>
              </div>
            </template>
          </StepperPanel>
          <StepperPanel header="Copy In Your Data">
            <template #content="{prevCallback, nextCallback}">
              <div class="mb-4 flex flex-col md:flex-row gap-4">
                <div class="max-w-64">
                  <img src="/images/import-nano-progress-updates.png">
                </div>
                <div class="flex flex-col gap-2">
                  <p>First, locate the <b>Progress Updates</b> section of the NaNoWriMo webpage.</p>
                  <p>Then, highlight the Date and Count columns and all the rows under them. Make sure you get all the rows, even the ones hidden by scrolling.</p>
                  <p>Finally, copy that text and paste it all directly into the box below.</p>
                </div>
              </div>
              <div class="mb-4 flex gap-4">
                <FieldWrapper
                  for="import-form-counts-text"
                  label="NaNoWriMo Progress Updates"
                  :rule="ruleFor('countsText')"
                  required
                >
                  <template #default="{ onUpdate, isFieldValid }">
                    <Textarea
                      id="import-form-counts-text"
                      v-model="formModel.countsText"
                      rows="10"
                      cols="25"
                      :invalid="!isFieldValid"
                      @update:model-value="onUpdate"
                    />
                  </template>
                </FieldWrapper>
              </div>
              <div class="flex gap-2 mb-4">
                <div>
                  <Button
                    label="Back"
                    severity="secondary"
                    :icon="PrimeIcons.ARROW_LEFT"
                    @click="prevCallback"
                  />
                </div>
                <div>
                  <Button
                    label="Next"
                    severity="secondary"
                    :icon="PrimeIcons.ARROW_RIGHT"
                    :disabled="!isCountsTextValid"
                    @click="nextCallback"
                  />
                </div>
              </div>
            </template>
          </StepperPanel>
          <StepperPanel header="Choose a Project">
            <template #content="{prevCallback, nextCallback}">
              <div class="mb-4 flex gap-2">
                <p>Finally, pick which project you want to import this data to. If it's for a totally new project, choose <b>New Project</b> and then type in the project name.</p>
              </div>
              <div class="mb-4 flex flex-col gap-4">
                <FieldWrapper
                  for="import-form-project"
                  label="Project"
                  :rule="ruleFor('workId')"
                  required
                >
                  <template #default="{ onUpdate, isFieldValid }">
                    <Dropdown
                      id="import-form-project"
                      v-model="formModel.workId"
                      :options="projectOptions"
                      option-label="title"
                      option-value="id"
                      placeholder="Select a project..."
                      filter
                      show-clear
                      :invalid="!isFieldValid"
                      @update:model-value="onUpdate"
                    />
                  </template>
                </FieldWrapper>
                <FieldWrapper
                  v-if="formModel.workId === -1"
                  for="import-form-project-title"
                  label="New Project Title"
                  :rule="ruleFor('workTitle')"
                  required
                >
                  <template #default="{ onUpdate, isFieldValid }">
                    <InputText
                      id="import-form-project-title"
                      v-model="formModel.workTitle"
                      :invalid="!isFieldValid"
                      @update:model-value="onUpdate"
                    />
                  </template>
                </FieldWrapper>
              </div>
              <div class="flex gap-2 mb-4">
                <div>
                  <Button
                    label="Back"
                    severity="secondary"
                    :icon="PrimeIcons.ARROW_LEFT"
                    @click="prevCallback"
                  />
                </div>
                <div>
                  <Button
                    label="Next"
                    severity="secondary"
                    :icon="PrimeIcons.ARROW_RIGHT"
                    :disabled="!isValid"
                    @click="nextCallback"
                  />
                </div>
              </div>
            </template>
          </StepperPanel>
          <StepperPanel header="Confirm Import">
            <template #content="{prevCallback, nextCallback}">
              <div class="mb-4 flex-col gap-2">
                <p>
                  When you click <b>Import</b>, the data below will be imported into
                  <span v-if="formModel.workId === -1">a new project called <b>{{ selectedProjectTitle }}</b>.</span>
                  <span v-else>your existing <b>{{ selectedProjectTitle }}</b> project.</span>
                </p>
                <DataTable :value="parsedCountsData">
                  <Column
                    field="date"
                    header="Date"
                  />
                  <Column
                    header="Count"
                  >
                    <template #body="slotProps">
                      {{ formatCount(slotProps.data.count, slotProps.data.measure) }}
                    </template>
                  </Column>
                </DataTable>
              </div>
              <div class="flex gap-2 mb-4">
                <div>
                  <Button
                    label="Back"
                    severity="secondary"
                    :icon="PrimeIcons.ARROW_LEFT"
                    @click="prevCallback"
                  />
                </div>
                <div>
                  <Button
                    label="Import"
                    :icon="PrimeIcons.FILE_IMPORT"
                    :disabled="!isValid"
                    @click="ev => { nextCallback(ev); handleImportClick(); }"
                  />
                </div>
              </div>
            </template>
          </StepperPanel>
          <StepperPanel header="Finish Importing Data">
            <template #content="{prevCallback}">
              <div class="mb-4 flex flex-col gap-4">
                <InlineMessage
                  v-if="progressMessage"
                  severity="info"
                >
                  {{ progressMessage }}
                </InlineMessage>
                <InlineMessage
                  v-if="successMessage"
                  severity="success"
                >
                  {{ successMessage }}
                </InlineMessage>
                <InlineMessage
                  v-if="errorMessage"
                  severity="error"
                >
                  {{ errorMessage }}
                </InlineMessage>
              </div>
              <div class="flex gap-2 mb-4">
                <div>
                  <Button
                    label="Back"
                    severity="secondary"
                    :icon="PrimeIcons.ARROW_LEFT"
                    :disabled="!(isLoading || hasUploadHappened)"
                    @click="prevCallback"
                  />
                </div>
                <div
                  v-if="hasUploadHappened"
                >
                  <Button
                    label="Import Another Project"
                    :icon="PrimeIcons.REPLAY"
                    @click="resetWizard"
                  />
                </div>
              </div>
            </template>
          </StepperPanel>
        </Stepper>
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
