<script setup lang="ts">
import Panel from 'primevue/panel';

const props = withDefaults(defineProps<{
  header: string;
  toggleable?: boolean;
  collapsed?: boolean;
}>(), {
  toggleable: true,
  collapsed: true,
});
</script>

<template>
  <Panel
    :header="props.header"
    :toggleable="props.toggleable"
    :collapsed="props.collapsed"
    :pt="{ header: { class: '!bg-danger-200 dark:!bg-danger-900' } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
  >
    <slot />
  </Panel>
</template>
