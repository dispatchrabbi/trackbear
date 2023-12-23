<script setup lang="ts">
import { ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { useToast } from 'vuestic-ui';
const { notify } = useToast();

import { getProject } from '../lib/api/project.ts';
import { Project, Update, makeShareUrl } from '../lib/project.ts';

import AppPage from './layout/AppPage.vue';
import EnterProgress from './project/EnterProgress.vue';
import ProjectGoal from './project/ProjectGoal.vue';
import ProjectStats from './project/ProjectStats.vue';
import ProjectHistory from './project/ProjectHistory.vue';
import ProgressChart from './project/ProgressChart.vue';

const project = ref<Project>(null);
const errorMessage = ref<string>('');

function loadProject() {
  const projectIdStr = route.params.id as string;
  if(Number.parseInt(projectIdStr, 10) !== +projectIdStr) {
    router.push('/projects');
    return;
  }

  const projectId = +projectIdStr;
  getProject(projectId)
    .then(p => project.value = p)
    .catch(err => {
      if(err.code === 'NOT_FOUND') {
        errorMessage.value = `Could not find project with ID ${projectId}. How did you get here?`;
      } else {
        errorMessage.value = err.message;
      }
    });
}
loadProject();

function handleNewUpdate(update: Update) {
  project.value.updates.push(update);
}
function handleEditUpdate(update: Update) {
  const ix = project.value.updates.findIndex(u => u.id === update.id);
  project.value.updates[ix] = update;
}
function handleDeleteUpdate(updateId: number) {
  const ix = project.value.updates.findIndex(u => u.id === updateId);
  if(ix >= 0) {
    project.value.updates.splice(ix, 1);
  }
}

// TODO: make this a dropdown with the link in text and a separate copy button
async function handleShareClick() {
  const shareUrl = makeShareUrl(project.value);
  try {
    await navigator.clipboard.writeText(shareUrl.toString());
    notify({
      message: 'Link copied!',
      color: 'success',
    });
  } catch(err) {
    notify({
      message: "Couldn't copy the link — are you on a weird browser?",
      color: 'danger',
    });
  }
}

</script>

<template>
  <AppPage require-login>
    <div v-if="project">
      <div class="flex gap-4 items-center">
        <h2 class="va-h2 mb-3">
          {{ project.title }}
        </h2>
        <div
          v-if="project.visibility === 'public'"
          class="shrink"
        >
          <VaIcon
            name="share"
            size="large"
            title="Get a public link to this project"
            class="cursor-pointer"
            @click="handleShareClick"
          />
        </div>
        <div class="shrink">
          <RouterLink :to="{ name: 'edit-project', params: { id: project.id } }">
            <VaIcon
              name="edit"
              size="large"
              title="Edit project"
            />
          </RouterLink>
        </div>
      </div>
      <div class="grid grid-cols-6 gap-4">
        <div class="col-span-2 flex flex-col justify-start gap-4">
          <div class="project-enter-progress shrink">
            <EnterProgress
              :project="project"
              @new-update="handleNewUpdate"
            />
          </div>
          <div
            v-if="project.goal || project.startDate || project.endDate"
            class="project-goal shrink"
          >
            <ProjectGoal
              :project="project"
              address-user
            />
          </div>
          <div class="project-stats shrink">
            <ProjectStats :project="project" />
          </div>
        </div>
        <div class="col-span-4 flex flex-col justify-start gap-4">
          <div class="project-graph shrink">
            <VaCard class="h-full">
              <VaCardTitle>Progress So Far</VaCardTitle>
              <VaCardContent>
                <ProgressChart
                  :id="`project-chart-${project.id}`"
                  :project="project"
                  :updates="project.updates"
                  :show-par="true"
                  :show-tooltips="true"
                />
              </VaCardContent>
            </VaCard>
          </div>
          <div class="project-history shrink">
            <ProjectHistory
              :project="project"
              show-update-times
              allow-edits
              @edit-update="handleEditUpdate"
              @delete-update="handleDeleteUpdate"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      {{ errorMessage }}
    </div>
  </AppPage>
</template>

<style scoped>

</style>
