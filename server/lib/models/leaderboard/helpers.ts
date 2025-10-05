import { getDbClient } from 'server/lib/db.ts';

import type { Board, BoardParticipant, User } from 'generated/prisma/client';
import type { Leaderboard, LeaderboardMember, JustMember, ParticipantGoal, Participation, LeaderboardTeam, LeaderboardSummary, LeaderboardGoal, MemberBio } from './types';
import type { WorksAndTagsIncluded } from '../helpers';
import { TALLY_STATE } from '../tally/consts.ts';

import { included2ids } from '../helpers.ts';
import { omit, pick } from 'server/lib/obj.ts';

type BoardParticipantWithWorksAndTags = BoardParticipant & WorksAndTagsIncluded;
type BoardParticipantWithUser = BoardParticipant & { user: User };
type BoardWithTeamsAndParticipants = Board & {
  teams: LeaderboardTeam[];
  participants: BoardParticipantWithUser[];
};

export async function getTalliesForParticipants(leaderboard: Leaderboard, participants: BoardParticipantWithWorksAndTags[]) {
  if(participants.length === 0) {
    return [];
  }

  const db = getDbClient();
  const tallies = await db.tally.findMany({
    where: {
      state: TALLY_STATE.ACTIVE,
      // if there's an overall board goal, only include tallies with the board's measures
      measure: leaderboard.individualGoalMode ? undefined : { in: leaderboard.measures },
      // only include tallies within the time range (if one exists)
      date: {
        gte: leaderboard.startDate ?? undefined,
        lte: leaderboard.endDate ?? undefined,
      },
      // forgive me for what I do here
      OR: participants.map(participant => ({
        // the tally should be owned by the participant
        ownerId: participant.userId,
        // only include tallies with the measure from the individual goal, if there are individual goals
        // 'do-not-return-tallies' is a weird magic value that will never match a measure, so it forces no returned tallies for participants with no set goal
        measure: leaderboard.individualGoalMode ? ((participant.goal as ParticipantGoal)?.measure ?? 'do-not-return-tallies') : undefined,
        // only include tallies from works specified in the participant's config (if any were)
        workId: participant.worksIncluded.length > 0 ? { in: participant.worksIncluded.map(work => work.id) } : undefined,
        // only include tallies with at least one tag specified in the participant's config (if any were)
        tags: participant.tagsIncluded.length > 0 ? { some: { id: { in: participant.tagsIncluded.map(tag => tag.id) } } } : undefined,
      })),
    },
  });

  return tallies;
}

export function db2summary(record: BoardWithTeamsAndParticipants, participantUserId?: number): LeaderboardSummary;
export function db2summary(record: null, participantUserId?: number): null;
export function db2summary(record: BoardWithTeamsAndParticipants | null, participantUserId?: number): LeaderboardSummary | null {
  if(record === null) {
    return null;
  }

  const summary = {
    ...pick(record, [
      'id', 'uuid', 'state', 'ownerId', 'createdAt', 'updatedAt',
      'title', 'description',
      'measures', 'startDate', 'endDate',
      'individualGoalMode', 'fundraiserMode', 'enableTeams',
      'isJoinable', 'isPublic',
    ]),
    goal: record.goal as LeaderboardGoal,
    // use the starred property from the participant, not the leaderboard
    starred: record.participants.find(p => p.userId === participantUserId)?.starred ?? false,
    teams: record.teams,
    members: record.participants.map((participant): MemberBio => ({
      id: participant.id,
      isParticipant: participant.isParticipant,
      isOwner: participant.isOwner,
      userUuid: participant.user.uuid,
      displayName: participant.displayName || participant.user.displayName,
      avatar: participant.user.avatar,
      teamId: participant.teamId,
    })),
  };

  return summary;
}

export function db2member(record: BoardParticipantWithUser & WorksAndTagsIncluded): LeaderboardMember;
export function db2member(record: null): null;
export function db2member(record: (BoardParticipantWithUser & WorksAndTagsIncluded) | null): LeaderboardMember | null {
  if(record === null) {
    return null;
  }

  const converted: LeaderboardMember = {
    ...omit(included2ids(record), ['user']) as LeaderboardMember,
    displayName: record.user.displayName,
    avatar: record.user.avatar,
  };

  return converted;
}

export function db2justmember(record: BoardParticipantWithUser): JustMember;
export function db2justmember(record: null): null;
export function db2justmember(record: BoardParticipantWithUser | null): JustMember | null {
  if(record === null) {
    return null;
  }

  const converted: JustMember = {
    ...omit(record, ['user']) as JustMember,
    // if there's no board-specific displayName, fall back to the user's normal displayName
    displayName: record.displayName || record.user.displayName,
    avatar: record.user.avatar,
  };

  return converted;
}

export function db2participation(record: BoardParticipantWithWorksAndTags): Participation;
export function db2participation(record: null): null;
export function db2participation(record: BoardParticipantWithWorksAndTags | null): Participation | null {
  if(record === null) {
    return null;
  }

  return included2ids(pick(record, [
    'id', 'isParticipant', 'displayName', 'color', 'goal', 'teamId', 'worksIncluded', 'tagsIncluded',
  ])) as Participation;
}
