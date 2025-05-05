import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from 'server/lib/api.ts';
import { ApiResponse, success, failure } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zUuidParam, NonEmptyArray, zUuidAndIdParams } from '../../lib/validators.ts';

import { CreateLeaderboardData, CreateMemberData, LeaderboardModel, UpdateLeaderboardData, UpdateMemberData } from 'server/lib/models/leaderboard/leaderboard-model.ts';
import type { Leaderboard, LeaderboardSummary, LeaderboardMember, JustMember, Participant, ParticipantGoal, Participation, Membership } from 'server/lib/models/leaderboard/types.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts.ts';
import { reqCtx } from 'server/lib/request-context.ts';
import { pick } from 'server/lib/obj.ts';

export type {
  LeaderboardSummary, Leaderboard, LeaderboardMember, Participant, Participation, Membership,
};

export async function handleList(req: RequestWithUser, res: ApiResponse<LeaderboardSummary[]>) {
  const summaries = await LeaderboardModel.list(req.user.id);

  return res.status(200).send(success(summaries));
}

export async function handleGetByUuid(req: RequestWithUser, res: ApiResponse<Leaderboard>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { memberUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`));
  }

  return res.status(200).send(success(leaderboard));
}

const zJoinCodeParam = z.object({ joincode: z.string().uuid() });
export async function handleGetByJoinCode(req: RequestWithUser, res: ApiResponse<Leaderboard>) {
  const joinCode = req.params.joincode;
  const leaderboard = await LeaderboardModel.getByJoinCode(joinCode);
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with join code ${joinCode}.`));
  }

  if(!leaderboard.isJoinable) {
    return res.status(409).send(failure('CANNOT_JOIN', `This leaderboard is not accepting new members.`));
  }

  return res.status(200).send(success(leaderboard));
}

export type LeaderboardCreatePayload = CreateLeaderboardData;
const zLeaderboardCreatePayload = z.object({
  title: z.string(),
  description: z.string().default(''),
  measures: z.array(z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>)),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  goal: z.record(z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>), z.number().int()).nullable(),
  individualGoalMode: z.boolean().nullable().default(false),
  fundraiserMode: z.boolean().nullable().default(false),
  isJoinable: z.boolean().nullable().default(false),
  isPublic: z.boolean().nullable().default(false),
}).strict();
export async function handleCreate(req: RequestWithUser, res: ApiResponse<Leaderboard>) {
  const user = req.user;
  const payload = req.body as LeaderboardCreatePayload;

  const created = await LeaderboardModel.create(payload, user.id, reqCtx(req));

  return res.status(201).send(success(created));
}

export type LeaderboardUpdatePayload = UpdateLeaderboardData;
const zLeaderboardUpdatePayload = zLeaderboardCreatePayload.partial();
export async function handleUpdate(req: RequestWithUser, res: ApiResponse<Leaderboard>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { ownerUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`));
  }

  const payload = req.body as LeaderboardUpdatePayload;
  const updated = await LeaderboardModel.update(leaderboard, payload, reqCtx(req));

  return res.status(200).send(success(updated));
}

export type LeaderboardStarPayload = {
  starred: boolean;
};
export type LeaderboardStarResponse = {
  starred: boolean;
};
const zLeaderboardStarPayload = z.object({
  starred: z.boolean(),
}).strict();
export async function handleStar(req: RequestWithUser, res: ApiResponse<LeaderboardStarResponse>) {
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { memberUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`));
  }

  const memberId = +req.user.id;
  const member = await LeaderboardModel.getMemberByUserId(leaderboard, memberId);
  if(!member) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any member with id ${memberId} on that leaderboard.`));
  }

  const payload = req.body as LeaderboardStarPayload;
  const updatedData: UpdateMemberData = {
    starred: payload.starred,
  };
  const updated = await LeaderboardModel.updateMember(member, updatedData, reqCtx(req));

  return res.status(200).send(success({ starred: updated.starred }));
}

export async function handleDelete(req: RequestWithUser, res: ApiResponse<Leaderboard>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { ownerUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`));
  }

  const deleted = await LeaderboardModel.delete(leaderboard, reqCtx(req));
  return res.status(200).send(success(deleted));
}

