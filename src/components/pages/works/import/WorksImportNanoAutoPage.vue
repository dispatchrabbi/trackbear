<script setup lang="ts">
import { RouterLink } from 'vue-router';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import type { MenuItem } from 'primevue/menuitem';
import Stepper from 'primevue/stepper';
import StepperPanel from 'primevue/stepperpanel';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Projects', url: '/works' },
  { label: 'Import', url: '/works/import' },
  { label: 'Automatically from NaNoWriMo', url: '/works/import/nano-auto' },
];

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <header class="mb-4">
      <div class="actions flex gap-2 items-start">
        <SectionTitle
          title="Import Automatically from NaNoWriMo"
        />
      </div>
    </header>
    <div>
      Not implemented yet. Sorry!
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
