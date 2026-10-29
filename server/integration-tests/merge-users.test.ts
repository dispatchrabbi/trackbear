import { expect, describe, it, beforeAll } from 'vitest';

import { disableEmail } from 'testing-support/env.ts';

import { reqCtxForScript } from 'server/lib/request-context.ts';

import { validateSeed, createSeed } from 'testing-support/seed/seed.ts';
import mergeUsersSeedJson from '../../testing-support/seed/merge-users-seed.json' with { type: 'json' };

import { MergeError, MergeUsers } from 'server/lib/data-manipulations/merge-users';
import { UserModel } from 'server/lib/models/user/user-model';
import { USER_STATE } from 'server/lib/models/user/consts';
import { TagModel } from 'server/lib/models/tag/tag-model';
import { ProjectModel } from 'server/lib/models/project/project-model';
import { GoalModel } from 'server/lib/models/goal/goal-model';
import { GOAL_TYPE } from 'server/lib/models/goal/consts';
import { LeaderboardModel } from 'server/lib/models/leaderboard/leaderboard-model';
import { type Leaderboard } from 'server/api/v1/leaderboard';
import { TallyModel } from 'server/lib/models/tally/tally-model.wip';

describe(MergeUsers, () => {
  beforeAll(async () => {
    await disableEmail();
  });

  describe('mergeUsers', () => {
    it('successfully merges one user into another', async () => {
      const reqCtx = reqCtxForScript('integration-tests/merge-users.test.ts');

      const seedConfig = validateSeed(mergeUsersSeedJson);
      const seed = await createSeed(seedConfig, reqCtx);

      // The old account must be suspended to merge
      const oldAndBusted = await UserModel.getUser(seed.old_and_busted.user.id);
      await UserModel.setUserState(oldAndBusted!, USER_STATE.SUSPENDED, reqCtx);

      const merge = await MergeUsers.mergeUsers(
        seed.new_hotness.user.id,
        seed.old_and_busted.user.id,
        reqCtx,
      );

      expect(merge).not.toBeNull();

      // we should have one renamed tag, keyed by "greige"
      expect(merge.updatedTags.length).toBe(1);
      expect(merge.updatedTags[0].id).toBe(seed.old_and_busted.tags.greige.id);

      // we should have one deleted membership, under the "both" leaderboard owned by "third_party"
      expect(merge.deletedMembers.length).toBe(1);
      expect(merge.deletedMembers[0].id).toBe(seed.old_and_busted.memberships.both.id);
      expect(merge.deletedMembers[0].boardId).toBe(seed.third_party.leaderboards.both.id);

      // old_and_busted should be marked merged
      const oldUser = await UserModel.getUser(seed.old_and_busted.user.id);
      expect(oldUser).not.toBeNull();
      expect(oldUser!.state).toBe(USER_STATE.MERGED);
      expect(oldUser!.futureLifeId).toBe(seed.new_hotness.user.id);

      // new_hotness should have a bunch of new stuff
      const newUser = await UserModel.getUser(seed.new_hotness.user.id);
      expect(newUser).not.toBeNull();
      expect(newUser!.state).toBe(USER_STATE.ACTIVE);

      // should have all 5 tags
      const tags = await TagModel.getTags(newUser!);
      expect(tags.length).toBe(5);

      const tagIds = tags.map(tag => tag.id);
      expect(tagIds).toContain(seed.old_and_busted.tags.dusty.id);
      expect(tagIds).toContain(seed.old_and_busted.tags.greige.id);
      expect(tagIds).toContain(seed.new_hotness.tags.fancy.id);
      expect(tagIds).toContain(seed.new_hotness.tags.accent.id);
      expect(tagIds).toContain(seed.new_hotness.tags.cloudy.id);

      // should have all 4 projects
      const projects = await ProjectModel.getProjects(newUser!);
      expect(projects.length).toBe(4);

      const projectIds = projects.map(p => p.id);
      expect(projectIds).toContain(seed.old_and_busted.projects.abandoned.id);
      expect(projectIds).toContain(seed.old_and_busted.projects.best_intentions.id);
      expect(projectIds).toContain(seed.new_hotness.projects.inspired.id);
      expect(projectIds).toContain(seed.new_hotness.projects.feeling_good.id);

      // should have all 4 targets
      const targets = await GoalModel.getGoals(newUser!, GOAL_TYPE.TARGET);
      expect(targets.length).toBe(4);

      const targetIds = targets.map(t => t.id);
      expect(targetIds).toContain(seed.old_and_busted.targets.deluded.id);
      expect(targetIds).toContain(seed.old_and_busted.targets.neutral.id);
      expect(targetIds).toContain(seed.new_hotness.targets.high_hopes.id);
      expect(targetIds).toContain(seed.new_hotness.targets.kicking_it.id);

      // should have all 4 habits
      const habits = await GoalModel.getGoals(newUser!, GOAL_TYPE.HABIT);
      expect(habits.length).toBe(4);

      const habitIds = habits.map(t => t.id);
      expect(habitIds).toContain(seed.old_and_busted.habits.forced_march.id);
      expect(habitIds).toContain(seed.old_and_busted.habits.clean_up.id);
      expect(habitIds).toContain(seed.new_hotness.habits.reasonable_pace.id);
      expect(habitIds).toContain(seed.new_hotness.habits.reminder.id);

      // should have memberships in 5 leaderboards, own 2 and be a member in the other three
      const leaderboards = await LeaderboardModel.list(newUser!.id);
      expect(leaderboards.length).toBe(5);

      const leaderboardIds = leaderboards.map(l => l.id);
      expect(leaderboardIds).toContain(seed.old_and_busted.leaderboards.members_only.id);
      expect(leaderboardIds).toContain(seed.new_hotness.leaderboards.faceoff.id);
      expect(leaderboardIds).toContain(seed.third_party.leaderboards.just_old.id);
      expect(leaderboardIds).toContain(seed.third_party.leaderboards.just_new.id);
      expect(leaderboardIds).toContain(seed.third_party.leaderboards.both.id);

      const ownsMembersOnly = await LeaderboardModel.isUserOwner({ id: seed.old_and_busted.leaderboards.members_only.id } as Leaderboard, newUser!.id);
      expect(ownsMembersOnly).toBe(true);

      const ownsFaceoff = await LeaderboardModel.isUserOwner({ id: seed.new_hotness.leaderboards.faceoff.id } as Leaderboard, newUser!.id);
      expect(ownsFaceoff).toBe(true);

      // should not be an owner of this leaderboard, even though old_and_busted was, because new_hotness's pre-existing membership was not
      const ownsBoth = await LeaderboardModel.isUserOwner({ id: seed.third_party.leaderboards.both.id } as Leaderboard, newUser!.id);
      expect(ownsBoth).toBe(false);

      // should have all the tallies
      const tallies = await TallyModel.getTallies(newUser!);
      expect(tallies.length).toBe(
        30 + 31 + 30 + 31 +
        31 + 31 + 30 + 31 +
        4 +
        28 + 31 + 30 +
        31 + 30 + 31 + 30 +
        4,
      );
    });

    it('refuses to merge into an inactive account', async () => {
      const reqCtx = reqCtxForScript('integration-tests/merge-users.test.ts');

      const seedConfig = validateSeed(mergeUsersSeedJson);
      const seed = await createSeed(seedConfig, reqCtx);

      const newHotness = await UserModel.getUser(seed.new_hotness.user.id);
      await UserModel.setUserState(newHotness!, USER_STATE.SUSPENDED, reqCtx);

      const mergePromise = MergeUsers.mergeUsers(
        seed.new_hotness.user.id,
        seed.old_and_busted.user.id,
        reqCtx,
      );

      await expect(mergePromise).rejects.toThrowError(MergeError);
    });

    it('refuses to merge a non-suspended account', async () => {
      const reqCtx = reqCtxForScript('integration-tests/merge-users.test.ts');

      const seedConfig = validateSeed(mergeUsersSeedJson);
      const seed = await createSeed(seedConfig, reqCtx);

      const mergePromise = MergeUsers.mergeUsers(
        seed.new_hotness.user.id,
        seed.old_and_busted.user.id, // active by default
        reqCtx,
      );

      await expect(mergePromise).rejects.toThrowError(MergeError);
    });
  });
});
