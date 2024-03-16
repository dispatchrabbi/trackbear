import { callApiV1 } from "./api.ts";

import type { Goal } from "@prisma/client";
import type { GoalAndTallies, GoalWithWorksAndTags, GoalPayload } from "server/api/v1/goal.ts";

export type { Goal, GoalWithWorksAndTags, GoalAndTallies, GoalPayload };

const ENDPOINT = '/api/v1/goal';

export async function getGoals() {
  return callApiV1<Goal[]>(ENDPOINT, 'GET');
}

export async function getGoal(id: number) {
  return callApiV1<GoalAndTallies>(ENDPOINT + `/${id}`, 'GET');
}

export async function createGoal(data: GoalPayload) {
  return callApiV1<GoalAndTallies>(ENDPOINT, 'POST', data);
}

export async function updateGoal(id: number, data: GoalPayload) {
  return callApiV1<GoalAndTallies>(ENDPOINT + `/${id}`, 'PUT', data);
}

export async function deleteGoal(id: number) {
  return callApiV1<Goal>(ENDPOINT + `/${id}`, 'DELETE');
}
