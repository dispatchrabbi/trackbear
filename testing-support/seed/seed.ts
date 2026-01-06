import {
  type SeedSchema,
  type AccountSchema,
  type UserSchema,
  type ProjectSchema,
  type TargetSchema,
  type HabitSchema,
  type LeaderboardSchema,
  type TallySchema,
  type LiteralTallySchema,
  type GenerateTallySchema,
  TALLY_CONFIG_METHOD,
  seedSchema,
} from './config-validator';

import { UserModel, type User } from 'server/lib/models/user/user-model.ts';
import { type Tag } from 'server/lib/models/tag/tag-model.ts';
import { ProjectModel, type Project } from 'server/lib/models/project/project-model';
import { type TargetGoal, type HabitGoal, GoalModel, type TargetGoalParameters, type HabitGoalParameters } from 'server/lib/models/goal/goal-model.ts';
import type { Leaderboard, LeaderboardMember } from 'server/lib/models/leaderboard/types.ts';
import { type TallyData, TallyModel } from 'server/lib/models/tally/tally-model.wip.ts';
import { type RequestContext } from 'server/lib/request-context';
import { GOAL_TYPE } from 'server/lib/models/goal/consts';
import { LeaderboardModel } from 'server/lib/models/leaderboard/leaderboard-model';
import { LeaderboardMemberModel } from 'server/lib/models/leaderboard/leaderboard-member-model';
import { eachDayOfInterval } from 'date-fns';
import { formatDate, parseDateString } from 'src/lib/date';
import { LeaderboardTeamModel } from 'server/lib/models/leaderboard/leaderboard-team-model';
import { type PlainTally, type MeasureCounts } from 'server/lib/models/tally/types';

type Mapping<T> = Record<string, T>;

type AccountResult = {
  user: User;
  tags: Mapping<Tag>;
  projects: Mapping<Project>;
  targets: Mapping<TargetGoal>;
  habits: Mapping<HabitGoal>;
  leaderboards: Mapping<Leaderboard>;
  memberships: Mapping<LeaderboardMember>;
  tallies: PlainTally[]; // TODO: include tags in this
};

export function validateSeed(seedJson: unknown): SeedSchema {
  return seedSchema.parse(seedJson) satisfies SeedSchema;
}

export async function createSeed(seedConfig: SeedSchema, reqCtx: RequestContext): Promise<Mapping<AccountResult>> {
  const validatedConfig = validateSeed(seedConfig);

  const baseAcctMap = await mapTransform(validatedConfig.accounts, async config => await createBaseAccount(config, reqCtx));

  const acctMap = await mapTransform(validatedConfig.accounts, async (accountConfig, accountKey) => {
    const currentAccount = baseAcctMap[accountKey];
    const leaderboards = await createLeaderboards(currentAccount.user, accountConfig.leaderboards, baseAcctMap, reqCtx);

    for(const [leaderboardKey, result] of Object.entries(leaderboards)) {
      currentAccount.leaderboards[leaderboardKey] = result.leaderboard;

      for(const [memberAcctKey, member] of Object.entries(result.members)) {
        baseAcctMap[memberAcctKey].memberships[leaderboardKey] = member;
      }
    }

    return currentAccount;
  });

  return acctMap;
}

async function createBaseAccount(accountConfig: AccountSchema, reqCtx: RequestContext): Promise<AccountResult> {
  const user = await createUser(accountConfig.user, reqCtx);
  const tags = {};
  const projects = await createProjects(user, accountConfig.projects, reqCtx);
  const targets = await createTargets(user, accountConfig.targets, projects, tags, reqCtx);
  const habits = await createHabits(user, accountConfig.habits, projects, tags, reqCtx);
  const tallies = await createTallies(user, accountConfig.tallies, projects, tags, reqCtx);

  return {
    user,
    tags,
    projects,
    targets,
    habits,
    leaderboards: {},
    memberships: {},
    tallies,
  };
}

