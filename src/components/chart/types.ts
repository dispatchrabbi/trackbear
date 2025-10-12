import { type Expand } from 'server/lib/obj';

export type BareDataPoint = {
  date: string;
  value: number;
};

export type SeriesDataPoint = Expand<BareDataPoint & {
  series: string;
}>;

export type TooltipDataPoint = {
  series: string;
  date: Date;
  value: number;
};
