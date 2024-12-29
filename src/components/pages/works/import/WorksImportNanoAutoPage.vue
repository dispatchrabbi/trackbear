<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();

import NaNoWriMo, { NaNoWriMoProject, NaNoWriMoChallenge, NaNoWriMoSession } from 'src/lib/nanowrimo/nanowrimo.ts';

import { createWork } from 'src/lib/api/work.ts';
import { WORK_PHASE } from 'server/lib/models/work/consts';
import { batchCreateTallies, type TallyCreatePayload } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';
import { formatCount } from 'src/lib/tally.ts';
import { createGoal, GoalCreatePayload } from 'src/lib/api/goal.ts';
import { GOAL_TYPE } from 'server/lib/models/goal.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

import type { MenuItem } from 'primevue/menuitem';
import Stepper from 'primevue/stepper';
import StepperPanel from 'primevue/stepperpanel';
import Fieldset from 'primevue/fieldset';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import InlineMessage from 'primevue/inlinemessage';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Projects', url: '/works' },
  { label: 'Import', url: '/works/import' },
  { label: 'Automatically from NaNoWriMo', url: '/works/import/nano-auto' },
];

// set up the project options
await workStore.populate();
const NEW_PROJECT_ID = -1;
const DO_NOT_IMPORT_ID = -2;
const importTargetOptions = computed(() => {
  return [
    { title: '[New Project]', id: NEW_PROJECT_ID },
    { title: '[Do Not Import]', id: DO_NOT_IMPORT_ID },
    ...workStore.works,
  ];
});

// nano data
const nanoApi = new NaNoWriMo();
const nanoData = ref({
  projects: [] as NaNoWriMoProject[],
  challenges: [] as NaNoWriMoChallenge[],
  sessions: [] as NaNoWriMoSession[],
});
type ImportTarget = { id: number; project: NaNoWriMoProject; target: number; };
const importTargets = ref<ImportTarget[]>([]);

// credentials form
const credentialsFormModel = reactive({
  username: '',
  password: '',
});

const credentialsValidations = z.object({
  username: z.string().min(1, { message: 'Please enter your NaNoWriMo username.'}),
  password: z.string().min(1, { message: 'Please enter your NaNoWriMo password.'}),
});

const { ruleFor, isValid } = useValidation(credentialsValidations, credentialsFormModel);

const loginSignals = reactive({
  isLoading: false,
  hasSucceeded: false,
  progressMessage: null,
  successMessage: null,
  errorMessage: null,
});
async function handleLoginClick(ev, nextCallback) {
  loginSignals.isLoading = false;
  loginSignals.hasSucceeded = false;
  loginSignals.progressMessage = null;
  loginSignals.successMessage = null;
  loginSignals.errorMessage = null;

  if(!isValid) {
    loginSignals.errorMessage = 'Please enter your NaNoWriMo username and password.';
    return;
  }

  loginSignals.isLoading = true;

  // let's log in!
  try {
    loginSignals.progressMessage = 'Logging in to NaNoWriMo...';
    await nanoApi.login(credentialsFormModel.username, credentialsFormModel.password);
  } catch(err) {
    loginSignals.errorMessage = `Could not log in: ${err.message}`;
    loginSignals.progressMessage = null;
    loginSignals.isLoading = false;
    return;
  }

  // and now we need to grab the info
  try {
    loginSignals.progressMessage = 'Fetching your projects...';
    const projectInfo = await nanoApi.getProjectInfo();
    nanoData.value = projectInfo;
    importTargets.value = projectInfo.projects.map(project => ({
      id: project.id,
      project: project,
      target: NEW_PROJECT_ID,
    }));

    loginSignals.successMessage = 'Successfully fetched all your projects from NaNoWriMo!';
    loginSignals.hasSucceeded = true;
  } catch(err) {
    loginSignals.errorMessage = `Could not fetch your projects: ${err.message}`;
    return;
  } finally {
    loginSignals.progressMessage = null;
    loginSignals.isLoading = false;
  }

  // success! leave the message up for a second
  await wait(1000);
  nextCallback(ev);
}

// import handler
const importSignals = reactive({
  isLoading: false,
  progressMessage: null,
  successMessage: null,
  errorMessage: null,
});
const importResults = ref([]);
async function handleImportClick() {
  // reset the signals
  importSignals.isLoading = false;
  importSignals.progressMessage = null;
  importSignals.successMessage = null;
  importSignals.errorMessage = null;

  importSignals.isLoading = true;
  importSignals.progressMessage = 'Starting import...';

  const results = [];

  for(const target of importTargets.value) {
    importSignals.progressMessage = `Importing ${target.project.title}...`;
    const result = await importNanoProject(target);
    results.push(result);
  }

  importResults.value = results;

  const successes = results.filter(r => r.skipped || (r.workError === null && r.tallyError === null && r.goalError === null));
  if(successes.length === results.length) {
    importSignals.successMessage = 'Your NaNoWriMo projects have all been imported into TrackBear!';
  } else {
    importSignals.errorMessage = 'There was an error importing some of your NaNoWriMo projects into TrackBear. See below for details.';
  }
  importSignals.progressMessage = null;
  importSignals.isLoading = false;

  // we probably created a bunch of new works, so repopulate this
  workStore.populate(true);
}

