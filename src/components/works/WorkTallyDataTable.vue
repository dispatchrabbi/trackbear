<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Tally } from 'src/lib/api/tally.ts';
import type { Tag } from 'src/lib/api/tag.ts';

import { formatCount } from 'src/lib/tally.ts';

const props = defineProps<{
  tallies: Array<Tally & { tags: Tag[] }>
}>();

const sortedTallies = computed(() => props.tallies.toSorted((a, b) => {
  // most recent first, break ties by createdAt (most recent first)
  return a.date < b.date ? 1 : a.date > b.date ? -1 :
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}));

// TODO: maybe switch to DataView at some point?
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Chip from 'primevue/chip';

</script>

<template>
  <DataTable :value="sortedTallies">
    <Column
      field="date"
      header="Date"
    />
    <Column
      header="Progress"
    >
      <template #body="{ data }">
        {{ formatCount(data.count, data.measure) }}
      </template>
    </Column>
    <Column
      field="tags"
      header="Tags"
    >
      <template #body="{ data }">
        <Chip
          v-for="tag of data.tags"
          :key="tag.id"
          :label="tag.name"
          class="mr-1"
        />
      </template>
    </Column>
    <Column
      field="note"
      header="Note"
    />
  </DataTable>
</template>

<style scoped>
</style>
