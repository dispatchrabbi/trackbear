import { callApi } from "./api";
import { CreateProjectPayload, ProjectResponse } from '../../../server/api/projects.ts';

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
    throw response.error;
  }
}

async function createProject(project: CreateProjectPayload) {
  const response = await callApi<ProjectResponse>('/api/projects', 'PUT', project);

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
};
