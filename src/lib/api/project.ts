import { callApi } from "./api.ts";
import type { Project, Update } from '@prisma/client';
import type { CreateProjectPayload, CreateUpdatePayload, EditProjectPayload, ProjectWithUpdatesAndLeaderboards, ProjectWithUpdates } from 'server/api/projects.ts';

async function getProjects() {
  const response = await callApi<ProjectWithUpdates[]>('/api/projects', 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function getProject(id: number) {
  const response = await callApi<ProjectWithUpdatesAndLeaderboards>(`/api/projects/${id}`, 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function createProject(project: CreateProjectPayload) {
  const response = await callApi<Project>('/api/projects', 'POST', project);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function editProject(projectId: number, project: EditProjectPayload) {
  const response = await callApi<Project>(`/api/projects/${projectId}`, 'POST', project);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function createUpdate(project: Project, update: CreateUpdatePayload): Promise<Update> {
  const response = await callApi<Update>(`/api/projects/${project.id}/update`, 'POST', update);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function editUpdate(project: Project, updateId: number, update: CreateUpdatePayload): Promise<Update> {
  const response = await callApi<Update>(`/api/projects/${project.id}/update/${updateId}`, 'POST', update);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function deleteUpdate(project: Project, updateId: number): Promise<null> {
  const response = await callApi<null>(`/api/projects/${project.id}/update/${updateId}`, 'DELETE');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export {
  getProjects,
  getProject,
  createProject,
  editProject,
  createUpdate,
  editUpdate,
  deleteUpdate,
};
