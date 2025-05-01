import type { Board as PrismaBoard, User, Tally, BoardParticipant, Work, Tag } from '@prisma/client';
import type { TallyMeasure } from '../tally/consts.ts';
import type { MeasureCounts } from '../tally/types.ts';
import { Expand } from 'server/lib/obj.ts';

export type BoardGoal = MeasureCounts | null;
export type Board = Expand<Omit<PrismaBoard, 'goal'> & {
  goal: BoardGoal;
}>;

export type BoardTally = Pick<Tally, 'uuid' | 'date' | 'measure' | 'count'>;
export type ParticipantBio = Pick<User, 'uuid' | 'displayName' | 'avatar'>;
export type ParticipantGoal = null | {
  measure: TallyMeasure;
  count: number;
};
export type FullParticipant = ParticipantBio & {
  goal: ParticipantGoal;
  tallies: BoardTally[];
};

export type BoardWithParticipantBios = Board & {
  participants: ParticipantBio[];
};
export type FullBoard = Board & {
  participants: FullParticipant[];
};

// These need to be converted to using IDs and ParticipantBio and all that
export type ExtendedBoardParticipant = BoardParticipant & {
  worksIncluded: Work[];
  tagsIncluded: Tag[];
};
export type BoardWithParticipants = Board & {
  participants: ExtendedBoardParticipant[];
};
