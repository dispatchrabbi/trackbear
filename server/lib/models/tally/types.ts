import { type Tally as PrismaTally } from 'generated/prisma/client';
import { type Expand } from 'server/lib/obj';
import { type TallyMeasure } from './consts';

export type PlainTally = PrismaTally;
export type Tally = Expand<PrismaTally & {
  tagIds: number[];
}>;

export type MeasureRecord<T> = Record<TallyMeasure, T>;
export type MeasureCounts = MeasureRecord<number>;
