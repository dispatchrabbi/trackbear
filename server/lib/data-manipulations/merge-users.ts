import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import { getDbClient, type TransactionClient } from 'server/lib/db.ts';

import { USER_STATE } from '../models/user/consts';

import { type RequestContext } from 'server/lib/request-context.ts';
import { buildChangeRecord, logAuditEvent, logManyAuditEvents } from 'server/lib/audit-events.ts';
import { AUDIT_EVENT_TYPE } from 'server/lib/models/audit-event/consts.ts';

type UserWithPastLives = User & {
  pastLives: {
    id: number;
  }[];
};

import { traced } from 'server/lib/metrics/tracer.ts';
import { type User } from '../models/user/user-model';
import { type Tag } from '../models/tag/tag-model';
import { type Project } from '../models/project/project-model';
import { type HabitGoal, type TargetGoal } from '../models/goal/types';
import { type JustMember, type Leaderboard } from '../models/leaderboard/types';
import { type Tally } from '../models/tally/types';
import { type CreateAuditEventData } from '../models/audit-event/audit-event-model';
import { GOAL_TYPE } from '../models/goal/consts';
import { UserModel } from '../models/user/user-model';
import { performance } from 'node:perf_hooks';

export class MergeUsers {
  @traced
  static async mergeUsers(currentUserId: number, pastUserId: number, reqCtx: RequestContext): Promise<{
    currentUser: User;
    pastUser: User;
    tags: Tag[];
    projects: Project[];
    targets: TargetGoal[];
    habits: HabitGoal[];
    leaderboards: Leaderboard[];
    memberships: JustMember[];
    tallies: Tally[];
    updatedTags: Tag[];
    deletedMembers: JustMember[];
  }> {
    if(currentUserId === pastUserId) {
      throw new Error('Cannot merge a user into itself');
    }

    const startTime = performance.now();
    logger.info(`mergeUsers: Attempting to merge user ${pastUserId} into user ${currentUserId}...`);

    const db = getDbClient();
    try {
      const result = await db.$transaction(async tx => {
        // first, ensure that both users exist
        let currentUser = await this.findUser(tx, currentUserId);
        if(!currentUser) {
          throw new Error(`Did not find a user for currentUserId ${currentUserId}`);
        }
        if(currentUser.state !== USER_STATE.ACTIVE) {
          throw new Error(`User ${currentUser.id} is not active and so cannot be the target of a merge`);
        }

        const pastUser = await this.findUser(tx, pastUserId);
        if(!pastUser) {
          throw new Error(`Did not find a user for pastUserId ${pastUserId}`);
        }
        if(pastUser.state !== USER_STATE.SUSPENDED) {
          throw new Error(`User ${pastUser.id} is not suspended and so cannot be merged into another user`);
        }

        // next, add the past user ID and any of its past user IDs to the host user ID's list of past lives
        const pastLivesForCurrentUser = [pastUser.id, ...pastUser.pastLives.map(u => u.id)];
        currentUser = await this.updatePastLives(tx, currentUser, pastLivesForCurrentUser, reqCtx);
        logger.info(`mergeUsers: Adding ${pastLivesForCurrentUser} as past lives for user ${currentUser.id}.`);

        // check for conflicting tag names and update them if needed
        const updatedTags = await this.updateConflictingPastTags(tx, currentUser, pastUser, reqCtx);
        logger.info(`mergeUsers: Found ${updatedTags.length} tags for user ${pastUser.id} with the same name as a tag for user ${currentUser.id}. Updating names for tags ${updatedTags.map(t => t.id).join(', ')}.`);

        // determine if the old user and new user are in any leaderboards together and, if so, remove the old user
        const deletedMembers = await this.deleteConflictingPastLeaderboardMemberships(tx, currentUser, pastUser, reqCtx);
        logger.info(`mergeUsers: Found ${deletedMembers.length} memberships for user ${pastUser.id} on boards where user ${currentUser.id} is also a member. Deleting memberships for user ${pastUser.id} from boards ${deletedMembers.map(m => m.boardId).join(', ')}.`);

        // transfer over the past user's tags, projects, targets, habits, leaderboards, leaderboard memberships, and tallies
        const [tags, projects, targets, habits, leaderboards, memberships, tallies] = await Promise.all([
          this.transferTags(tx, currentUser, pastUser, reqCtx),
          this.transferProjects(tx, currentUser, pastUser, reqCtx),
          this.transferTargets(tx, currentUser, pastUser, reqCtx),
          this.transferHabits(tx, currentUser, pastUser, reqCtx),
          this.transferLeaderboards(tx, currentUser, pastUser, reqCtx),
          this.transferMemberships(tx, currentUser, pastUser, reqCtx),
          this.transferTallies(tx, currentUser, pastUser, reqCtx),
        ]);
        logger.info(`mergeUsers: Transferred ${tags.length} tags (${tags.map(r => r.id)}) from user ${pastUser.id} to user ${currentUser.id}`);
        logger.info(`mergeUsers: Transferred ${projects.length} projects (${projects.map(r => r.id)}) from user ${pastUser.id} to user ${currentUser.id}`);
        logger.info(`mergeUsers: Transferred ${targets.length} targets (${targets.map(r => r.id)}) from user ${pastUser.id} to user ${currentUser.id}`);
        logger.info(`mergeUsers: Transferred ${habits.length} habits (${habits.map(r => r.id)}) from user ${pastUser.id} to user ${currentUser.id}`);
        logger.info(`mergeUsers: Transferred ${leaderboards.length} leaderboards (${leaderboards.map(r => r.id)}) from user ${pastUser.id} to user ${currentUser.id}`);
        logger.info(`mergeUsers: Transferred ${memberships.length} memberships (${memberships.map(r => r.id)}) from user ${pastUser.id} to user ${currentUser.id}`);
        logger.info(`mergeUsers: Transferred ${tallies.length} tallies (${tallies.map(r => r.id)}) from user ${pastUser.id} to user ${currentUser.id}`);

        // set the past user to MERGED
        logger.info(`mergeUsers: Setting user ${pastUser.id} to the MERGED state`);
        const mergedPastUser = await UserModel.setUserState(pastUser, USER_STATE.MERGED, reqCtx, tx);

        // Bob's your uncle!
        logger.info(`mergeUsers: Completed merging user ${pastUser.id} into user ${currentUser.id}!`);
        return {
          currentUser,
          pastUser: mergedPastUser,
          tags,
          projects,
          targets,
          habits,
          leaderboards,
          memberships,
          tallies,
          updatedTags,
          deletedMembers,
        };
      },
      {
        isolationLevel: 'Serializable',
        timeout: 5 * 60 * 1000,
      });

      logger.info(`mergeUsers: Took ${performance.now() - startTime}ms`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`mergeUsers: Failed to merge user ${pastUserId} into user ${currentUserId}: ${msg}`);
      logger.info(`mergeUsers: Took ${performance.now() - startTime}ms`);

      throw new MergeError(msg, err instanceof Error ? { cause: err } : undefined);
    }
  }

