<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';

import type { Project } from 'src/lib/api/project';
import type { TallyWithTags } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';
import { formatCount } from 'src/lib/tally.ts';

// TODO: maybe switch to DataView at some point?
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import TbTag from '../tag/TbTag.vue';
import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import EditTallyForm from '../tally/EditTallyForm.vue';
import DeleteTallyForm from '../tally/DeleteTallyForm.vue';

const props = defineProps<{
  project: Project;
  tallies: Array<TallyWithTags>;
}>();

const sortedTallies = computed(() => props.tallies.toSorted((a, b) => {
  // oldest first, break ties by createdAt (oldest first)
  return a.date < b.date ?
      -1 :
    a.date > b.date ?
      1 :
      a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}));

const chartRows = computed(() => {
  const totals = Object.values(TALLY_MEASURE).reduce((obj, measure: string) => {
    obj[measure] = props.project.startingBalance[measure] || 0;
    return obj;
  }, {});
  const rows = Object.keys(props.project.startingBalance)
    .filter(measure => props.project.startingBalance[measure] !== null)
    .map(measure => ({
      tally: null,
      date: null,
      progress: null,
      total: formatCount(props.project.startingBalance[measure], measure),
      tags: [],
      note: 'Starting Balance',
    }));

  for(const tally of sortedTallies.value) {
    totals[tally.measure] += tally.count;

    rows.push({
      tally,
      date: tally.date,
      progress: formatCount(tally.count, tally.measure),
      total: formatCount(totals[tally.measure], tally.measure),
      tags: tally.tags,
      note: tally.note,
    });
  }

  return rows.toReversed();
});

const currentlyEditingTally = ref<TallyWithTags>(null);
const isEditFormVisible = computed({
  get: () => currentlyEditingTally.value !== null,
  set: () => currentlyEditingTally.value = null, // nothing sensible to set it to unless it's null
});

const currentlyDeletingTally = ref<TallyWithTags>(null);
const isDeleteFormVisible = computed({
  get: () => currentlyDeletingTally.value !== null,
  set: () => currentlyDeletingTally.value = null, // nothing sensible to set it to unless it's null
});

</script>

<template>
  <DataTable
    :value="chartRows"
    sort-field="date"
    :sort-order="-1"
    paginator
    :rows="30"
    :rows-per-page-options="[30, 60, 90]"
    paginator-template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
    current-page-report-template="{first} to {last} of {totalRecords}"
  >
    <Column
      field="date"
      header="Date"
    />
    <Column
      field="progress"
      header="Progress"
      class="whitespace-nowrap"
    />
    <Column
      field="total"
      header="Total"
      class="whitespace-nowrap"
    />
    <Column
      field="tags"
      header="Tags"
    >
      <template #body="{ data }">
        <TbTag
          v-for="tag of data.tags"
          :key="tag.id"
          :tag="tag"
          class="mr-1"
        />
      </template>
    </Column>
    <Column
      field="note"
      header="Note"
    />
    <Column
      header=""
      class="w-0 text-center"
    >
      <template #body="{ data }">
        <div
          v-if="data.tally !== null"
          class="flex gap-1"
        >
          <Button
            :icon="PrimeIcons.PENCIL"
            severity="secondary"
            text
            rounded
            @click="currentlyEditingTally = data.tally"
          />
          <Button
            :icon="PrimeIcons.TRASH"
            severity="danger"
            text
            rounded
            @click="currentlyDeletingTally = data.tally"
          />
        </div>
      </template>
    </Column>
  </DataTable>
  <Dialog
    v-model:visible="isEditFormVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span :class="PrimeIcons.PENCIL" />
        Edit Progress Entry
      </h2>
    </template>
    <EditTallyForm
      :tally="currentlyEditingTally"
      @form-success="currentlyEditingTally = null"
    />
  </Dialog>
  <Dialog
    v-model:visible="isDeleteFormVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span :class="PrimeIcons.TRASH" />
        Delete Progress Entry
      </h2>
    </template>
    <DeleteTallyForm
      :tally="currentlyDeletingTally"
      @form-success="currentlyDeletingTally = null"
    />
  </Dialog>
</template>

<style scoped>
</style>
