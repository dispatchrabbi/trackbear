<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { zStrInt } from 'server/lib/validators.ts';
import { useValidation } from 'src/lib/form.ts';

import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

import AppPage from 'src/components/layout/AppPage.vue';
import FormFieldWrapper from 'src/components/form/FormFieldWrapper.vue';
import type { Leaderboard } from '@prisma/client';
import { GOAL_TYPE_INFO } from 'src/lib/api/leaderboard.ts';
import { getLeaderboard, editLeaderboard } from 'src/lib/api/leaderboard.ts';
import type { EditLeaderboardPayload } from 'server/api/leaderboards.ts';
import { parseDateStringSafe, formatDateSafe } from 'src/lib/date.ts';

const formModel = reactive({
  title: '',
  goal: '',
  startDate: null,
  endDate: null,
});

const validations = z.object({
  title: z.string().min(1, { message: 'Please choose a name for your project.'}),
  goal: z.union([
    zStrInt({ message: 'Goal must be a whole number' }),
    z.string().length(0).transform(() => null)
  ]),
  startDate: z.date().nullish().transform(formatDateSafe),
  endDate: z.date().nullish().transform(formatDateSafe),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const typeOptions = Object.keys(GOAL_TYPE_INFO).map(type => ({ text: GOAL_TYPE_INFO[type].description, value: type }));

const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');

const leaderboard = ref<Leaderboard>(null);
function loadLeaderboard() {
  isLoading.value = true;

  const leaderboardUuid = route.params.uuid as string;
  getLeaderboard(leaderboardUuid)
    .then(lb => {
      formModel.title = lb.title;
      formModel.goal = lb.goal === null ? '' : lb.goal.toString(10);
      formModel.startDate = parseDateStringSafe(lb.startDate);
      formModel.endDate = parseDateStringSafe(lb.endDate);

      leaderboard.value = lb;
    })
    .catch(err => {
      if(err.code === 'NOT_FOUND') {
        errorMessage.value = `Could not find leaderboard with UUID ${leaderboardUuid}. How did you get here?`;
      } else {
        errorMessage.value = err.message;
      }
    }).finally(() => {
      isLoading.value = false;
    });
}
loadLeaderboard();

async function handleSubmit() {
  isLoading.value = true;
  errorMessage.value = '';

  const payload = {
    ...formData(),
  } as EditLeaderboardPayload;

  try {
    await editLeaderboard(leaderboard.value.uuid, payload);
  } catch(err) {
    errorMessage.value = err;
    return;
  } finally {
    isLoading.value = false;
  }

  router.push({ name: 'leaderboard', params: { uuid: leaderboard.value.uuid }});
}

function handleCancel() {
  router.push({ name: 'leaderboard', params: { uuid: leaderboard.value.uuid }});
}

</script>

<template>
  <AppPage require-login>
    <h2 class="va-h2 mb-3">
      Edit Leaderboard
    </h2>
    <VaCard>
      <VaCardContent v-if="leaderboard">
        <VaAlert
          v-if="errorMessage"
          class="mb-4"
          color="danger"
          border="left"
          icon="error"
          closeable
          :description="errorMessage"
        />
        <VaForm
          ref="form"
          class="flex flex-col gap-4"
          tag="form"
          @submit.prevent="validate() && handleSubmit()"
        >
          <VaInput
            v-model="formModel.title"
            label="Title"
            :rules="[ ruleFor('title') ]"
            required-mark
          />
          <FormFieldWrapper
            label="What to track"
            required
          >
            <VaRadio
              v-model="leaderboard.type"
              :options="typeOptions.filter(option => option.value === leaderboard.type)"
              text-by="text"
              value-by="value"
              vertical
              readonly
              disabled
            />
          </FormFieldWrapper>
          <VaInput
            v-if="leaderboard.type !== 'percentage'"
            v-model="formModel.goal"
            :label="leaderboard.type === 'time' ? 'Goal (in hours)' : 'Goal'"
            :rules="[ ruleFor('goal') ]"
            messages="If you add a goal, the leaderboard will track progress toward that goal."
          />
          <VaDateInput
            v-model="formModel.startDate"
            label="Start Date"
            placeholder="YYYY-MM-DD"
            messages="If you don't provide a start date, the leaderboard will show all updates from all projects."
            :format="formatDateSafe"
            :parse="parseDateStringSafe"
            manual-input
            clearable
          />
          <VaDateInput
            v-model="formModel.endDate"
            label="End Date"
            messages="If you provide an end date along with your goal, the leaderboard will track progress toward your deadline."
            placeholder="YYYY-MM-DD"
            :format="formatDateSafe"
            :parse="parseDateStringSafe"
            manual-input
            clearable
          />
          <div class="flex gap-4 mt-4">
            <VaButton
              :disabled="!isValid"
              :loading="isLoading"
              type="submit"
            >
              Save
            </VaButton>
            <VaButton
              preset="secondary"
              border-color="primary"
              @click="handleCancel"
            >
              Cancel
            </VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </AppPage>
</template>

<style scoped>
.required-mark {
  transform: translate(0, -2px);
  color: var(--va-danger);
  font-size: 18px;
  font-weight: var(--va-input-container-label-font-weight);
  vertical-align: middle;
}
</style>
