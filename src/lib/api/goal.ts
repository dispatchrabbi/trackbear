import { callApiV1 } from "./api.ts";

import type { Goal } from "@prisma/client";
import type { GoalAndTallies, GoalWithWorksAndTags, GoalCreatePayload, GoalUpdatePayload } from "server/api/v1/goal.ts";

export type { Goal, GoalWithWorksAndTags, GoalAndTallies, GoalCreatePayload, GoalUpdatePayload };

const ENDPOINT = '/api/v1/goal';

export async function getGoals() {
  return callApiV1<Goal[]>(ENDPOINT, 'GET');
}

export async function getGoal(id: number) {
  return callApiV1<GoalAndTallies>(ENDPOINT + `/${id}`, 'GET');
}

export async function createGoal(data: GoalCreatePayload) {
  return callApiV1<GoalAndTallies>(ENDPOINT, 'POST', data);
}

export async function updateGoal(id: number, data: GoalUpdatePayload) {
  return callApiV1<GoalAndTallies>(ENDPOINT + `/${id}`, 'PUT', data);
}

export async function starGoal(id: number, starred: boolean) {
  return callApiV1<Goal>(ENDPOINT + `/${id}`, 'PUT', { starred });
}

export async function deleteGoal(id: number) {
  return callApiV1<Goal>(ENDPOINT + `/${id}`, 'DELETE');
}
