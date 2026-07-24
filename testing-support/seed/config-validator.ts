import * as z from 'zod';
import { type NonEmptyArray } from 'server/lib/validators.ts';

import { PROJECT_PHASE } from 'server/lib/models/project/consts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts.ts';
import { GOAL_CADENCE_UNIT } from 'server/lib/models/goal/consts.ts';

import { USER_COLOR_NAMES } from 'src/components/chart/user-colors.ts';
import { TAG_COLORS, TAG_DEFAULT_COLOR } from 'server/lib/models/tag/consts';

const zTallyMeasure = () => z.enum(Object.values(TALLY_MEASURE));
const zMeasureCounts = () => z.partialRecord(zTallyMeasure(), z.number().int());

const zKey = () => z.string().regex(/^[a-z0-9_-]+$/);
const zDate = () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const zNullableDate = () => zDate().nullable();
const zProjectList = () => zKey().array();
const zTagList = () => zKey().array();
const zName = () => z.string().min(3).max(24);
const zColor = () => z.enum(['', ...USER_COLOR_NAMES]);

const userSchema = z.object({
  username: zName(),
  // if not included, displayName will default to the username
  displayName: zName().optional(),
  // if not included, password will default to the username
  password: zName().optional(),
  email: z.email(),
});
export type UserSchema = z.infer<typeof userSchema>;

const tagSchema = z.object({
  name: z.string().min(1),
  color: z.enum(TAG_COLORS).default(TAG_DEFAULT_COLOR),
});
export type TagSchema = z.infer<typeof tagSchema>;

const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  phase: z.enum(Object.values(PROJECT_PHASE) as NonEmptyArray<string>).default(PROJECT_PHASE.PLANNING),
  startingBalance: zMeasureCounts().default({}),
});
export type ProjectSchema = z.infer<typeof projectSchema>;

const literalTallySchema = z.object({
  project: zKey(),
  date: zDate(),
  count: z.number().int(),
  measure: zTallyMeasure(),
  note: z.string().default(''),
  tags: z.array(z.string()).default([]),
});
export type LiteralTallySchema = z.infer<typeof literalTallySchema>;

const generateTallySchema = z.object({
  project: zKey(),
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
  // use the key for the associated tag
  tags: z.array(z.string()).default([]),
});
export type GenerateTallySchema = z.infer<typeof generateTallySchema>;

export const TALLY_CONFIG_METHOD = {
  LIST: 'list',
  GENERATE: 'generate',
} as const;
const tallySchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal(TALLY_CONFIG_METHOD.LIST),
    tallies: literalTallySchema.array(),
  }),
  z.object({
    method: z.literal(TALLY_CONFIG_METHOD.GENERATE),
    config: generateTallySchema,
  }),
]);
export type TallySchema = z.infer<typeof tallySchema>;

const targetSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  start: zNullableDate().default(null),
  end: zNullableDate().default(null),
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
  start: zNullableDate().default(null),
  end: zNullableDate().default(null),
  unit: z.enum(Object.values(GOAL_CADENCE_UNIT) as NonEmptyArray<string>),
  period: z.number().int().gte(1),
  // measure and count must both be included or omitted
  measure: zTallyMeasure().optional(),
  count: z.number().int().optional(),
  // projects: [] indicates all projects
  projects: zProjectList().default([]),
  // tags: [] indicates all tags
  tags: zTagList().default([]),
});
export type HabitSchema = z.infer<typeof habitSchema>;

const teamSchema = z.object({
  name: z.string().min(1),
  color: zColor().default(''),
});
export type TeamSchema = z.infer<typeof teamSchema>;

// use null to just be a spectator
const zParticipation = () => z.object({
  team: zKey().nullable().default(null),
  // projects: [] indicates all projects
  projects: zProjectList().default([]),
  // tags: [] indicates all tags
  tags: zTagList().default([]),
  // required for individual goal mode
  measure: zTallyMeasure().optional(),
  // required for individual goal mode
  count: z.number().int().optional(),
  // you can specify a color if you want
  color: zColor().default(''),
}).nullable();

const memberSchema = z.object({
  // this key refers to an account
  user: zKey(),
  displayName: zName().nullable().default(null),
  // if the user is the creator of the leaderboard, this will be true no matter
  // what you set it to
  isOwner: z.boolean().default(false),
  participation: zParticipation(),
});
export type MemberSchema = z.infer<typeof memberSchema>;

const leaderboardSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  start: zNullableDate().default(null),
  end: zNullableDate().default(null),
  individualGoalMode: z.boolean().default(false),
  fundraiserMode: z.boolean().default(false),
  enableTeams: z.boolean().default(false),
  // measures is not used with individualGoalMode
  measures: z.array(zTallyMeasure()).optional(),
  // goal is not used with individualGoalMode
  goal: zMeasureCounts().default({}).optional(),
  teams: z.record(zKey(), teamSchema),
  members: memberSchema.array(),
}).superRefine((val, ctx) => {
  if(val.individualGoalMode && val.measures) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cannot use leaderboard measures with individualGoalMode',
      input: val,
    });
  }

  if(val.individualGoalMode && val.goal) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cannot use leaderboard goal with individualGoalMode',
      input: val,
    });
  }

  const teamKeys = Object.keys(val.teams);
  for(const member of val.members) {
    if(member.participation?.team && !teamKeys.includes(member.participation.team)) {
      ctx.addIssue({
        code: 'custom',
        message: `Unknown team ${member.participation?.team} listed in member ${member.user} participation`,
        input: member.participation,
      });
    }
  }
});
export type LeaderboardSchema = z.infer<typeof leaderboardSchema>;

