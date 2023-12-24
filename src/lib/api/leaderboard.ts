import { callApi } from "./api.ts";
import { Project, TYPE_INFO } from "../project.ts";
import type { CreateLeaderboardPayload, EditLeaderboardPayload, CompleteLeaderboard } from '../../../server/api/leaderboards.ts';

export async function getLeaderboards() {
  const response = await callApi<CompleteLeaderboard[]>('/api/leaderboards', 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export async function getLeaderboard(uuid: string) {
  const response = await callApi<CompleteLeaderboard>(`/api/leaderboards/${uuid}`, 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export async function createLeaderboard(leaderboard: CreateLeaderboardPayload) {
  const response = await callApi<CompleteLeaderboard>(`/api/leaderboards`, 'POST', leaderboard);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export async function editLeaderboard(leaderboard: EditLeaderboardPayload) {
  const response = await callApi<CompleteLeaderboard>(`/api/leaderboards`, 'POST', leaderboard);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export async function getEligibleProjects(leaderboardUuid: string) {
  const response = await callApi<Project[]>(`/api/leaderboards/${leaderboardUuid}/eligible-projects`, 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export async function addProjectToLeaderboard(leaderboardUuid: string, projectId: number) {
  const response = await callApi<CompleteLeaderboard>(`/api/leaderboards/${leaderboardUuid}/projects`, 'POST', { projectId });

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export async function removeProjectFromLeaderboard(leaderboardUuid: string, projectId: number) {
  const response = await callApi<CompleteLeaderboard>(`/api/leaderboards/${leaderboardUuid}/projects/${projectId}`, 'DELETE');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export const GOAL_TYPE_INFO = {
  ...TYPE_INFO,
  percentage: {
    description: 'Progress to Individual Goal',
    defaultChartMax: 100,
    counter: { singular: 'percent', plural: 'percent' },
  }
};
