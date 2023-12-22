<script setup lang="ts">
import { computed } from 'vue';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Project, Update, TYPE_INFO } from '../../lib/project.ts';
import { formatTimeProgress } from '../../lib/date.ts';

const props = defineProps<{ project: Project }>();

function makeRows(project: Project) {
  const rows = project.updates
    .sort((a: Update, b: Update) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
    .map((update: Update) => ({
      date: update.date,
      value: props.project.type === 'time' ? formatTimeProgress(update.value) : update.value,
      updated: update.updatedAt,
    }));

  return rows;
}
const items = computed(() => makeRows(props.project));

const columns = computed(() => {
  return [
    { key: 'date', label: 'Date' },
    { key: 'value', label: TYPE_INFO[props.project.type].description, thAlign: 'right', tdAlign: 'right' },
  ];
});

</script>

<template>
  <VaCard>
    <VaCardTitle>History</VaCardTitle>
    <VaCardContent>
      <VaDataTable
        v-if="items.length"
        :items="items"
        :columns="columns"
      >
        <template #cell(date)="{ value, rowData }">
          {{ value }}
          <VaPopover
            placement="top"
            :message="`${formatDistanceToNow(parseISO(rowData.updated))} ago`"
          >
            <VaIcon
              name="history"
              size="small"
              class="mb-1"
            />
          </VaPopover>
        </template>
      </VaDataTable>
      <div
        v-else
        class="text-center"
      >
        Nothing yet. Get writing! 📝
      </div>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
