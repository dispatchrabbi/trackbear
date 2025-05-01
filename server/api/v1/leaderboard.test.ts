import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, mockObjects, TEST_USER_ID, TEST_UUID, getTestReqCtx, TEST_OBJECT_ID } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser } from '../../lib/__mocks__/express.ts';

import { Leaderboard, Member, Participant, Participation, type LeaderboardSummary } from 'server/lib/models/leaderboard/types.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts.ts';

vi.mock('../../lib/models/leaderboard/leaderboard-model.ts');
import { LeaderboardModel as _LeaderboardModel } from '../../lib/models/leaderboard/leaderboard-model.ts';
const LeaderboardModel = vi.mocked(_LeaderboardModel);

import { handleAddMyParticipation, handleCreate, handleDelete, handleGetByJoinCode, handleGetByUuid, handleGetMyParticipation, handleList, handleListMembers, handleListParticipants, handleRemoveMember, handleRemoveMyParticipation, handleStar, handleUpdate, handleUpdateMember, handleUpdateMyParticipation } from './leaderboard.ts';

describe('leaderboard api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(handleList, () => {
    it('returns leaderboard summaries', async () => {
      const testSummaries = mockObjects<LeaderboardSummary>(3);
      LeaderboardModel.list.mockResolvedValue(testSummaries);

      const { req, res } = getHandlerMocksWithUser();
      await handleList(req, res);

      expect(LeaderboardModel.list).toHaveBeenCalled();
      expect(res).toSucceedWith(200, testSummaries);
    });
  });

  describe(handleGetByUuid, () => {
    it('returns a leaderboard when it finds one', async () => {
      const testLeaderboard = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(testLeaderboard);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleGetByUuid(req, res);

      expect(LeaderboardModel.getByUuid).toHaveBeenCalledWith(TEST_UUID, {
        memberUserId: TEST_USER_ID,
      });
      expect(res).toSucceedWith(200, testLeaderboard);
    });

    it('returns 404 when it does not find a leaderboard', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleGetByUuid(req, res);

      expect(LeaderboardModel.getByUuid).toHaveBeenCalledWith(TEST_UUID, {
        memberUserId: TEST_USER_ID,
      });
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleGetByJoinCode, () => {
    it('returns a leaderboard when it finds one', async () => {
      const joincode = 'JOIN-M3';
      const testLeaderboard = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByJoinCode.mockResolvedValue(testLeaderboard);

      const { req, res } = getHandlerMocksWithUser({
        params: { joincode },
      });
      await handleGetByJoinCode(req, res);

      expect(LeaderboardModel.getByJoinCode).toHaveBeenCalledWith(joincode);
      expect(res).toSucceedWith(200, testLeaderboard);
    });

    it('returns 404 when it does not find a leaderboard', async () => {
      const joincode = 'JOIN-M3';
      LeaderboardModel.getByJoinCode.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { joincode },
      });
      await handleGetByJoinCode(req, res);

      expect(LeaderboardModel.getByJoinCode).toHaveBeenCalledWith(joincode);
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleCreate, () => {
    it('creates a leaderboard', async () => {
      const testLeaderboard = mockObject<Leaderboard>();
      LeaderboardModel.create.mockResolvedValue(testLeaderboard);

      const payload = {
        title: 'Fake Leaderboard',
        measures: [TALLY_MEASURE.WORD],
        startDate: null,
        endDate: null,
        goal: null,
        individualGoalMode: false,
        fundraiserMode: false,
      };

      const { req, res } = getHandlerMocksWithUser({
        body: payload,
      });
      await handleCreate(req, res);

      expect(LeaderboardModel.create).toBeCalledWith(payload, TEST_USER_ID, getTestReqCtx());
      expect(res).toSucceedWith(201, testLeaderboard);
    });
  });

  describe(handleUpdate, () => {
    it('updates a leaderboard if one with that UUID exists', async () => {
      const found = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(found);

      const updated = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.update.mockResolvedValue(updated);

      const payload = {
        title: 'Fake Leaderboard 2',
        measures: [TALLY_MEASURE.CHAPTER],
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleUpdate(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.update).toBeCalledWith(found, payload, getTestReqCtx());
      expect(res).toSucceedWith(200, updated);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const payload = {
        title: 'Fake Leaderboard 2',
        measures: [TALLY_MEASURE.CHAPTER],
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleUpdate(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.update).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleStar, () => {
    it('stars a leaderboard if one with that UUID exists', async () => {
      const willBeStarred = true;

      const found = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(found);

      const member = mockObject<Member>();
      LeaderboardModel.getMember.mockResolvedValue(member);

      const updated = mockObject<Member>({ starred: willBeStarred });
      LeaderboardModel.updateMember.mockResolvedValue(updated);

      const payload = {
        starred: willBeStarred,
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleStar(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).toBeCalledWith(found, TEST_USER_ID);
      expect(LeaderboardModel.updateMember).toBeCalledWith(member, payload, getTestReqCtx());
      expect(res).toSucceedWith(200, { starred: willBeStarred });
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const payload = {
        starred: true,
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleStar(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).not.toBeCalled();
      expect(LeaderboardModel.updateMember).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });

    it('returns a 404 if the user is not a member of the leaderboard', async () => {
      const found = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(found);

      LeaderboardModel.getMember.mockResolvedValue(null);

      const payload = {
        starred: true,
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleStar(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).toBeCalledWith(found, TEST_USER_ID);
      expect(LeaderboardModel.updateMember).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleDelete, () => {
    it('updates a leaderboard if one with that UUID exists', async () => {
      const found = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(found);

      const deleted = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.delete.mockResolvedValue(deleted);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleDelete(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.delete).toBeCalledWith(found, getTestReqCtx());
      expect(res).toSucceedWith(200, deleted);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleDelete(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.delete).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleListMembers, () => {
    it('returns a list of members', async () => {
      const leaderboard = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const members = mockObjects<Member>(3);
      LeaderboardModel.listMembers.mockResolvedValue(members);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleListMembers(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.listMembers).toBeCalledWith(leaderboard);
      expect(res).toSucceedWith(200, members);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleListMembers(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.listMembers).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleUpdateMember, () => {
    it('returns an updated member', async () => {
      const leaderboard = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const member = mockObject<Member>();
      LeaderboardModel.getMember.mockResolvedValue(member);

      const updated = mockObject<Member>();
      LeaderboardModel.updateMember.mockResolvedValue(updated);

      const { req, res } = getHandlerMocksWithUser({
        params: {
          uuid: TEST_UUID,
          id: String(TEST_OBJECT_ID),
        },
        body: {
          isOwner: true,
        },
      });
      await handleUpdateMember(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).toBeCalledWith(leaderboard, TEST_OBJECT_ID);
      expect(LeaderboardModel.updateMember).toBeCalledWith(member, { isOwner: true }, getTestReqCtx());
      expect(res).toSucceedWith(200, updated);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: {
          uuid: TEST_UUID,
          id: String(TEST_OBJECT_ID),
        },
      });
      await handleUpdateMember(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).not.toBeCalled();
      expect(LeaderboardModel.updateMember).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });

    it('returns 404 if there is no member for that ID', async () => {
      const leaderboard = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      LeaderboardModel.getMember.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: {
          uuid: TEST_UUID,
          id: String(TEST_OBJECT_ID),
        },
      });
      await handleUpdateMember(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).toBeCalledWith(leaderboard, TEST_OBJECT_ID);
      expect(LeaderboardModel.updateMember).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleRemoveMember, () => {
    it('returns null after removing a member', async () => {
      const leaderboard = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const member = mockObject<Member>();
      LeaderboardModel.getMember.mockResolvedValue(member);

      LeaderboardModel.removeMember.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: {
          uuid: TEST_UUID,
          id: String(TEST_OBJECT_ID),
        },
      });
      await handleRemoveMember(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).toBeCalledWith(leaderboard, TEST_OBJECT_ID);
      expect(LeaderboardModel.removeMember).toBeCalledWith(member, getTestReqCtx());
      expect(res).toSucceedWith(200, null);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: {
          uuid: TEST_UUID,
          id: String(TEST_OBJECT_ID),
        },
      });
      await handleRemoveMember(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).not.toBeCalled();
      expect(LeaderboardModel.removeMember).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });

    it('returns 404 if there is no member for that ID', async () => {
      const leaderboard = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      LeaderboardModel.getMember.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: {
          uuid: TEST_UUID,
          id: String(TEST_OBJECT_ID),
        },
      });
      await handleRemoveMember(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).toBeCalledWith(leaderboard, TEST_OBJECT_ID);
      expect(LeaderboardModel.removeMember).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });

    it('returns 400 if the member to remove is the last owner', async () => {
      const leaderboard = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const member = mockObject<Member>();
      LeaderboardModel.getMember.mockResolvedValue(member);

      LeaderboardModel.removeMember.mockRejectedValue(new Error());

      const { req, res } = getHandlerMocksWithUser({
        params: {
          uuid: TEST_UUID,
          id: String(TEST_OBJECT_ID),
        },
      });
      await handleRemoveMember(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { ownerUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMember).toBeCalledWith(leaderboard, TEST_OBJECT_ID);
      expect(LeaderboardModel.removeMember).toBeCalledWith(member, getTestReqCtx());
      expect(res).toFailWith(400, 'LAST_OWNER');
    });
  });

  describe(handleListParticipants, () => {
    it('returns a list of participants', async () => {
      const leaderboard = mockObject<Leaderboard>({ uuid: TEST_UUID });
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const participants = mockObjects<Participant>(3);
      LeaderboardModel.listParticipants.mockResolvedValue(participants);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleListParticipants(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID, includePublicLeaderboards: true });
      expect(LeaderboardModel.listParticipants).toBeCalledWith(leaderboard);
      expect(res).toSucceedWith(200, participants);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleListParticipants(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID, includePublicLeaderboards: true });
      expect(LeaderboardModel.listParticipants).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleGetMyParticipation, () => {
    it(`returns the user's participation`, async () => {
      const leaderboard = mockObject<Leaderboard>({ id: TEST_OBJECT_ID });
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const participation = mockObject<Participation>();
      LeaderboardModel.getMemberParticipation.mockResolvedValue(participation);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleGetMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMemberParticipation).toBeCalledWith(leaderboard.id, TEST_USER_ID);
      expect(res).toSucceedWith(200, participation);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleGetMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMemberParticipation).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleAddMyParticipation, () => {
    it(`adds participation for a user who is not yet a member of the leaderboard`, async () => {
      const leaderboard = mockObject<Leaderboard>();
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      // returns null because the user is NOT yet a member of the leaderboard
      LeaderboardModel.getMemberByUserId.mockResolvedValue(null);

      const participation = mockObject<Participation>();
      LeaderboardModel.addMemberParticipation.mockResolvedValue(participation);

      const payload = {
        goal: null,
        workIds: [],
        tagIds: [],
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleAddMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID);
      expect(LeaderboardModel.getMemberByUserId).toBeCalledWith(leaderboard, TEST_USER_ID);
      expect(LeaderboardModel.addMemberParticipation).toBeCalledWith(leaderboard.id, TEST_USER_ID, payload, getTestReqCtx());
      expect(res).toSucceedWith(201, participation);
    });

    it(`returns 409 if the user is already a member and participant of the leaderboard`, async () => {
      const leaderboard = mockObject<Leaderboard>();
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const member = mockObject<Member>({
        isParticipant: true,
      });
      LeaderboardModel.getMemberByUserId.mockResolvedValue(member);

      const payload = {
        goal: null,
        workIds: [],
        tagIds: [],
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleAddMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID);
      expect(LeaderboardModel.getMemberByUserId).toBeCalledWith(leaderboard, TEST_USER_ID);
      expect(LeaderboardModel.addMemberParticipation).not.toBeCalled();
      expect(res).toFailWith(409, 'ALREADY_EXISTS');
    });

    it(`updates participation if the user is an owner but not a participant`, async () => {
      const leaderboard = mockObject<Leaderboard>();
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const member = mockObject<Member>({
        isOwner: true,
        isParticipant: false,
      });
      LeaderboardModel.getMemberByUserId.mockResolvedValue(member);

      const participation = mockObject<Participation>();
      LeaderboardModel.updateMemberParticipation.mockResolvedValue(participation);

      const payload = {
        goal: null,
        workIds: [],
        tagIds: [],
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleAddMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID);
      expect(LeaderboardModel.getMemberByUserId).toBeCalledWith(leaderboard, TEST_USER_ID);
      expect(LeaderboardModel.updateMemberParticipation).toBeCalledWith(member, payload, getTestReqCtx());
      expect(LeaderboardModel.addMemberParticipation).not.toBeCalled();
      expect(res).toSucceedWith(200, participation);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleAddMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID);
      expect(LeaderboardModel.getMemberByUserId).not.toBeCalled();
      expect(LeaderboardModel.addMemberParticipation).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleUpdateMyParticipation, () => {
    it(`updates participation for a user who is already a member of the board`, async () => {
      const leaderboard = mockObject<Leaderboard>();
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const member = mockObject<Member>();
      LeaderboardModel.getMemberByUserId.mockResolvedValue(member);

      const participation = mockObject<Participation>();
      LeaderboardModel.updateMemberParticipation.mockResolvedValue(participation);

      const payload = {
        goal: null,
        workIds: [],
        tagIds: [],
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleUpdateMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMemberByUserId).toBeCalledWith(leaderboard, TEST_USER_ID);
      expect(LeaderboardModel.updateMemberParticipation).toBeCalledWith(member, payload, getTestReqCtx());
      expect(res).toSucceedWith(200, participation);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleUpdateMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMemberByUserId).not.toBeCalled();
      expect(LeaderboardModel.updateMemberParticipation).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });

    it('returns a 404 if the current user is not a member of the leaderboard', async () => {
      const leaderboard = mockObject<Leaderboard>();
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      LeaderboardModel.getMemberByUserId.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleUpdateMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMemberByUserId).toBeCalledWith(leaderboard, TEST_USER_ID);
      expect(LeaderboardModel.updateMemberParticipation).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });

  describe(handleRemoveMyParticipation, () => {
    it(`updates participation for a user who is already a member of the board`, async () => {
      const leaderboard = mockObject<Leaderboard>();
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      const member = mockObject<Member>();
      LeaderboardModel.getMemberByUserId.mockResolvedValue(member);

      LeaderboardModel.removeMemberParticipation.mockResolvedValue(null);

      const payload = {
        goal: null,
        workIds: [],
        tagIds: [],
      };

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
        body: payload,
      });
      await handleRemoveMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMemberByUserId).toBeCalledWith(leaderboard, TEST_USER_ID);
      expect(LeaderboardModel.removeMemberParticipation).toBeCalledWith(member, getTestReqCtx());
      expect(res).toSucceedWith(200, null);
    });

    it('returns a 404 if there is no leaderboard for that UUID', async () => {
      LeaderboardModel.getByUuid.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleRemoveMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMemberByUserId).not.toBeCalled();
      expect(LeaderboardModel.removeMemberParticipation).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });

    it('returns a 404 if the current user is not a member of the leaderboard', async () => {
      const leaderboard = mockObject<Leaderboard>();
      LeaderboardModel.getByUuid.mockResolvedValue(leaderboard);

      LeaderboardModel.getMemberByUserId.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { uuid: TEST_UUID },
      });
      await handleRemoveMyParticipation(req, res);

      expect(LeaderboardModel.getByUuid).toBeCalledWith(TEST_UUID, { memberUserId: TEST_USER_ID });
      expect(LeaderboardModel.getMemberByUserId).toBeCalledWith(leaderboard, TEST_USER_ID);
      expect(LeaderboardModel.removeMemberParticipation).not.toBeCalled();
      expect(res).toFailWith(404, 'NOT_FOUND');
    });
  });
});
