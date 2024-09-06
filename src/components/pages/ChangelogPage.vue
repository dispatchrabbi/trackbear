<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { Changelog } from 'server/lib/parse-changelog.ts';
import { getChangelog } from 'src/lib/api/info.ts';

import { useLastChangelogViewed, getCurrentVersion } from 'src/lib/changelog.ts';
const lastChangelogViewed = useLastChangelogViewed();

import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';
import ChangelogVersion from 'src/components/changelog/ChangelogVersion.vue';

const changelog = ref<Changelog>(null);
const errorMessage = ref<string>('');

async function loadChangelog() {
  try {
    const result = await getChangelog();
    changelog.value = result;
  } catch(err) {
    errorMessage.value = err.message;
  }
}

function updateLastViewed() {
  lastChangelogViewed.value = getCurrentVersion();
}

onMounted(async () => {
  await loadChangelog();
  updateLastViewed();
});

// const CHANGELOG_FIXTURE = [
//   {
//     version: 'v0.0.0',
//     changes: [
//       { tag: 'NEW', entry: 'For new features!' },
//       { tag: 'CHANGED', entry: 'For changes in existing functionality!' },
//       { tag: 'FIXED', entry: 'For bug fixes!' },
//       { tag: 'DEPRECATED', entry: 'For soon-to-be-removed functionality!' },
//       { tag: 'REMOVED', entry: 'For functionality that have been removed!' },
//       { tag: 'SECURITY', entry: 'For vulnerabilities or other security updates!', credit: 'Anonymous' },
//     ]
//   }
// ];

</script>

<template>
  <PorchLayout>
    <TextBlurb
      v-if="changelog"
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
    <div v-else>
      {{ errorMessage }}
    </div>
  </PorchLayout>
</template>

<style scoped>

</style>
