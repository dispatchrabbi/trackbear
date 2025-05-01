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

  it('does not remove an owner whose participation is removed', async () => {
    const reqCtx: RequestContext = {
      userId: testUser.id,
      sessionId: TEST_SESSION_ID,
    };

    const leaderboard = await LeaderboardModel.create({
      title: 'TEST does not remove an owner whose participation is removed',
      measures: [TALLY_MEASURE.WORD],
      startDate: null,
      endDate: null,
      goal: { [TALLY_MEASURE.WORD]: 50000 },
      individualGoalMode: false,
      fundraiserMode: false,
    }, testUser.id, reqCtx);

    const beforeUpdate = await LeaderboardModel.getMemberByUserId(leaderboard, testUser.id);
    expect(beforeUpdate).not.toBeNull();
    expect(beforeUpdate.isOwner).toBe(true);
    expect(beforeUpdate.isParticipant).toBe(false);

    const work1 = await WorkModel.createWork(testUser, { title: 'TEST work 1' }, reqCtx);
    const work2 = await WorkModel.createWork(testUser, { title: 'TEST work 2' }, reqCtx);
    const tag1 = await TagModel.createTag(testUser, { name: 'TEST tag 1' }, reqCtx);
    const tag2 = await TagModel.createTag(testUser, { name: 'TEST tag 2' }, reqCtx);
    await LeaderboardModel.updateMemberParticipation(beforeUpdate, {
      workIds: [work1.id, work2.id],
      tagIds: [tag1.id, tag2.id],
    }, reqCtx);

    const afterUpdate = await LeaderboardModel.getMemberByUserId(leaderboard, testUser.id);
    expect(afterUpdate).not.toBeNull();
    expect(afterUpdate.isOwner).toBe(true);
    expect(afterUpdate.isParticipant).toBe(true);

    const afterUpdateParticipants = await LeaderboardModel.listParticipants(leaderboard);
    expect(afterUpdateParticipants.length).toBe(1);

    const addedParticipation = await LeaderboardModel.getMemberParticipation(leaderboard.id, testUser.id);
    expect(addedParticipation).not.toBeNull();
    expect(addedParticipation.workIds.length).toBe(2);
    expect(addedParticipation.tagIds.length).toBe(2);

    await LeaderboardModel.removeMemberParticipation(afterUpdate, reqCtx);

    const afterRemoval = await LeaderboardModel.getMemberByUserId(leaderboard, testUser.id);
    expect(afterRemoval).not.toBeNull();
    expect(afterRemoval.isOwner).toBe(true);
    expect(afterRemoval.isParticipant).toBe(false);

    const afterRemovalParticipants = await LeaderboardModel.listParticipants(leaderboard);
    expect(afterRemovalParticipants.length).toBe(0);

    const removedParticipation = await LeaderboardModel.getMemberParticipation(leaderboard.id, testUser.id);
    expect(removedParticipation).toBeNull();
  });

  it('removes a non-owner member whose participation is removed', async () => {
    const leaderboard = await LeaderboardModel.create({
      title: 'TEST does not remove an owner whose participation is removed',
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

    const memberUser = await UserModel.createUser({
      username: 'leaderboard-test-member',
      password: '1234567890',
      email: 'leaderboard-test-member@example.com',
    }, {
      userId: TEST_SYSTEM_ID,
      sessionId: TEST_SESSION_ID,
    });

    const reqCtx: RequestContext = {
      userId: memberUser.id,
      sessionId: TEST_SESSION_ID,
    };

    const member = await LeaderboardModel.createMember(leaderboard, memberUser, {
      isParticipant: true,
      isOwner: false,
      starred: true,
      goal: null,
    }, reqCtx);

    const afterJoinParticipants = await LeaderboardModel.listParticipants(leaderboard);
    expect(afterJoinParticipants.length).toBe(1);
    expect(afterJoinParticipants[0].id).toBe(member.id);

    const afterJoinMember = await LeaderboardModel.getMemberByUserId(leaderboard, memberUser.id);
    expect(afterJoinMember).not.toBeNull();
    expect(afterJoinMember.isOwner).toBe(false);
    expect(afterJoinMember.isParticipant).toBe(true);

    const afterJoinBoards = await LeaderboardModel.list(memberUser.id);
    expect(afterJoinBoards.length).toBe(1);
    expect(afterJoinBoards[0].id).toBe(leaderboard.id);
    expect(afterJoinBoards[0].starred).toBe(true);

    const work1 = await WorkModel.createWork(memberUser, { title: 'TEST work 1' }, reqCtx);
    const work2 = await WorkModel.createWork(memberUser, { title: 'TEST work 2' }, reqCtx);
    const tag1 = await TagModel.createTag(memberUser, { name: 'TEST tag 1' }, reqCtx);
    const tag2 = await TagModel.createTag(memberUser, { name: 'TEST tag 2' }, reqCtx);
    await LeaderboardModel.updateMemberParticipation(member, {
      workIds: [work1.id, work2.id],
      tagIds: [tag1.id, tag2.id],
    }, reqCtx);

    const afterUpdateParticipation = await LeaderboardModel.getMemberParticipation(leaderboard.id, memberUser.id);
    expect(afterUpdateParticipation).not.toBeNull();
    expect(afterUpdateParticipation.workIds.length).toBe(2);
    expect(afterUpdateParticipation.tagIds.length).toBe(2);

    await LeaderboardModel.removeMemberParticipation(member, reqCtx);

    const afterRemoval = await LeaderboardModel.getMemberByUserId(leaderboard, memberUser.id);
    expect(afterRemoval).toBeNull();

    const afterRemovalParticipants = await LeaderboardModel.listParticipants(leaderboard);
    expect(afterRemovalParticipants.length).toBe(0);

    const removedParticipation = await LeaderboardModel.getMemberParticipation(leaderboard.id, memberUser.id);
    expect(removedParticipation).toBeNull();
  });
});
