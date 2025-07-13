import dbClient from '../../db.ts';

import type { BoardParticipant } from 'generated/prisma/client';
import type { Leaderboard, ParticipantGoal } from './types';
import type { WorksAndTagsIncluded } from '../helpers';
import { TALLY_STATE } from '../tally/consts.ts';

type BoardParticipantWithWorksAndTags = BoardParticipant & WorksAndTagsIncluded;

export async function getTalliesForParticipants(leaderboard: Leaderboard, participants: BoardParticipantWithWorksAndTags[]) {
  if(participants.length === 0) {
    return [];
  }

  const tallies = await dbClient.tally.findMany({
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
