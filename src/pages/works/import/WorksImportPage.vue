<script setup lang="ts">
import { RouterLink } from 'vue-router';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import type { MenuItem } from 'primevue/menuitem';
import Card from 'primevue/card';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Projects', url: '/works' },
  { label: 'Import', url: '/works/import' },
];

const importMethods = [
  {
    sectionTitle: 'Import from NaNoWriMo',
    methods: [
      {
        title: 'Manual Import',
        icon: PrimeIcons.COPY,
        details: [`Import a single project by copying and pasting data from NaNoWriMo's website.`],
        route: 'import-works-nano-manual',
      },
    ],
  },
  {
    sectionTitle: 'Import from anywhere (Coming soon!)',
    methods: [
      {
        title: 'Upload a CSV',
        icon: PrimeIcons.UPLOAD,
        details: [`Import a single project by uploading a CSV file.`, `(Coming soon!)`],
        // route: 'import-works-csv',
        route: 'import-works',
      },
      {
        title: 'Manual Import',
        icon: PrimeIcons.COPY,
        details: [`Import a single project by copying and pasting data into TrackBear.`, `(Coming soon!)`],
        // route: 'import-works-manual',
        route: 'import-works',
      },
    ],
  },
];

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-for="(section, sindex) in importMethods"
      :key="sindex"
      class="mb-8"
    >
      <SectionTitle :title="section.sectionTitle" />
      <div class="flex flex-col md:flex-row gap-4">
        <RouterLink
          v-for="(method, mindex) of section.methods"
          :key="mindex"
          :to="{ name: method.route }"
        >
          <Card
            class="max-w-half"
            :pt="{ content: { class: '!py-0' } }"
            :pt-options="{ mergeSections: true, mergeProps: true }"
          >
            <template #title>
              <div class="flex gap-2 items-baseline">
                <i :class="method.icon" />
                <div>{{ method.title }}</div>
              </div>
            </template>
            <template #content>
              <p
                v-for="(graf, pindex) in method.details"
                :key="pindex"
              >
                {{ graf }}
              </p>
            </template>
          </Card>
        </RouterLink>
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
