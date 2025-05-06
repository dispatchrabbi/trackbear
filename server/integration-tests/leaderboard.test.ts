import { vi, expect, describe, it, beforeAll, beforeEach } from 'vitest';

import { disableEmail } from 'testing-support/env.ts';
import _testDbClient from '../../testing-support/test-db.ts';
vi.mock('../lib/db.ts', () => ({
  default: _testDbClient,
}));

import { LeaderboardModel } from 'server/lib/models/leaderboard/leaderboard-model.ts';
import { UserModel } from 'server/lib/models/user/user-model.ts';
import type { User } from 'server/lib/models/user/user-model.ts';

import { TEST_SESSION_ID, TEST_SYSTEM_ID } from 'testing-support/util.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts.ts';
import { WorkModel } from 'server/lib/models/work/work-model.ts';
import type { RequestContext } from 'server/lib/request-context.ts';
import { TagModel } from 'server/lib/models/tag/tag-model.ts';

let testUser: User;

describe('leaderboards', () => {
  beforeAll(async () => {
    await disableEmail();
  });

  beforeEach(async () => {
    testUser = await UserModel.createUser({
      username: 'leaderboard-test',
      password: '1234567890',
      email: 'leaderboard-test@example.com',
    }, {
      userId: TEST_SYSTEM_ID,
      sessionId: TEST_SESSION_ID,
    });
  });

  it('automatically adds the creator of a board as an owner after creation', async () => {
    const leaderboard = await LeaderboardModel.create({
      title: 'TEST automatically adds the creator of a board as an owner after creation',
      measures: [TALLY_MEASURE.WORD],
      startDate: null,
      endDate: null,
      goal: { [TALLY_MEASURE.WORD]: 50000 },
      individualGoalMode: false,
      fundraiserMode: false,
    }, testUser.id, {
      userId: testUser.id,
      sessionId: TEST_SESSION_ID,
    });

    const members = await LeaderboardModel.listMembers(leaderboard);

    expect(members.length).toBe(1);
    expect(members[0].userId).toEqual(testUser.id);
    expect(members[0].isOwner).toBe(true);
    expect(members[0].isParticipant).toBe(false);
  });
});
