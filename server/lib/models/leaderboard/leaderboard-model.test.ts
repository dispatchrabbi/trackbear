import { vi, expect, describe, it, afterEach } from 'vitest';
import { getTestReqCtx, mockObject, TEST_OBJECT_ID, TEST_USER_ID, TEST_UUID } from 'testing-support/util';

import _dbClient from '../../db.ts';
import { logAuditEvent as _logAuditEvent } from '../../audit-events.ts';

import { LeaderboardModel } from './leaderboard-model.ts';
import { Leaderboard, LeaderboardMember, LeaderboardSummary } from './types.ts';
import { LEADERBOARD_STATE, LEADERBOARD_PARTICIPANT_STATE } from './consts.ts';
import { type User } from '../user/user-model.ts';
import { USER_STATE } from '../user/consts.ts';
import { PROJECT_STATE } from '../project/consts.ts';
import { TAG_STATE } from '../tag/consts.ts';

vi.mock('../../tracer.ts');

vi.mock('../../db.ts');
const dbClient = vi.mocked(_dbClient, { deep: true });

vi.mock('../../audit-events.ts');
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- until we fill out the tests
const logAuditEvent = vi.mocked(_logAuditEvent);

describe(LeaderboardModel, () => {
  const testOwner = mockObject<User>({ id: TEST_USER_ID });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- until we fill out the tests
  const testReqCtx = getTestReqCtx();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- until we fill out the tests
  const includeWorkAndTagIds = {
    worksIncluded: {
      where: {
        ownerId: testOwner.id,
        state: PROJECT_STATE.ACTIVE,
      },
      select: { id: true },
    },
    tagsIncluded: {
      where: {
        ownerId: testOwner.id,
        state: TAG_STATE.ACTIVE,
      },
      select: { id: true },
    },
  };

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(LeaderboardModel.list, () => {
    it('gets a list of leaderboard summaries', async () => {
      const testDbLeaderboards = [
        {
          ...mockObject<Leaderboard>(),
          participants: [
            {
              ...mockObject<LeaderboardMember>({ id: TEST_OBJECT_ID, userId: TEST_USER_ID, starred: false, isParticipant: false, isOwner: true }),
              user: mockObject<User>({ id: TEST_USER_ID, uuid: TEST_UUID, displayName: 'test0', avatar: null }),
            },
            {
              ...mockObject<LeaderboardMember>({ id: TEST_OBJECT_ID - 1, userId: TEST_USER_ID - 1, starred: true, isParticipant: true, isOwner: false }),
              user: mockObject<User>({ id: TEST_USER_ID - 1, uuid: TEST_UUID, displayName: 'test1', avatar: null }),
            },
          ],
        },
        {
          ...mockObject<Leaderboard>(),
          participants: [
            {
              ...mockObject<LeaderboardMember>({ id: TEST_OBJECT_ID, userId: TEST_USER_ID, starred: true, isParticipant: true, isOwner: true }),
              user: mockObject<User>({ id: TEST_USER_ID, uuid: TEST_UUID, displayName: 'test0', avatar: null }),
            },
            {
              ...mockObject<LeaderboardMember>({ id: TEST_OBJECT_ID - 2, userId: TEST_USER_ID - 2, starred: false, isParticipant: true, isOwner: false }),
              user: mockObject<User>({ id: TEST_USER_ID - 2, uuid: TEST_UUID, displayName: 'test2', avatar: null }),
            },
          ],
        },
      ];
      dbClient.board.findMany.mockResolvedValue(testDbLeaderboards);

      const expected: LeaderboardSummary[] = [
        {
          ...mockObject<Leaderboard>(),
          starred: false,
          members: [
            { id: TEST_OBJECT_ID, displayName: 'test0', avatar: null, userUuid: TEST_UUID, isParticipant: false, isOwner: true },
            { id: TEST_OBJECT_ID - 1, displayName: 'test1', avatar: null, userUuid: TEST_UUID, isParticipant: true, isOwner: false },
          ],
        },
        {
          ...mockObject<Leaderboard>(),
          starred: true,
          members: [
            { id: TEST_OBJECT_ID, displayName: 'test0', avatar: null, userUuid: TEST_UUID, isParticipant: true, isOwner: true },
            { id: TEST_OBJECT_ID - 2, displayName: 'test2', avatar: null, userUuid: TEST_UUID, isParticipant: true, isOwner: false },
          ],
        },
      ];

      const actual = await LeaderboardModel.list(TEST_USER_ID);

      expect(actual).toEqual(expected);
      expect(dbClient.board.findMany).toBeCalledWith({
        where: {
          state: LEADERBOARD_STATE.ACTIVE,
          participants: {
            some: {
              userId: TEST_USER_ID,
              state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
            },
          },
        },
        include: {
          participants: {
            where: {
              state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
              user: { state: USER_STATE.ACTIVE },
            },
            include: {
              user: true,
            },
          },
        },
      });
    });
  });

  describe(LeaderboardModel.get, () => {
    it('gets a leaderboard by id', async () => {
      const testLeaderboard = mockObject<Leaderboard>();
      dbClient.board.findUnique.mockResolvedValue(testLeaderboard);

      const actual = await LeaderboardModel.get(TEST_OBJECT_ID);

      expect(actual).toBe(testLeaderboard);
      expect(dbClient.board.findUnique).toBeCalledWith({
        where: {
          id: TEST_OBJECT_ID,
          state: LEADERBOARD_STATE.ACTIVE,
        },
      });
    });
  });

  describe(LeaderboardModel.getByUuid, () => {
    it('gets a leaderboard by uuid', async () => {
      const testLeaderboard = mockObject<Leaderboard>();
      dbClient.board.findUnique.mockResolvedValue(testLeaderboard);

      const actual = await LeaderboardModel.getByUuid(TEST_UUID, { memberUserId: TEST_USER_ID });

      expect(actual).toBe(testLeaderboard);
      expect(dbClient.board.findUnique).toBeCalledWith({
        where: {
          uuid: TEST_UUID,
          state: LEADERBOARD_STATE.ACTIVE,
          OR: [
            {
              participants: {
                some: {
                  userId: TEST_USER_ID,
                  state: LEADERBOARD_PARTICIPANT_STATE.ACTIVE,
                },
              },
            },
          ],
        },
      });
    });
  });

  describe.skip(LeaderboardModel.create, () => {});

  describe.skip(LeaderboardModel.update, () => {});

  describe.skip(LeaderboardModel.delete, () => {});

  describe.skip(LeaderboardModel.listParticipants, () => {});

  describe.skip(LeaderboardModel.getMemberParticipation, () => {});

  describe.skip(LeaderboardModel.listMembers, () => {});

  describe.skip(LeaderboardModel.getMember, () => {});

  describe.skip(LeaderboardModel.createMember, () => {});

  describe.skip(LeaderboardModel.updateMember, () => {});

  describe.skip(LeaderboardModel.removeMember, () => {});
});
