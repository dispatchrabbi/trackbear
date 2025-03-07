import type { Board as PrismaBoard, User, Tally, BoardParticipant as PrismaBoardParticipant } from "@prisma/client";
import type { TallyMeasure } from "../tally/consts.ts";
import type { MeasureCounts } from "../tally/types.ts";
import type { Expand } from "server/lib/obj.ts";

export type LeaderboardGoal = MeasureCounts | null;
export type Leaderboard = Expand<Omit<PrismaBoard, 'goal' | 'measures'> & {
  measures: TallyMeasure[];
  goal: LeaderboardGoal;
}>;

export type ParticipantGoal = null | {
  measure: TallyMeasure;
  count: number;
};
export type LeaderboardParticipant = Expand<Omit<PrismaBoardParticipant, 'goal'> & {
  goal: ParticipantGoal;
}>;

export type ParticipantBio = Pick<LeaderboardParticipant, 'id'> & Pick<User, 'displayName' | 'avatar'>;

export type LeaderboardSummary = Leaderboard & {
  participants: ParticipantBio[];
};

export type LeaderboardTally = Pick<Tally, 'uuid' | 'date' | 'measure' | 'count'>;

// TODO: later on this will have stuff like 'team' and 'color' and 'displayName'
export type Participant = Expand<Pick<LeaderboardParticipant, 'id' | 'uuid' | 'goal'>
  & {
    tallies: LeaderboardTally[];
  }>;

// TODO: later on this will have stuff like 'team' and 'color' and 'displayName'
export type Participation = Expand<Pick<LeaderboardParticipant, 'id' | 'goal'> & {
  workIds: number[];
  tagIds: number[];
}>;

// TODO: later on this will have stuff like 'team' and 'color' and 'displayName'
export type Member = LeaderboardParticipant & Pick<User, 'displayName' | 'avatar'>;