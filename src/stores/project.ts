import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useEventBus } from '@vueuse/core';

import { getProjects, type Project, type SummarizedProject } from 'src/lib/api/project';
import { cmpByTitle, isDormant } from 'src/lib/project';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<SummarizedProject[] | null>(null);

  const allProjects = computed(() => projects.value ?? []);
  const nonDormantProjects = computed(() => allProjects.value.filter(project => !isDormant(project)));
  const starredProjects = computed(() => allProjects.value.filter(project => project.starred));

  async function populate(force = false) {
    if(force || projects.value === null) {
      const fetchedProjects = await getProjects();
      projects.value = fetchedProjects.sort(cmpByTitle);
    }
  }

  function get(id: number): SummarizedProject | null {
    return allProjects.value.find(project => project.id === id) as SummarizedProject ?? null;
  }

  function $reset() {
    projects.value = null;
  }

  useEventBus<{ project: Project }>('project:create').on(() => populate(true));
  useEventBus<{ project: Project }>('project:edit').on(() => populate(true));
  useEventBus<{ project: Project }>('project:star').on(() => populate(true));
  useEventBus<{ project: Project }>('project:cover').on(() => populate(true));
  useEventBus<{ project: Project }>('project:delete').on(() => populate(true));

  return {
    projects,
    allProjects,
    nonDormantProjects,
    starredProjects,
    populate,
    get,
    $reset,
  };
});