async function importNanoProject(target: ImportTarget) {
  const result = {
    nanoId: target.project.id,
    nanoName: target.project.title,
    tbId: target.target,
    tbName: target.target >= 0 ? workStore.works.find(w => w.id === target.target).title : null,
    skipped: false,
    workCreated: false,
    workError: null,
    talliesImported: false,
    tallyError: null,
    goalsCreated: false,
    goalError: null,
  };

  // should we skip this?
  if(target.target === DO_NOT_IMPORT_ID) {
    result.skipped = true;
    return result;
  }

  // should we create a new project?
  if(target.target === NEW_PROJECT_ID) {
    try {
      const workPayload = {
        title: target.project.title,
        description: target.project.summary || '',
        phase: WORK_PHASE.DRAFTING,
        startingBalance: {},
      };
      const createdWork = await createWork(workPayload);

      result.tbId = createdWork.id;
      result.tbName = createdWork.title;

      result.workCreated = true;
    } catch(err) {
      result.workCreated = false;
      result.workError = `Could not create a new project: ${err.message}`;
      return result;
    }
  }

  // batch upload the tallies
  try {
    const batchTallyPayload: TallyCreatePayload[] = nanoData.value.sessions.filter(session => session.projectId === result.nanoId).map(session => ({
      date: session.date,
      measure: TALLY_MEASURE.WORD,
      count: session.count,
      setTotal: false,
      note: '',
      workId: result.tbId,
      tags: [],
    }));
    await batchCreateTallies(batchTallyPayload);

    result.talliesImported = true;
  } catch(err) {
    result.talliesImported = false;
    result.tallyError = `Could not import progress: ${err.message}`;
    return result;
  }

  // create all goals that need to be created
  try {
    const batchGoalPayload: GoalCreatePayload[] = nanoData.value.challenges.filter(challenge => challenge.projectId === result.nanoId).map(challenge => ({
      title: challenge.name,
      description: '',
      type: GOAL_TYPE.TARGET,
      parameters: {
        threshold: {
          measure: TALLY_MEASURE.WORD,
          count: challenge.goal,
        },
      },
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      works: [ result.tbId ],
      tags: [],
    }));
    await Promise.all(batchGoalPayload.map(payload => createGoal(payload)));

    result.goalsCreated = true;
  } catch(err) {
    result.goalsCreated = false;
    result.goalError = `Could not create goals: ${err.message}`;
    return result;
  }

  // return the result
  return result;
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
            title="Import Automatically from NaNoWriMo"
          />
        </div>
      </header>
      <div>
        <Stepper
          orientation="vertical"
          linear
        >
          <StepperPanel header="Get Started">
            <template #content="{nextCallback}">
              <div class="mb-4 flex flex-col gap-2">
                <p>
                  Let's get started importing your projects into TrackBear from NaNoWriMo! This page will walk you
                  through the process step-by-step.
                </p>
                <p>
                  TrackBear will first ask for your NaNoWriMo username and password so that it can log into
                  NaNoWriMo's website on your behalf and retrieve information about your projects.
                </p>
                <p>
                  You will then be shown a list of your NaNoWriMo projects and can choose which ones you want to import.
                  For each NaNoWriMo project, you can choose which TrackBear project to import it into (or have
                  TrackBear create a new project for it). TrackBear will also create target goals for those projects
                  (if you want) so that you can easily see your progress versus par from bygone NaNos.
                </p>
                <p>
                  Lastly, when you hit <b>Import</b>, TrackBear will grab the information it needs from NaNoWriMo's
                  website and import it, creating projects and goals as needed. (If you are importing into
                  existing projects that have starting balances, you may need to adjust those starting balances in order
                  to account for the new history.) And that's it — all your NaNoWriMo projects will now be imported.
                </p>
                <Fieldset
                  legend="Is it safe to give TrackBear my NaNoWriMo login information?"
                >
                  <p class="text-sm -mt-4">
                    TrackBear does not keep or store your NaNoWriMo username or password; this is a one-time use only.
                    Once you leave the import page, TrackBear will no longer have your login information. Given how
                    NaNoWriMo's website is currently structured, this is the most secure way for TrackBear to be able
                    to access your NaNoWriMo projects — but if you have concerns, you can always use the manual import
                    instead.
                  </p>
                </Fieldset>
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
          <StepperPanel header="Log Into NaNoWriMo">
            <template #content="{prevCallback, nextCallback}">
              <div class="mb-4 flex gap-2">
                <p>Please enter the username and password you use to login on NaNoWriMo.org.</p>
              </div>
              <div class="mb-4 flex flex-col gap-4">
                <FieldWrapper
                  for="credentials-form-username"
                  label="Username"
                  :rule="ruleFor('username')"
                  required
                >
                  <template #default="{ onUpdate, isFieldValid }">
                    <InputText
                      id="credentials-form-username"
                      v-model="credentialsFormModel.username"
                      :invalid="!isFieldValid"
                      @update:model-value="onUpdate"
                    />
                  </template>
                </FieldWrapper>
                <FieldWrapper
                  for="credentials-form-password"
                  label="Password"
                  :rule="ruleFor('password')"
                  required
                >
                  <template #default="{ onUpdate, isFieldValid }">
                    <Password
                      id="credentials-form-password"
                      v-model="credentialsFormModel.password"
                      :invalid="!isFieldValid"
                      :feedback="false"
                      toggle-mask
                      :pt="{ input: { root: { class: 'w-full pr-8' } } }"
                      :pt-options="{ mergeSections: true, mergeProps: true }"
                      @update:model-value="onUpdate"
                    />
                  </template>
                </FieldWrapper>
              </div>
              <div class="flex flex-wrap gap-2 mb-4">
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
                    :label="loginSignals.isLoading ? 'Logging In...' : 'Log In'"
                    :icon="PrimeIcons.ARROW_RIGHT"
                    :loading="loginSignals.isLoading"
                    :disabled="loginSignals.isLoading || !isValid"
                    @click="ev => handleLoginClick(ev, nextCallback)"
                  />
                </div>
                <div>
                  <InlineMessage
                    v-if="loginSignals.progressMessage"
                    severity="info"
                  >
                    {{ loginSignals.progressMessage }}
                  </InlineMessage>
                  <InlineMessage
                    v-if="loginSignals.successMessage"
                    severity="success"
                  >
                    {{ loginSignals.successMessage }}
                  </InlineMessage>
                  <InlineMessage
                    v-if="loginSignals.errorMessage"
                    severity="error"
                  >
                    {{ loginSignals.errorMessage }}
                  </InlineMessage>
                </div>
              </div>
            </template>
          </StepperPanel>
          <StepperPanel header="Select Projects To Import">
            <template #content="{prevCallback, nextCallback}">
              <div class="mb-4 flex flex-col gap-2">
                <p>
                  All of the projects retrieved from your NaNoWriMo account are listed below. For each NaNoWriMo project,
                  choose how you want TrackBear to import it.
                </p>
                <p>
                  Choosing an existing TrackBear project will import the
                  NaNoWriMo project updates into that TrackBear project. Choosing "[New Project]" will create a new
                  TrackBear project to import the NaNoWriMo updates into. Choosing "[Do Not Import]" will skip
                  importing that project.
                </p>
              </div>
              <div class="mb-4">
                <DataTable
                  :value="importTargets"
                >
                  <Column header="NaNoWriMo Project">
                    <template #body="slotProps">
                      {{ slotProps.data.project.title }} ({{ formatCount(slotProps.data.project.total || 0, TALLY_MEASURE.WORD) }})
                    </template>
                  </Column>
                  <Column header="Import To...">
                    <template #body="slotProps">
                      <Dropdown
                        v-model="importTargets[slotProps.index].target"
                        :options="importTargetOptions"
                        option-label="title"
                        option-value="id"
                      />
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
                    @click="ev => { nextCallback(ev); handleImportClick(); }"
                  />
                </div>
              </div>
            </template>
          </StepperPanel>
          <StepperPanel header="Import Data">
            <template #content>
              <div class="mb-4 flex flex-col gap-4">
                <InlineMessage
                  v-if="importSignals.progressMessage"
                  severity="info"
                >
                  {{ importSignals.progressMessage }}
                </InlineMessage>
                <InlineMessage
                  v-if="importSignals.successMessage"
                  severity="success"
                >
                  {{ importSignals.successMessage }}
                </InlineMessage>
                <InlineMessage
                  v-if="importSignals.errorMessage"
                  severity="error"
                >
                  {{ importSignals.errorMessage }}
                </InlineMessage>
              </div>
              <div
                v-if="importResults.length > 0"
                class="mb-4 flex flex-col gap-4"
              >
                <DataTable
                  :value="importResults"
                >
                  <Column header="NaNoWriMo Project">
                    <template #body="slotProps">
                      {{ slotProps.data.nanoName }}
                    </template>
                  </Column>
                  <Column header="Result">
                    <template #body="slotProps">
                      {{ slotProps.data.skipped ? 'Skipped' : (slotProps.data.workError || slotProps.data.tallyError || slotProps.data.goalError || 'Successfully imported') }}
                    </template>
                  </Column>
                </DataTable>
                <p>
                  If your totals look off, don't forget to check and modify your starting balances to account for the added history!
                </p>
              </div>
              <!-- <div class="flex gap-2 mb-4">
                <div>
                  <Button
                    label="Back"
                    severity="secondary"
                    :icon="PrimeIcons.ARROW_LEFT"
                    :disabled="false"
                    @click="prevCallback"
                  />
                </div>
              </div> -->
            </template>
          </StepperPanel>
        </Stepper>
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
