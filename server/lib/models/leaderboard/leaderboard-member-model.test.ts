/* eslint-disable @typescript-eslint/no-unused-vars */
import { vi, expect, describe, it, afterEach } from 'vitest';
import { getTestReqCtx, mockObject, TEST_OBJECT_ID, TEST_USER_ID, TEST_UUID } from 'testing-support/util';

import _dbClient from '../../db.ts';
import { logAuditEvent as _logAuditEvent } from '../../audit-events.ts';

import { LeaderboardMemberModel } from './leaderboard-member-model.ts';
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

const logAuditEvent = vi.mocked(_logAuditEvent);

describe(LeaderboardMemberModel, () => {
  const testOwner = mockObject<User>({ id: TEST_USER_ID });

  const testReqCtx = getTestReqCtx();

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

  describe.skip(LeaderboardMemberModel.list, () => {});

  describe.skip(LeaderboardMemberModel.get, () => {});

  describe.skip(LeaderboardMemberModel.create, () => {});

  describe.skip(LeaderboardMemberModel.update, () => {});

  describe.skip(LeaderboardMemberModel.remove, () => {});

  describe.skip(LeaderboardMemberModel.getParticipation, () => {});
});
