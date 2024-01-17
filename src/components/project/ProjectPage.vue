<script setup lang="ts">
import { ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { useToast } from 'vuestic-ui';
const { notify } = useToast();

import type { Update } from '@prisma/client';
import type { ProjectWithUpdatesAndLeaderboards } from 'server/api/projects.ts';
import { getProject } from 'src/lib/api/project.ts';
import { makeShareUrl } from 'src/lib/project.ts';

import AppPage from 'src/components/layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';
import EnterProgress from 'src/components/project/widgets/EnterProgress.vue';
import ProjectGoal from 'src/components/project/widgets/ProjectGoal.vue';
import ProjectStats from 'src/components/project/widgets/ProjectStats.vue';
import ProjectHistory from 'src/components/project/widgets/ProjectHistory.vue';
import ProjectChart from 'src/components/project/widgets/ProjectChart.vue';

const project = ref<ProjectWithUpdatesAndLeaderboards>(null);
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

const showGraphModal = ref<boolean>(false);

</script>

<template>
  <AppPage require-login>
    <div v-if="project">
      <ContentHeader :title="project.title">
        <template #actions>
          <div v-if="project.visibility === 'public'">
            <VaIcon
              name="share"
              size="large"
              title="Get a public link to this project"
              class="cursor-pointer"
              @click="handleShareClick"
            />
          </div>
          <div>
            <RouterLink :to="{ name: 'edit-project', params: { id: project.id } }">
              <VaIcon
                name="edit"
                size="large"
                title="Edit project"
              />
            </RouterLink>
          </div>
        </template>
      </ContentHeader>
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div class="md:col-span-2 flex flex-col justify-start gap-4">
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
          <div
            class="project-stats shrink"
          >
            <ProjectStats :project="project" />
          </div>
          <div
            v-if="project.leaderboards.length > 0"
            class="project-leaderboards shrink"
          >
            <VaCard>
              <VaCardTitle>Leaderboards</VaCardTitle>
              <VaCardContent>
                <VaList>
                  <VaListItem
                    v-for="leaderboard in project.leaderboards"
                    :key="leaderboard.uuid"
                  >
                    <VaListItemSection>
                      <VaListItemLabel>
                        <RouterLink :to="`/leaderboards/${leaderboard.uuid}`">
                          <div
                            :title="leaderboard.title"
                          >
                            {{ leaderboard.title }}
                          </div>
                        </RouterLink>
                      </VaListItemLabel>
                    </VaListItemSection>
                  </VaListItem>
                </VaList>
              </VaCardContent>
            </VaCard>
          </div>
        </div>
        <div class="md:col-span-4 flex flex-col justify-start gap-4">
          <div class="project-chart shrink">
            <VaCard>
              <VaCardTitle>
                <div class="flex gap-4 items-center w-full">
                  <div class="grow">
                    Progress So Far
                  </div>
                  <div class="shrink">
                    <VaIcon
                      class="cursor-pointer"
                      name="zoom_out_map"
                      size="medium"
                      title="Fullscreen"
                      @click="showGraphModal = true"
                    />
                  </div>
                </div>
              </VaCardTitle>
              <VaCardContent>
                <ProjectChart
                  :id="`project-chart-${project.id}`"
                  :project="project"
                  show-par
                  show-tooltips
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
      <VaModal
        v-model="showGraphModal"
        class="project-chart-modal"
        fullscreen
        hide-default-actions
        close-button
      >
        <ProjectChart
          :id="`modal-project-chart-${project.id}`"
          :project="project"
          show-par
          show-tooltips
          is-fullscreen
        />
      </VaModal>
    </div>
    <div v-else>
      {{ errorMessage }}
    </div>
  </AppPage>
</template>

<style scoped>

</style>
