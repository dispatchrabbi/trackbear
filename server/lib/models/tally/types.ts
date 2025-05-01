import { type TallyMeasure } from './consts';

export type MeasureRecord<T> = Record<TallyMeasure, T>;
export type MeasureCounts = MeasureRecord<number>;