async function createUser(userConfig: UserSchema, reqCtx: RequestContext): Promise<User> {
  if(!userConfig.displayName) {
    userConfig.displayName = userConfig.username;
  }

  if(!userConfig.password) {
    userConfig.password = userConfig.username;
  }
  const created = await UserModel.createUser({
    username: userConfig.username,
    password: userConfig.password,
    email: userConfig.email,
    displayName: userConfig.displayName,
    isEmailVerified: true,
  }, reqCtx);

  return created;
}

async function createProjects(user: User, projectConfigs: Mapping<ProjectSchema>, reqCtx: RequestContext): Promise<Mapping<Project>> {
  return await mapTransform(projectConfigs, async config => await ProjectModel.createProject(user, {
    title: config.title,
    description: config.description,
    phase: config.phase,
    cover: null,
    startingBalance: config.startingBalance as MeasureCounts,
    starred: false,
    displayOnProfile: false,
  }, reqCtx));
}

async function createTallies(user: User, tallyConfigs: TallySchema[], projects: Mapping<Project>, tags: Mapping<Tag>, reqCtx: RequestContext): Promise<PlainTally[]> {
  const allTallies: TallyData[] = tallyConfigs.flatMap(config => {
    if(config.method === TALLY_CONFIG_METHOD.LIST) {
      return transformLiteralTallies(config.tallies, projects, tags);
    } else if(config.method === TALLY_CONFIG_METHOD.GENERATE) {
      return generateTallyData(config.config, projects, tags);
    }

    return [];
  });

  const createds = await TallyModel.batchCreateTallies(user, allTallies, reqCtx);
  return createds;
}

function transformLiteralTallies(tallies: LiteralTallySchema[], projects: Mapping<Project>, tags: Mapping<Tag>): TallyData[] {
  return tallies.map(tally => ({
    date: tally.date,
    measure: tally.measure,
    count: tally.count,
    note: tally.note,
    workId: projects[tally.project].id,
    tags: tagKeysToNames(tally.tags, tags),
  }));
}

function generateTallyData(config: GenerateTallySchema, projects: Mapping<Project>, tags: Mapping<Tag>): TallyData[] {
  const dates = eachDayOfInterval({
    start: parseDateString(config.start),
    end: parseDateString(config.end),
  }).map(d => formatDate(d));

  const tallies: TallyData[] = [];
  for(const date of dates) {
    // will we record anything today?
    if(Math.random() > config.frequency) {
      continue;
    }

    // make at least one tally, then perhaps repeat
    do {
      const tally: TallyData = {
        date,
        measure: config.measure,
        count: intervalRand(config.min, config.max),
        note: '',
        workId: projects[config.project].id,
        tags: tagKeysToNames(config.tags, tags),
      };

      tallies.push(tally);
    } while(Math.random() < config.repeat);
  }

  return tallies;
}

async function createTargets(user: User, targetConfigs: Mapping<TargetSchema>, projects: Mapping<Project>, tags: Mapping<Tag>, reqCtx: RequestContext): Promise<Mapping<TargetGoal>> {
  return await mapTransform(targetConfigs, async config => await GoalModel.createGoal(user, {
    title: config.title,
    description: config.description,
    type: GOAL_TYPE.TARGET,
    parameters: {
      threshold: {
        measure: config.measure,
        count: config.count,
      },
    } as TargetGoalParameters,
    startDate: config.start,
    endDate: config.end,
    workIds: projectKeysToIds(config.projects, projects),
    tagIds: tagKeysToIds(config.tags, tags),
    starred: false,
    displayOnProfile: false,
  }, reqCtx) as TargetGoal);
}

async function createHabits(user: User, habitConfigs: Mapping<HabitSchema>, projects: Mapping<Project>, tags: Mapping<Tag>, reqCtx: RequestContext): Promise<Mapping<HabitGoal>> {
  return await mapTransform(habitConfigs, async config => await GoalModel.createGoal(user, {
    title: config.title,
    description: config.description,
    type: GOAL_TYPE.HABIT,
    parameters: {
      cadence: {
        unit: config.unit,
        period: config.period,
      },
      threshold: (config.measure && config.count) ? { measure: config.measure, count: config.count } : null,
    } as HabitGoalParameters,
    startDate: config.start,
    endDate: config.end,
    workIds: projectKeysToIds(config.projects, projects),
    tagIds: tagKeysToIds(config.tags, tags),
    starred: false,
    displayOnProfile: false,
  }, reqCtx) as HabitGoal);
}

