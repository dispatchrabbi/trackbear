import { callApi } from "./api";
import type { Project, Update } from "../project.ts";
import type { CreateProjectPayload, ProjectResponse, CreateUpdatePayload } from '../../../server/api/projects.ts';

async function getProjects() {
  const response = await callApi<ProjectResponse[]>('/api/projects', 'GET');

  if(response.success) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function getProject(id: number) {
  const response = await callApi<ProjectResponse>(`/api/projects/${id}`, 'GET');

  if(response.success) {
    return response.data;
  } else {
    // TODO: I really have to standardize on how I'm returning multiple status types here
    throw {
      status: response.status,
      error: response.error,
    };
  }
}

async function createProject(project: CreateProjectPayload) {
  const response = await callApi<ProjectResponse>('/api/projects', 'POST', project);

  if(response.success) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function createUpdate(project: Project, update: CreateUpdatePayload): Promise<Update> {
  const response = await callApi<Update>(`/api/projects/${project.id}/update`, 'POST', update);

  if(response.success) {
    return response.data;
  } else {
    throw response.error;
  }
}

export {
  getProjects,
  getProject,
  createProject,
  createUpdate,
};