  @traced
  private static async findUser(tx: TransactionClient, id: number): Promise<UserWithPastLives | null> {
    return await tx.user.findUnique({
      where: {
        id,
        // do not find deleted users or already-merged users
        state: { in: [USER_STATE.ACTIVE, USER_STATE.SUSPENDED] },
      },
      include: {
        pastLives: { select: { id: true } },
      },
    }) satisfies UserWithPastLives | null;
  }

  @traced
  private static async updatePastLives(tx: TransactionClient, currentUser: UserWithPastLives, pastLivesIds: number[], reqCtx: RequestContext): Promise<UserWithPastLives> {
    const updated = await tx.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        pastLives: {
          connect: pastLivesIds.map(id => ({ id })),
        },
      },
      include: {
        pastLives: { select: { id: true } },
      },
    }) satisfies UserWithPastLives;

    const pastLivesChanges = buildChangeRecord(currentUser, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.USER_UPDATE,
      reqCtx.userId, updated.id, null,
      pastLivesChanges, reqCtx.sessionId,
      { db: tx },
    );

    return updated;
  }

  @traced
  private static async updateConflictingPastTags(tx: TransactionClient, currentUser: User, pastUser: User, reqCtx: RequestContext): Promise<Tag[]> {
    const tagsForBoth = await tx.tag.findMany({
      where: {
        ownerId: { in: [pastUser.id, currentUser.id] },
      },
    });

    const currentTagNames = tagsForBoth.filter(tag => tag.ownerId === currentUser.id).map(tag => tag.name);
    const conflictingTags = tagsForBoth.filter(tag => (tag.ownerId === pastUser.id && currentTagNames.includes(tag.name)));
    const updatedTags = await Promise.all(conflictingTags.map(async tag => {
      const updated = await tx.tag.update({
        where: { id: tag.id },
        data: {
          name: `${tag.name} (${pastUser.username})`,
        },
      });

      const changes = buildChangeRecord(tag, updated);
      await logAuditEvent(AUDIT_EVENT_TYPE.TAG_UPDATE,
        reqCtx.userId, tag.id, null,
        changes, reqCtx.sessionId,
        { db: tx },
      );

      return updated;
    }));

    return updatedTags;
  }

  @traced
  private static async deleteConflictingPastLeaderboardMemberships(tx: TransactionClient, currentUser: User, pastUser: User, reqCtx: RequestContext): Promise<JustMember[]> {
    const currentLeaderboardMembers = await tx.boardParticipant.findMany({
      where: {
        userId: currentUser.id,
      },
    });
    const pastLeaderboardMembersToDelete = await tx.boardParticipant.findMany({
      where: {
        userId: pastUser.id,
        boardId: { in: currentLeaderboardMembers.map(member => member.boardId) },
      },
    });

    const deletedMembers = await Promise.all(pastLeaderboardMembersToDelete.map(async member => {
      const deleted = await tx.boardParticipant.delete({
        where: { id: member.id },
      });

      const changes = buildChangeRecord(member, deleted);
      await logAuditEvent(AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_DELETE,
        reqCtx.userId, member.id, member.boardId,
        changes, reqCtx.sessionId,
        { db: tx },
      );

      return deleted;
    })) as JustMember[];

    return deletedMembers;
  }

  @traced
  private static async transferTags(tx: TransactionClient, currentUser: User, pastUser: User, reqCtx: RequestContext): Promise<Tag[]> {
    const transferred = await tx.tag.updateManyAndReturn({
      where: { ownerId: pastUser.id },
      data: { ownerId: currentUser.id },
    });

    const auditEvents: CreateAuditEventData[] = transferred.map(record => ({
      eventType: AUDIT_EVENT_TYPE.TAG_UPDATE,
      agentId: reqCtx.userId,
      patientId: record.id,
      goalId: null,
      auxInfo: { ownerId: { from: pastUser.id, to: currentUser.id } },
      sessionId: reqCtx.sessionId,
    } satisfies CreateAuditEventData));
    await logManyAuditEvents(auditEvents, { db: tx });

    return transferred;
  }

  @traced
  private static async transferProjects(tx: TransactionClient, currentUser: User, pastUser: User, reqCtx: RequestContext): Promise<Project[]> {
    const transferred = await tx.work.updateManyAndReturn({
      where: { ownerId: pastUser.id },
      data: { ownerId: currentUser.id },
    }) as Project[];

    const auditEvents: CreateAuditEventData[] = transferred.map(record => ({
      eventType: AUDIT_EVENT_TYPE.PROJECT_UPDATE,
      agentId: reqCtx.userId,
      patientId: record.id,
      goalId: null,
      auxInfo: { ownerId: { from: pastUser.id, to: currentUser.id } },
      sessionId: reqCtx.sessionId,
    } satisfies CreateAuditEventData));
    await logManyAuditEvents(auditEvents, { db: tx });

    return transferred;
  }

  @traced
  private static async transferTargets(tx: TransactionClient, currentUser: User, pastUser: User, reqCtx: RequestContext): Promise<TargetGoal[]> {
    const transferred = await tx.goal.updateManyAndReturn({
      where: {
        ownerId: pastUser.id,
        type: GOAL_TYPE.TARGET,
      },
      data: { ownerId: currentUser.id },
    }) as TargetGoal[];

    const auditEvents: CreateAuditEventData[] = transferred.map(record => ({
      eventType: AUDIT_EVENT_TYPE.GOAL_UPDATE,
      agentId: reqCtx.userId,
      patientId: record.id,
      goalId: null,
      auxInfo: { ownerId: { from: pastUser.id, to: currentUser.id } },
      sessionId: reqCtx.sessionId,
    } satisfies CreateAuditEventData));
    await logManyAuditEvents(auditEvents, { db: tx });

    return transferred;
  }

  @traced
  private static async transferHabits(tx: TransactionClient, currentUser: User, pastUser: User, reqCtx: RequestContext): Promise<HabitGoal[]> {
    const transferred = await tx.goal.updateManyAndReturn({
      where: {
        ownerId: pastUser.id,
        type: GOAL_TYPE.HABIT,
      },
      data: { ownerId: currentUser.id },
    }) as HabitGoal[];

    const auditEvents: CreateAuditEventData[] = transferred.map(record => ({
      eventType: AUDIT_EVENT_TYPE.GOAL_UPDATE,
      agentId: reqCtx.userId,
      patientId: record.id,
      goalId: null,
      auxInfo: { ownerId: { from: pastUser.id, to: currentUser.id } },
      sessionId: reqCtx.sessionId,
    } satisfies CreateAuditEventData));
    await logManyAuditEvents(auditEvents, { db: tx });

    return transferred;
  }

  @traced
  private static async transferLeaderboards(tx: TransactionClient, currentUser: User, pastUser: User, reqCtx: RequestContext): Promise<Leaderboard[]> {
    const transferred = await tx.board.updateManyAndReturn({
      where: { ownerId: pastUser.id },
      data: { ownerId: currentUser.id },
    }) as Leaderboard[];

    const auditEvents: CreateAuditEventData[] = transferred.map(record => ({
      eventType: AUDIT_EVENT_TYPE.LEADERBOARD_UPDATE,
      agentId: reqCtx.userId,
      patientId: record.id,
      goalId: null,
      auxInfo: { ownerId: { from: pastUser.id, to: currentUser.id } },
      sessionId: reqCtx.sessionId,
    } satisfies CreateAuditEventData));
    await logManyAuditEvents(auditEvents, { db: tx });

    return transferred;
  }

  @traced
  private static async transferMemberships(tx: TransactionClient, currentUser: User, pastUser: User, reqCtx: RequestContext): Promise<JustMember[]> {
    const transferred = await tx.boardParticipant.updateManyAndReturn({
      where: { userId: pastUser.id },
      data: { userId: currentUser.id },
    }) as JustMember[];

    const auditEvents: CreateAuditEventData[] = transferred.map(record => ({
      eventType: AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_UPDATE,
      agentId: reqCtx.userId,
      patientId: record.id,
      goalId: null,
      auxInfo: { userId: { from: pastUser.id, to: currentUser.id } },
      sessionId: reqCtx.sessionId,
    } satisfies CreateAuditEventData));
    await logManyAuditEvents(auditEvents, { db: tx });

    return transferred;
  }

  @traced
  private static async transferTallies(tx: TransactionClient, currentUser: User, pastUser: User, reqCtx: RequestContext): Promise<Tally[]> {
    const transferred = await tx.tally.updateManyAndReturn({
      where: { ownerId: pastUser.id },
      data: { ownerId: currentUser.id },
    }) as Tally[];

    const auditEvents: CreateAuditEventData[] = transferred.map(record => ({
      eventType: AUDIT_EVENT_TYPE.TALLY_UPDATE,
      agentId: reqCtx.userId,
      patientId: record.id,
      goalId: null,
      auxInfo: { ownerId: { from: pastUser.id, to: currentUser.id } },
      sessionId: reqCtx.sessionId,
    } satisfies CreateAuditEventData));
    await logManyAuditEvents(auditEvents, { db: tx });

    return transferred;
  }
}

export class MergeError extends Error {
  constructor(message: string, options?: { cause: Error }) {
    super(message, options);
    Error.captureStackTrace(this, MergeError);

    this.name = 'MergeError';
  }
}
