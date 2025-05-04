import type { Board as PrismaBoard, User, Tally, BoardParticipant as PrismaBoardParticipant } from '@prisma/client';
import type { TallyMeasure } from '../tally/consts.ts';
import type { MeasureCounts } from '../tally/types.ts';
import type { Expand } from 'server/lib/obj.ts';

export type Leaderboard = Expand<Omit<PrismaBoard, 'goal' | 'measures'> & {
  measures: TallyMeasure[];
  goal: LeaderboardGoal;
}>;
export type LeaderboardGoal = MeasureCounts | null;

// Eventually, displayName will be in the BoardParticipant table and can move over from the User type
// and we'll also have stuff like 'team' and 'color'
export type LeaderboardMember = Expand<
  Omit<PrismaBoardParticipant, 'goal'>
  & {
    goal: ParticipantGoal;
    workIds: number[];
    tagIds: number[];
  }
  & Pick<User, 'displayName' | 'avatar'>
>;
export type ParticipantGoal = null | {
  measure: TallyMeasure;
  count: number;
};

export type JustMember = Omit<LeaderboardMember, 'workIds' | 'tagIds'>;

export type LeaderboardSummary = Leaderboard & {
  members: MemberBio[];
};
export type MemberBio = Pick<LeaderboardMember, 'id' | 'isParticipant' | 'isOwner' | 'displayName' | 'avatar'> & {
  userUuid: string;
};

export type Participant = Expand<
  Pick<LeaderboardMember, 'id' | 'uuid' | 'goal' | 'avatar' | 'displayName'>
  & {
    tallies: LeaderboardTally[];
  }
>;
export type LeaderboardTally = Pick<Tally, 'uuid' | 'date' | 'measure' | 'count'>;

export type Participation = Expand<Pick<LeaderboardMember, 'id' | 'goal' | 'isParticipant' | 'workIds' | 'tagIds'>>;

export type Membership = Pick<LeaderboardMember, 'uuid' | 'state' | 'avatar' | 'displayName' | 'isOwner' | 'isParticipant'>;