export const accountSchema = z.object({
  user: userSchema,
  tags: z.record(zKey(), tagSchema).default({}),
  projects: z.record(zKey(), projectSchema).default({}),
  targets: z.record(zKey(), targetSchema).default({}),
  habits: z.record(zKey(), habitSchema).default({}),
  // leaderboards should be described under the account that is the original owner
  // other accounts can be referenced in the members key
  leaderboards: z.record(zKey(), leaderboardSchema).default({}),
  tallies: tallySchema.array().default([]),
}).superRefine((account, ctx) => {
  const projectKeys = Object.keys(account.projects);
  const addUnknownProjectKeyError = function(path: (string | number)[], received: string | number) {
    ctx.issues.push({
      code: 'invalid_value',
      values: projectKeys,
      input: received,
      path,
      message: `Unknown project key.`,
    });
  };

  const tagKeys = Object.keys(account.tags);
  const addUnknownTagKeyError = function(path: (string | number)[], received: string | number) {
    ctx.addIssue({
      code: 'invalid_value',
      values: tagKeys,
      path,
      input: received,
      message: `Unknown tag key.`,
    });
  };

  // ensure projects and tags in tallies and tally configs refer to existing project and tag keys
  for(const [tallyConfigIx, tallyConfig] of Object.entries(account.tallies)) {
    if(tallyConfig.method === TALLY_CONFIG_METHOD.LIST) {
      for(const [tallyIx, tally] of Object.entries(tallyConfig.tallies)) {
        if(!projectKeys.includes(tally.project)) {
          addUnknownProjectKeyError(['tallies', tallyConfigIx, 'tallies', tallyIx], tally.project);
        }

        for(const tag of tally.tags) {
          if(!tagKeys.includes(tag)) {
            addUnknownTagKeyError(['tallies', tallyConfigIx, 'tallies', tallyIx], tally.project);
          }
        }
      }
    }

    if(tallyConfig.method === TALLY_CONFIG_METHOD.GENERATE) {
      if(!projectKeys.includes(tallyConfig.config.project)) {
        addUnknownProjectKeyError(['tallies', tallyConfigIx, 'config', 'project'], tallyConfig.config.project);
      }

      for(const tag of tallyConfig.config.tags) {
        if(!tagKeys.includes(tag)) {
          addUnknownTagKeyError(['tallies', tallyConfigIx, 'config', 'tags'], tag);
        }
      }
    }
  }

  // ensure projects and tags in targets refer to existing project and tag keys
  for(const [key, targetConfig] of Object.entries(account.targets)) {
    for(const [ix, projectKey] of Object.entries(targetConfig.projects)) {
      if(!projectKeys.includes(projectKey)) {
        addUnknownProjectKeyError(['targets', key, 'projects', ix], projectKey);
      }
    }

    for(const [ix, tagKey] of Object.entries(targetConfig.tags)) {
      if(!tagKeys.includes(tagKey)) {
        addUnknownTagKeyError(['targets', key, 'tags', ix], tagKey);
      }
    }
  }

  // ensure projects and tags in habits refer to existing project and tag keys
  for(const [key, habitConfig] of Object.entries(account.habits)) {
    for(const [ix, projectKey] of Object.entries(habitConfig.projects)) {
      if(!projectKeys.includes(projectKey)) {
        addUnknownProjectKeyError(['habits', key, 'projects', ix], projectKey);
      }
    }

    for(const [ix, tagKey] of Object.entries(habitConfig.tags)) {
      if(!tagKeys.includes(tagKey)) {
        addUnknownTagKeyError(['habits', key, 'tags', ix], tagKey);
      }
    }
  }

  // ensure projects and tags in leaderboards refer to existing project and tag keys
  const allParticipations = Object.values(account.leaderboards).map(l => l.members).flat().map(member => member.participation);
  for(const participation of allParticipations) {
    if(participation === null) {
      continue;
    }

    for(const [ix, projectKey] of Object.entries(participation.projects)) {
      if(!projectKeys.includes(projectKey)) {
        addUnknownProjectKeyError(['leaderboards', 'members', 'projects', ix], projectKey);
      }
    }

    for(const [ix, tagKey] of Object.entries(participation.tags)) {
      if(!tagKeys.includes(tagKey)) {
        addUnknownTagKeyError(['leaderboards', 'members', 'tags', ix], tagKey);
      }
    }
  }
});
export type AccountSchema = z.infer<typeof accountSchema>;

export const seedSchema = z.object({
  accounts: z.record(zKey(), accountSchema),
}).superRefine((val, ctx) => {
  // ensure that users in leaderboard members refer to existing account keys
  const accountKeys = Object.keys(val.accounts);
  for(const leaderboard of Object.values(val.accounts).map(acct => Object.values(acct.leaderboards)).flat()) {
    for(const user of leaderboard.members.map(m => m.user)) {
      if(!accountKeys.includes(user)) {
        ctx.addIssue({
          code: 'invalid_value',
          message: `Unknown account key ${user} found in leaderboard`,
          values: accountKeys,
          input: user,
        });
      }
    }
  }
});
export type SeedSchema = z.infer<typeof seedSchema>;