export async function handleListMembers(req: RequestWithUser, res: ApiResponse<Membership[]>) {
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { memberUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`));
  }

  const members = await LeaderboardModel.listMembers(leaderboard);
  const memberships = members.map(member2membership);

  return res.status(200).send(success(memberships));
}

export type LeaderboardMemberUpdatePayload = {
  isOwner?: boolean;
};
const zLeaderboardMemberUpdatePayload = z.object({
  isOwner: z.boolean(),
}).strict().partial();
export async function handleUpdateMember(req: RequestWithUser, res: ApiResponse<Membership>) {
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { ownerUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`));
  }

  const memberId = +req.params.memberId;
  const member = await LeaderboardModel.getMember(leaderboard, memberId);
  if(!member) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any member with id ${memberId} on that leaderboard.`));
  }

  const payload = req.body as LeaderboardMemberUpdatePayload;
  const updated = await LeaderboardModel.updateMember(member, payload, reqCtx(req));
  const membership = member2membership(updated);

  return res.status(200).send(success(membership));
}

export async function handleRemoveMember(req: RequestWithUser, res: ApiResponse<Membership>) {
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { ownerUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`));
  }

  const memberId = +req.params.memberId;
  const member = await LeaderboardModel.getMember(leaderboard, memberId);
  if(!member) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any member with id ${memberId} on that leaderboard.`));
  }

  let membership: Membership;
  try {
    const removed = await LeaderboardModel.removeMember(member, reqCtx(req));
    membership = member2membership(removed);
  } catch {
    return res.status(409).send(failure('ONLY_OWNER', `Cannot remove member with id ${memberId} because they are the only owner of this leaderboard.`));
  }

  return res.status(200).send(success(membership));
}

export async function handleListParticipants(req: RequestWithUser, res: ApiResponse<Participant[]>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { memberUserId: req.user.id, includePublicLeaderboards: true });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`));
  }

  const participants = await LeaderboardModel.listParticipants(leaderboard);
  return res.status(200).send(success(participants));
}

export async function handleGetMyParticipation(req: RequestWithUser, res: ApiResponse<Participation>) {
  const userId = req.user.id;
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { memberUserId: userId });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`));
  }

  const participation = await LeaderboardModel.getMemberParticipation(leaderboard.id, userId);
  return res.status(200).send(success(participation));
}

export type LeaderboardParticipationPayload = {
  isParticipant: boolean;
  goal: ParticipantGoal;
  workIds: number[];
  tagIds: number[];
};
const zLeaderboardParticipationPayload = z.object({
  isParticipant: z.boolean(),
  goal: z.object({
    measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
    count: z.number().int(),
  }).nullable(),
  workIds: z.array(z.number().int()),
  tagIds: z.array(z.number().int()),
}).strict();

export async function handleJoinBoard(req: RequestWithUser, res: ApiResponse<LeaderboardMember>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid);
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`));
  }

  if(!leaderboard.isJoinable) {
    return res.status(409).send(failure('CANNOT_JOIN', `This leaderboard is not accepting new members.`));
  }

  const user = req.user;
  const existing = await LeaderboardModel.getMemberByUserId(leaderboard, user.id);
  if(existing) {
    return res.status(409).send(failure('ALREADY_JOINED', `You are already part of this leaderboard.`));
  }

  const payload = req.body as LeaderboardParticipationPayload;
  const memberData: CreateMemberData = {
    isParticipant: payload.isParticipant,
    isOwner: false,
    goal: payload.goal,
    workIds: payload.workIds,
    tagIds: payload.tagIds,
  };
  const created = await LeaderboardModel.createMember(leaderboard, user, memberData, reqCtx(req));

  return res.status(201).send(success(created));
}

export async function handleUpdateMyParticipation(req: RequestWithUser, res: ApiResponse<LeaderboardMember>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { memberUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`));
  }

  const user = req.user;
  const existing = await LeaderboardModel.getMemberByUserId(leaderboard, user.id);
  if(!existing) {
    return res.status(404).send(failure('NOT_FOUND', `You are not part of this leaderboard.`));
  }

  const payload = req.body as LeaderboardParticipationPayload;
  const updated = await LeaderboardModel.updateMember(existing, payload, reqCtx(req));

  return res.status(200).send(success(updated));
}

export async function handleLeaveBoard(req: RequestWithUser, res: ApiResponse<LeaderboardMember>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { memberUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`));
  }

  const user = req.user;
  const existing = await LeaderboardModel.getMemberByUserId(leaderboard, user.id);
  if(!existing) {
    return res.status(404).send(failure('NOT_FOUND', `You are not part of this leaderboard.`));
  }

  let removed: LeaderboardMember;
  try {
    removed = await LeaderboardModel.removeMember(existing, reqCtx(req));
  } catch {
    return res.status(409).send(failure('ONLY_OWNER', `Cannot remove you because you are the only owner of this leaderboard.`));
  }

  return res.status(200).send(success(removed));
}

