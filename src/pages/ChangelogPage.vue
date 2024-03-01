<script setup lang="ts">
import { ref } from 'vue';

import { Changelog } from 'server/lib/parse-changelog.ts';
import { getChangelog } from 'src/lib/api/info.ts';

import AppPage from 'src/components/layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';
import ChangelogVersion from 'src/components/changelog/ChangelogVersion.vue';

import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';

const changelog = ref<Changelog>(null);
const errorMessage = ref<string>('');

function loadChangelog() {
  getChangelog()
    .then(c => changelog.value = c)
    .catch(err => {
      errorMessage.value = err.message;
    });
}
loadChangelog();

const CHANGELOG_FIXTURE = [
  {
    version: 'v0.0.0',
    changes: [
      { tag: 'NEW', entry: 'For new features!' },
      { tag: 'CHANGED', entry: 'For changes in existing functionality!' },
      { tag: 'FIXED', entry: 'For bug fixes!' },
      { tag: 'DEPRECATED', entry: 'For soon-to-be-removed functionality!' },
      { tag: 'REMOVED', entry: 'For functionality that have been removed!' },
      { tag: 'SECURITY', entry: 'For vulnerabilities or other security updates!', credit: 'Anonymous' },
    ]
  }
];

</script>

<template>
  <PorchLayout>
    <TextBlurb
      title="Changelog"
    >
      <ChangelogVersion
        v-for="(version, index) of changelog"
        :key="version.version"
        :version="version.version"
        :changes="version.changes"
        :hide-divider="index === 0"
      />
    </TextBlurb>
  </PorchLayout>
  <AppPage>
    <div v-if="changelog">
      <ContentHeader title="Changelog" />
      <VaCard>
        <VaCardContent>
          <ChangelogVersion
            v-for="(version, index) of changelog"
            :key="version.version"
            :version="version.version"
            :changes="version.changes"
            :hide-divider="index === 0"
          />
        </VaCardContent>
      </VaCard>
    </div>
    <div v-else>
      {{ errorMessage }}
    </div>
  </AppPage>
</template>

<style scoped>

</style>
