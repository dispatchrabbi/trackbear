import z from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';

import { WORK_PHASE } from 'server/lib/models/work/consts.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts.ts';
import { GOAL_CADENCE_UNIT } from 'server/lib/models/goal/consts.ts';

const zTallyMeasure = () => z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>);
const zMeasureCounts = () => z.record(zTallyMeasure(), z.number().int());

const zKey = () => z.string().regex(/^\w+$/);
const zDate = () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const zProjectList = () => zKey().array().nullable();
// TODO: implement tags
const zTagList = () => zKey().array().nullable();

const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  phase: z.enum(Object.values(WORK_PHASE) as NonEmptyArray<string>).default(WORK_PHASE.PLANNING),
  startingBalance: zMeasureCounts().default({}),
});
export type ProjectSchema = z.infer<typeof projectSchema>;

const tallySchema = z.object({
  project: z.string(),
  start: zDate(),
  end: zDate(),
  // chance that a tally is recorded on any given day
  frequency: z.number().gte(0).lte(1).default(1),
  // chance that there is more than one tally on any given day
  repeat: z.number().gte(0).lte(1).default(0),
  measure: zTallyMeasure(),
  // minimum and maximum count for the day
  min: z.number().int(),
  max: z.number().int(),
  // use the key for the associated project
  tags: z.array(z.string()).default([]), // TODO: enable tags
});
export type TallySchema = z.infer<typeof tallySchema>;

const targetSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  start: zDate().default(null),
  end: zDate().default(null),
  measure: zTallyMeasure(),
  count: z.number().int(),
  // projects: [] indicates all projects
  projects: zProjectList().default([]),
  tags: zTagList().default([]),
});
export type TargetSchema = z.infer<typeof targetSchema>;

const habitSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  start: zDate().default(null),
  end: zDate().default(null),
  unit: z.enum(Object.values(GOAL_CADENCE_UNIT) as NonEmptyArray<string>),
  period: z.number().int().gte(1),
  // measure and count must both be included or omitted
  measure: zTallyMeasure().optional(),
  count: z.number().int().optional(),
  // projects: [] indicates all projects
  projects: zProjectList().default([]),
  // tags: [] indicates all tags
  tags: zTagList().default([]), // TODO: enable tags
});
export type HabitSchema = z.infer<typeof habitSchema>;

const leaderboardSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  start: zDate().default(null),
  end: zDate().default(null),
  individualGoalMode: z.boolean().default(false),
  fundraiserMode: z.boolean().default(false),
  // measures is not used with individualGoalMode
  measures: z.array(zTallyMeasure()).optional(),
  // goal is not used with individualGoalMode
  goal: zMeasureCounts().default({}),
});
export type LeaderboardSchema = z.infer<typeof leaderboardSchema>;

// use null to just be a spectator
const zParticipation = () => z.object({
  // projects: [] indicates all projects
  projects: zProjectList().default([]),
  // tags: [] indicates all tags
  tags: zTagList().default([]), // TODO: enable tags
  // required for individual goal mode
  measure: zTallyMeasure().optional(),
  // required for individual goal mode
  count: z.number().int().optional(),
}).nullable();

const joinLeaderboardSchema = z.union([
  // pass a uuid for an existing board
  z.object({
    uuid: z.string().uuid(),
    member: zKey(),
    participation: zParticipation(),
  }),
  // pass the appropriate key for a leaderboard created as part of this config
  z.object({
    owner: zKey(),
    key: zKey(),
    member: zKey(),
    participation: zParticipation(),
  }),
]);
export type JoinLeaderboardSchema = z.infer<typeof joinLeaderboardSchema>;

const userSchema = z.object({
  username: z.string().min(3),
  // if not included, displayName will default to the username
  displayName: z.string().min(3).optional(),
  // if not included, password will default to the username
  password: z.string().min(3).optional(),
  email: z.string().email(),
});
export type UserSchema = z.infer<typeof userSchema>;

export const accountSchema = z.object({
  user: userSchema,
  projects: z.record(zKey(), projectSchema),
  tallies: tallySchema.array(),
  targets: targetSchema.array(),
  habits: habitSchema.array(),
  leaderboards: z.record(zKey(), leaderboardSchema),
});
export type AccountSchema = z.infer<typeof accountSchema>;

export const seedSchema = z.object({
  accounts: z.record(zKey(), accountSchema),
  joinLeaderboards: joinLeaderboardSchema.array(),
});
export type SeedSchema = z.infer<typeof seedSchema>;
