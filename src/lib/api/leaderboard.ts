import { callApiV1 } from '../api.ts';

import type {
  LeaderboardSummary, Leaderboard, LeaderboardMember, LeaderboardStarResponse, Participant, Participation, Membership,
  LeaderboardCreatePayload, LeaderboardUpdatePayload, LeaderboardStarPayload,
  LeaderboardMemberUpdatePayload,
  LeaderboardParticipationPayload,
} from 'server/api/v1/leaderboard.ts';

export type {
  LeaderboardSummary, Leaderboard, LeaderboardMember, LeaderboardStarResponse, Participant, Participation, Membership,
  LeaderboardCreatePayload, LeaderboardUpdatePayload, LeaderboardStarPayload,
  LeaderboardMemberUpdatePayload,
  LeaderboardParticipationPayload,
};

const ENDPOINT = '/api/v1/leaderboard';

export async function listLeaderboardSummaries() {
  return callApiV1<LeaderboardSummary[]>(ENDPOINT, 'GET');
}

export async function getLeaderboard(uuid: string) {
  return callApiV1<Leaderboard>(ENDPOINT + `/${uuid}`, 'GET');
}

export async function getLeaderboardByJoinCode(joincode: string) {
  return callApiV1<Leaderboard>(ENDPOINT + `/joincode/${joincode}`, 'GET');
}

export async function createLeaderboard(data: LeaderboardCreatePayload) {
  return callApiV1<Leaderboard>(ENDPOINT, 'POST', data);
}

export async function updateLeaderboard(uuid: string, data: LeaderboardUpdatePayload) {
  return callApiV1<Leaderboard>(ENDPOINT + `/${uuid}`, 'PATCH', data);
}

export async function starLeaderboard(uuid: string, starred: boolean) {
  const data: LeaderboardStarPayload = { starred };
  return callApiV1<LeaderboardStarResponse>(ENDPOINT + `/${uuid}/star`, 'PATCH', data);
}

export async function deleteLeaderboard(uuid: string) {
  return callApiV1<Leaderboard>(ENDPOINT + `/${uuid}`, 'DELETE');
}

export async function listMembers(uuid: string) {
  return callApiV1<Membership[]>(ENDPOINT + `/${uuid}/members`, 'GET');
}

export async function updateMember(uuid: string, memberId: number, data: LeaderboardMemberUpdatePayload) {
  return callApiV1<Membership[]>(ENDPOINT + `/${uuid}/members/${memberId}`, 'PATCH', data);
}

export async function removeMember(uuid: string, memberId: number) {
  return callApiV1<Membership>(ENDPOINT + `/${uuid}/members/${memberId}`, 'DELETE');
}

export async function listParticipants(uuid: string) {
  return callApiV1<Participant[]>(ENDPOINT + `/${uuid}/participants`, 'GET');
}

export async function getMyParticipation(uuid: string) {
  return callApiV1<Participation>(ENDPOINT + `/${uuid}/me`, 'GET');
}

export async function joinLeaderboard(uuid: string, data: LeaderboardParticipationPayload) {
  return callApiV1<LeaderboardMember>(ENDPOINT + `/${uuid}/me`, 'POST', data);
}

export async function updateMyParticipation(uuid: string, data: LeaderboardParticipationPayload) {
  return callApiV1<LeaderboardMember>(ENDPOINT + `/${uuid}/me`, 'PATCH', data);
}

export async function leaveLeaderboard(uuid: string) {
  return callApiV1<LeaderboardMember>(ENDPOINT + `/${uuid}/me`, 'DELETE');
}
