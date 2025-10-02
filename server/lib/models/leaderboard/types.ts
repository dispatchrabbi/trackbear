import type { Board as PrismaBoard, User, Tally, BoardParticipant as PrismaBoardParticipant, BoardTeam as PrismaBoardTeam } from 'generated/prisma/client';
import type { TallyMeasure } from '../tally/consts.ts';
import type { MeasureCounts } from '../tally/types.ts';
import type { Expand } from 'server/lib/obj.ts';

export type Leaderboard = Expand<Omit<PrismaBoard, 'goal' | 'measures'> & {
  measures: TallyMeasure[];
  goal: LeaderboardGoal;
}>;
export type LeaderboardGoal = MeasureCounts;

// Coming soon: 'team'
export type LeaderboardMember = Expand<
  Omit<PrismaBoardParticipant, 'goal'>
  & {
    goal: ParticipantGoal;
    workIds: number[];
    tagIds: number[];
  }
  & Pick<User, 'avatar'>
>;
export type ParticipantGoal = null | {
  measure: TallyMeasure;
  count: number;
};

export type JustMember = Omit<LeaderboardMember, 'workIds' | 'tagIds'>;

export type LeaderboardSummary = Leaderboard & {
  teams: LeaderboardTeam[];
  members: MemberBio[];
};
export type MemberBio = Expand<
  Pick<LeaderboardMember, 'id' | 'isParticipant' | 'isOwner' | 'displayName' | 'avatar' | 'teamId'>
  & {
    userUuid: string;
  }
>;

export type Participant = Expand<
  Pick<LeaderboardMember, 'id' | 'uuid' | 'goal' | 'avatar' | 'displayName' | 'color' | 'teamId'>
  & {
    tallies: LeaderboardTally[];
  }
>;
export type LeaderboardTally = Pick<Tally, 'uuid' | 'date' | 'measure' | 'count'>;

export type Participation = Expand<Pick<LeaderboardMember, 'id' | 'goal' | 'isParticipant' | 'displayName' | 'color' | 'teamId' | 'workIds' | 'tagIds'>>;

export type Membership = Pick<LeaderboardMember, 'id' | 'uuid' | 'state' | 'avatar' | 'displayName' | 'color' | 'isOwner' | 'isParticipant' | 'teamId'>;

export type LeaderboardTeam = PrismaBoardTeam;
