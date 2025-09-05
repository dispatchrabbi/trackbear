import { callApiV1 } from '../api.ts';

import type { Project, SummarizedProject } from 'server/api/v1/project.ts';
export type { Project, SummarizedProject };

import type { ProjectCreatePayload, ProjectUpdatePayload } from 'server/api/v1/project.ts';
export type { ProjectCreatePayload, ProjectUpdatePayload };

const ENDPOINT = '/api/v1/project';

export async function getProjects() {
  return callApiV1<SummarizedProject[]>(ENDPOINT, 'GET');
}

export async function getProject(id: number) {
  return callApiV1<Project>(ENDPOINT + `/${id}`, 'GET');
}

export async function createProject(data: ProjectCreatePayload) {
  return callApiV1<Project>(ENDPOINT, 'POST', data);
}

export async function updateProject(id: number, data: ProjectUpdatePayload) {
  return callApiV1<Project>(ENDPOINT + `/${id}`, 'PATCH', data);
}

export async function starProject(id: number, starred: boolean) {
  return callApiV1<Project>(ENDPOINT + `/${id}`, 'PATCH', { starred });
}

export async function deleteProject(id: number) {
  return callApiV1<Project>(ENDPOINT + `/${id}`, 'DELETE');
}

export async function uploadCover(id: number, data: FormData) {
  return callApiV1<Project>(ENDPOINT + `/${id}/cover`, 'POST', data);
}

export async function deleteCover(id: number) {
  return callApiV1<Project>(ENDPOINT + `/${id}/cover`, 'DELETE');
}