export function member2membership(member: JustMember): Membership {
  return pick(member, ['uuid', 'state', 'isOwner', 'isParticipant', 'displayName', 'avatar']);
}

/**
 * This API is a little unusual owing to two factors:
 * - leaderboards have an particular workflow that is not necessarily symmetric
 * - to the extent possible, the API should only reveal other users' data when it's needed
 *
 * Here is the detailed breakdown:
 * - Basic leaderboard CRUD is more or less as expected.
 *   - Even though a leaderboard's starred status is per-user, it is still done via the usual PATCH /:uuid/star endpoint.
 *   - In order to get a list of tallies for each participant, use GET /:uuid/participants. (TODO: should this be /:uuid/tallies?)
 * - There is only one way to create a member:
 *   - A prospective member must first request leaderboard info via the GET /joincode/:joincode endpoint. Then they can
 *     join the leaderboard via POST /:uuid/me endpoint and subsequently edit their participation via the PATCH /:uuid/me endpoint.
 *   - There is no way to forcefully add a user to a leaderboard; they must join by themself.
 * - There are two ways to update a member:
 *   - Members can update their own participation information (spectator status, goals, filters, display name, color,
 *     team assignment (if allowed)) at any time via the PATCH /:uuid/me endpoint.
 *   - Owners can update membership information (promote/demote owners, team assignment) at any time via the
 *     PATCH /:uuid/members/:id endpoint.
 * - There are two ways for a member to leave the board:
 *   - Members can leave a board at any time via the DELETE /:uuid/me endpoint.
 *   - Owners can remove members from the board via the DELETE /:uuid/members/:id endpoint.
 */

const routes: RouteConfig[] = [
  // GET / - list all boards you know about, including participant bios
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleList,
    accessLevel: ACCESS_LEVEL.USER,
  },
  // GET /:uuid - get overall info about a board
  {
    path: '/:uuid',
    method: HTTP_METHODS.GET,
    handler: handleGetByUuid,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  // GET /joincode/:joincode - get overall info about a board via join code
  {
    path: '/joincode/:joincode',
    method: HTTP_METHODS.GET,
    handler: handleGetByJoinCode,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zJoinCodeParam,
  },
  // POST / - create a new board
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreate,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zLeaderboardCreatePayload,
  },
  // PATCH /:uuid - update an existing board
  {
    path: '/:uuid',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdate,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
    bodySchema: zLeaderboardUpdatePayload,
  },
  // PATCH /:uuid/star - update an existing board's star status (though this is secretly per-user)
  {
    path: '/:uuid/star',
    method: HTTP_METHODS.PATCH,
    handler: handleStar,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
    bodySchema: zLeaderboardStarPayload,
  },
  // DELETE /:uuid - delete an existing board
  {
    path: '/:uuid',
    method: HTTP_METHODS.DELETE,
    handler: handleDelete,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  //
  // GET /:uuid/participants - get all participants for a board, plus tallies
  {
    path: '/:uuid/participants',
    method: HTTP_METHODS.GET,
    handler: handleListParticipants,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  //
  // GET /:uuid/members - get all members for a board
  {
    path: '/:uuid/members',
    method: HTTP_METHODS.GET,
    handler: handleListMembers,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  // POST /:uuid/members - create a board member
  // INTENTIONALLY NOT IMPLEMENTED (board members join via POST /:uuid/me on their own)
  // PATCH /:uuid/members/:memberId - edit a board member (owners only)
  {
    path: '/:uuid/members/:memberId',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateMember,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidAndIdParams(),
    bodySchema: zLeaderboardMemberUpdatePayload,
  },
  // DELETE /:uuid/members/:memberId - remove a board member (owners only)
  {
    path: '/:uuid/members/:memberId',
    method: HTTP_METHODS.DELETE,
    handler: handleRemoveMember,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidAndIdParams(),
  },
  // GET /:uuid/me - get your participation info
  {
    path: '/:uuid/me',
    method: HTTP_METHODS.GET,
    handler: handleGetMyParticipation,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  // POST /:uuid/me - join the board
  {
    path: '/:uuid/me',
    method: HTTP_METHODS.POST,
    handler: handleJoinBoard,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
    bodySchema: zLeaderboardParticipationPayload,
  },
  // PATCH /:uuid/me - edit your participation info
  {
    path: '/:uuid/me',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateMyParticipation,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
    bodySchema: zLeaderboardParticipationPayload,
  },
  // DELETE /:uuid/me - leave the board
  {
    path: '/:uuid/me',
    method: HTTP_METHODS.DELETE,
    handler: handleLeaveBoard,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
];

export default routes;