type LeaderboardAndMembersMapping = Mapping<{
  leaderboard: Leaderboard;
  members: Mapping<LeaderboardMember>;
}>;
async function createLeaderboards(user: User, leaderboardConfigs: Mapping<LeaderboardSchema>, accounts: Mapping<AccountResult>, reqCtx: RequestContext): Promise<LeaderboardAndMembersMapping> {
  return await mapTransform(leaderboardConfigs, async lbConfig => {
    if(lbConfig.individualGoalMode) {
      lbConfig.goal = {};
      lbConfig.measures = [];
      lbConfig.fundraiserMode = false;
    }

    const leaderboard = await LeaderboardModel.create({
      title: lbConfig.title,
      description: lbConfig.description,
      startDate: lbConfig.start,
      endDate: lbConfig.end,
      individualGoalMode: lbConfig.individualGoalMode,
      fundraiserMode: lbConfig.fundraiserMode,
      enableTeams: lbConfig.enableTeams,
      goal: lbConfig.goal! as MeasureCounts,
      measures: lbConfig.measures!,
      isJoinable: true,
      isPublic: false,
    }, user.id, reqCtx);

    const teams = await mapTransform(lbConfig.teams, async teamConfig => await LeaderboardTeamModel.create(leaderboard, {
      name: teamConfig.name,
      color: teamConfig.color,
    }, reqCtx));

    const memberMapping = Object.fromEntries(lbConfig.members.map(member => ([member.user, member])));
    const members = await mapTransform(memberMapping, async memberConfig => {
      const memberAccount = accounts[memberConfig.user];
      const data = {
        displayName: memberConfig.displayName ?? undefined,
        isOwner: memberConfig.isOwner,
        isParticipant: memberConfig.participation !== null,
        color: memberConfig.participation?.color,
        goal: (memberConfig.participation?.measure && memberConfig.participation?.count) ?
            {
              measure: memberConfig.participation.measure,
              count: memberConfig.participation.count,
            } :
          null,
        teamId: memberConfig.participation?.team ? teams[memberConfig.participation.team].id : null,
        workIds: projectKeysToIds(memberConfig.participation?.projects ?? [], memberAccount.projects),
        tagIds: tagKeysToIds(memberConfig.participation?.tags ?? [], memberAccount.tags),
      };

      if(leaderboard.ownerId === memberAccount.user.id) {
        const existingMember = await LeaderboardMemberModel.getByUserId(leaderboard, memberAccount.user.id);
        return await LeaderboardMemberModel.update(existingMember!, data, reqCtx);
      } else {
        return await LeaderboardMemberModel.create(leaderboard, memberAccount.user, data, reqCtx);
      }
    });

    return {
      leaderboard,
      members,
    };
  });
}

async function mapTransform<T, R>(mapping: Mapping<T>, fn: (val: T, key: string) => Promise<R>): Promise<Mapping<R>> {
  const resultEntries = await Promise.all(Object.entries(mapping).map(async function([key, val]) {
    const result = await fn(val, key);
    return [key, result];
  }));

  return Object.fromEntries(resultEntries);
}

function projectKeysToIds(keys: string[], projects: Mapping<Project>) {
  return keys.map(key => projects[key].id);
}

// TODO: implement tags
function tagKeysToIds(keys: string[], tags: Mapping<Tag>) {
  return keys.map(key => tags[key].id);
}

function tagKeysToNames(keys: string[], tags: Mapping<Tag>) {
  return keys.map(key => tags[key].name);
}

function intervalRand(min: number, max: number) {
  const spread = (max - min) + 1; // inclusive range
  return Math.floor(Math.random() * spread) + min;
}
