import { type Goal as PrismaGoal } from 'generated/prisma/client';
import { type TallyMeasure } from '../tally/consts';
import { type GoalCadenceUnit, GOAL_TYPE } from './consts';
import { Expand } from 'server/lib/obj';

export type GoalThreshold = {
  measure: TallyMeasure;
  count: number;
};

export type GoalCadence = {
  times?: number | null; // actually, this property is on hiatus until I want to start using it again
  period: number;
  unit: GoalCadenceUnit;
};

export type TargetGoalParameters = {
  threshold: GoalThreshold;
  cadence?: null;
};

export type HabitGoalParameters = {
  cadence: GoalCadence;
  threshold: GoalThreshold | null;
};

export type GoalParameters = TargetGoalParameters | HabitGoalParameters;

export type Goal = Expand<Omit<PrismaGoal, 'type' | 'parameters'> & {
  type: string;
  parameters: Record<string, never> | GoalParameters;
  workIds: number[]; // empty array = don't filter by work
  tagIds: number[]; // empty array = don't filter by tag
}>;

export type TargetGoal = Goal & {
  type: typeof GOAL_TYPE.TARGET;
  parameters: TargetGoalParameters;
};

export type HabitGoal = Goal & {
  type: typeof GOAL_TYPE.HABIT;
  parameters: HabitGoalParameters;
};
