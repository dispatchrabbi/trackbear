import { callApiV1 } from "../api.ts";

import type { Goal, GoalWithAchievement, GoalAndTallies, GoalCreatePayload, GoalUpdatePayload } from "server/api/v1/goal.ts";

export type { Goal, GoalWithAchievement, GoalAndTallies, GoalCreatePayload, GoalUpdatePayload };

const ENDPOINT = '/api/v1/goal';

export async function getGoals() {
  return callApiV1<GoalWithAchievement[]>(ENDPOINT, 'GET');
}

export async function getGoal(id: number) {
  return callApiV1<Goal>(ENDPOINT + `/${id}`, 'GET');
}

export async function createGoal(data: GoalCreatePayload) {
  return callApiV1<GoalAndTallies>(ENDPOINT, 'POST', data);
}

export async function batchCreateGoals(data: GoalCreatePayload[]) {
  return callApiV1<Goal[]>(ENDPOINT + `/batch`, 'POST', data);
}

export async function updateGoal(id: number, data: GoalUpdatePayload) {
  return callApiV1<GoalAndTallies>(ENDPOINT + `/${id}`, 'PATCH', data);
}

export async function starGoal(id: number, starred: boolean) {
  return callApiV1<Goal>(ENDPOINT + `/${id}`, 'PATCH', { starred });
}

export async function deleteGoal(id: number) {
  return callApiV1<Goal>(ENDPOINT + `/${id}`, 'DELETE');
}
