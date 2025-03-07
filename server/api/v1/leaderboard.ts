import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from "server/lib/api.ts";
import { ApiResponse, success, failure } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zUuidParam, NonEmptyArray, zUuidAndIdParams } from '../../lib/validators.ts';

import { CreateLeaderboardData, CreateParticipationData, LeaderboardModel, UpdateLeaderboardData, UpdateParticipationData } from "server/lib/models/leaderboard/leaderboard-model.ts";
import type { Leaderboard, LeaderboardSummary, Member, Participant, Participation } from "server/lib/models/leaderboard/types.ts";
import { TALLY_MEASURE } from "server/lib/models/tally/consts.ts";
import { reqCtx } from "server/lib/request-context.ts";

export async function handleList(req: RequestWithUser, res: ApiResponse<LeaderboardSummary[]>) {
  const summaries = await LeaderboardModel.list(req.user.id);

  return res.status(200).send(success(summaries));
}

export async function handleGetByUuid(req: RequestWithUser, res: ApiResponse<Leaderboard>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { memberUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`))
  }

  return res.status(200).send(success(leaderboard));
}

const zJoinCodeParam = z.object({ joincode: z.string().uuid() });
export async function handleGetByJoinCode(req: RequestWithUser, res: ApiResponse<Leaderboard>) {
  const joinCode = req.params.joincode;
  const leaderboard = await LeaderboardModel.getByJoinCode(joinCode);
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with join code ${joinCode}.`))
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
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`))
  }

  const payload = req.body as LeaderboardUpdatePayload;
  const updated = await LeaderboardModel.update(leaderboard, payload, reqCtx(req));

  return res.status(200).send(success(updated));
}

export type LeaderboardStarPayload = {
  starred: boolean;
};
const zLeaderboardStarPayload = z.object({
  starred: z.boolean(),
}).strict();
export async function handleStar(req: RequestWithUser, res: ApiResponse<{ starred: boolean }>) {
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { ownerUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`))
  }

  const memberId = +req.user.id;
  const member = await LeaderboardModel.getMember(leaderboard, memberId);
  if(!member) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any member with id ${memberId} on that leaderboard.`));
  }

  const payload = req.body as LeaderboardStarPayload;
  const updated = await LeaderboardModel.updateMember(member, payload, reqCtx(req));

  return res.status(200).send(success({ starred: updated.starred }));
}

export async function handleDelete(req: RequestWithUser, res: ApiResponse<Leaderboard>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { ownerUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`))
  }

  const deleted = await LeaderboardModel.delete(leaderboard, reqCtx(req));
  return res.status(200).send(success(deleted));
}

export async function handleListMembers(req: RequestWithUser, res: ApiResponse<Member[]>) {
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { ownerUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`))
  }

  const members = await LeaderboardModel.listMembers(leaderboard);

  return res.status(200).send(success(members));
}

export type LeaderboardMemberUpdatePayload = {
  isOwner?: boolean;
};
const zLeaderboardMemberUpdatePayload = z.object({
  isOwner: z.boolean(),
}).strict().partial();
export async function handleUpdateMember(req: RequestWithUser, res: ApiResponse<Member>) {
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { ownerUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`))
  }

  const memberId = +req.params.id;
  const member = await LeaderboardModel.getMember(leaderboard, memberId);
  if(!member) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any member with id ${memberId} on that leaderboard.`));
  }

  const payload = req.body as LeaderboardMemberUpdatePayload;
  const updated = await LeaderboardModel.updateMember(member, payload, reqCtx(req));

  return res.status(200).send(success(updated));
}

export async function handleRemoveMember(req: RequestWithUser, res: ApiResponse<null>) {
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { ownerUserId: req.user.id });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`));
  }

  const memberId = +req.params.id;
  const member = await LeaderboardModel.getMember(leaderboard, memberId);
  if(!member) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any member with id ${memberId} on that leaderboard.`));
  }

  try {
    await LeaderboardModel.removeMember(member, reqCtx(req));
  } catch {
    return res.status(400).send(failure('LAST_OWNER', `Cannot remove member with id ${memberId} because they are the last owner of this leaderboard.`));
  }

  return res.status(200).send(success(null));
}

export async function handleListParticipants(req: RequestWithUser, res: ApiResponse<Participant[]>) {
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { memberUserId: req.user.id, includePublicLeaderboards: true });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`))
  }

  const participants = await LeaderboardModel.listParticipants(leaderboard);
  return res.status(200).send(success(participants));
}

export async function handleGetMyParticipation(req: RequestWithUser, res: ApiResponse<Participation | null>) {
  const userId = req.user.id;
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid, { memberUserId: userId });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`))
  }

  const participation = await LeaderboardModel.getMemberParticipation(leaderboard.id, userId);
  return res.status(200).send(success(participation));
}

export type LeaderboardParticipationCreatePayload = CreateParticipationData;
const zLeaderboardParticipationCreatePayload = z.object({
  goal: z.object({
    measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
    count: z.number().int(),
  }).nullable(),
  workIds: z.array(z.number().int()),
  tagIds: z.array(z.number().int()),
}).strict();
export async function handleAddMyParticipation(req: RequestWithUser, res: ApiResponse<Participation>) {
  const userId = req.user.id;
  const uuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(uuid);
  if(!leaderboard || leaderboard.isJoinable === false) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${uuid}.`))
  }

  const payload = req.body as LeaderboardParticipationCreatePayload;

  const member = await LeaderboardModel.getMemberByUserId(leaderboard, userId);
  if(member?.isParticipant) {
    // error out — why are you here?
    return res.status(409).send(failure('ALREADY_EXISTS', `You have already joined this leaderboard.`));
  }

  if(member?.isOwner) {
    // do an update instead of a create
    const participation = await LeaderboardModel.updateMemberParticipation(member, payload, reqCtx(req));
    return res.status(200).send(success(participation));
  }

  const participation = await LeaderboardModel.addMemberParticipation(leaderboard.id, userId, payload, reqCtx(req));
  return res.status(201).send(success(participation));
}

export type LeaderboardParticipationUpdatePayload = UpdateParticipationData;
const zLeaderboardParticipationUpdatePayload = zLeaderboardParticipationCreatePayload.partial();
export async function handleUpdateMyParticipation(req: RequestWithUser, res: ApiResponse<Participation>) {
  const userId = req.user.id;
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { memberUserId: userId });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`))
  }

  const member = await LeaderboardModel.getMemberByUserId(leaderboard, userId);
  if(!member) {
    return res.status(404).send(failure('NOT_FOUND', `You are not a participant in this leaderboard.`));
  }

  const payload = req.body as LeaderboardParticipationUpdatePayload;
  const updated = await LeaderboardModel.updateMemberParticipation(member, payload, reqCtx(req));

  return res.status(200).send(success(updated));
}

export async function handleRemoveMyParticipation(req: RequestWithUser, res: ApiResponse<null>) {
  const userId = req.user.id;
  const leaderboardUuid = req.params.uuid;
  const leaderboard = await LeaderboardModel.getByUuid(leaderboardUuid, { memberUserId: userId });
  if(!leaderboard) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any leaderboard with UUID ${leaderboardUuid}.`))
  }

  const member = await LeaderboardModel.getMemberByUserId(leaderboard, userId);
  if(!member) {
    return res.status(404).send(failure('NOT_FOUND', `You are not a participant in this leaderboard.`));
  }

  const removed = await LeaderboardModel.removeMemberParticipation(member, reqCtx(req));

  return res.status(200).send(success(removed));
}

/**
 * This API is a little unusual owing to two factors:
 * - leaderboards have an particular workflow that is not necessarily symmetric
 * - to the extent possible, the API should only reveal other users' data when it's needed
 * 
 * Here is the detailed breakdown:
 * - Basic leaderboard CRUD is more or less as expected.
 * - If you are a leaderboard owner, you can edit and delete members, but there is no way to directly create a member,
 *   as that would forcefully add someone to a leaderboard (and I don't want that to be possible). However, this does
 *   create some weirdness if you have people you want to be owners without being participants, as you'll see below.
 *   - Right now, owners can only promote and demote participants to/from owner. In the future, other things will be
 *     possible, such as assigning people to teams and changing the color they appear in.
 *   - Leaderboard owners can also remove participants. In the future, leaderboard owners will be able to ban members.
 * - To join a leaderboard, you request leaderboard info via the /joincode/:joincode endpoint, then actually join the
 *   leaderboard via adding participation info.
 * - You can change your own participation info or remove it at any time. Removing your info leaves the board unless
 *   you are an owner. Then you stay on unless you leave the board as an owner as well.
 * - If you want someone to be an owner, you need them to first join the board. You can then promote them, and then
 *   they can remove their participation. This is a little complicated and perhaps I should rethink it.
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
    path: '/:uuid',
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
  // GET /:uuid/members - get all members for a board (owners only)
  {
    path: '/:uuid/members',
    method: HTTP_METHODS.GET,
    handler: handleListMembers,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  // POST /:uuid/members - create a board member (owners only)
  // NOT IMPLEMENTED (board members join via POST /:uuid/me on their own)
  // PATCH /:uuid/members/:id - edit a board member (owners only)
  {
    path: '/:uuid/members/:id',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateMember,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidAndIdParams(),
    bodySchema: zLeaderboardMemberUpdatePayload,
  },
  // DELETE /:uuid/members/:id - remove a board member (owners only)
  {
    path: '/:uuid/members/:id',
    method: HTTP_METHODS.DELETE,
    handler: handleRemoveMember,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidAndIdParams(),
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
  // GET /:uuid/me - get your participation info
  {
    path: '/:uuid/me',
    method: HTTP_METHODS.GET,
    handler: handleGetMyParticipation,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  // POST /:uuid/me - add your participation info (a.k.a. join the board)
  {
    path: '/:uuid/me',
    method: HTTP_METHODS.POST,
    handler: handleAddMyParticipation,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
    bodySchema: zLeaderboardParticipationCreatePayload,
  },
  // PATCH /:uuid/me - edit your participation info
  {
    path: '/:uuid/me',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateMyParticipation,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
    bodySchema: zLeaderboardParticipationUpdatePayload,
  },
  // DELETE /:uuid/me - remove your participation info (a.k.a. leave the board)
  {
    path: '/:uuid/me',
    method: HTTP_METHODS.DELETE,
    handler: handleRemoveMyParticipation,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
];

export default routes;