import {
  type SeedSchema,
  type AccountSchema,
  type UserSchema,
  type ProjectSchema,
  type TargetSchema,
  type HabitSchema,
  type LeaderboardSchema,
  type TallySchema,
  type JoinLeaderboardSchema,
  seedSchema,
} from './config-validator';

import { UserModel, type User } from 'server/lib/models/user/user-model.ts';
import { ProjectModel, type Project } from 'server/lib/models/project/project-model';
import { type TargetGoal, type HabitGoal, GoalModel, TargetGoalParameters, HabitGoalParameters } from 'server/lib/models/goal/goal-model.ts';
import type { Leaderboard, LeaderboardMember } from 'server/lib/models/leaderboard/types.ts';
import { TallyData, TallyModel, type Tally } from 'server/lib/models/tally/tally-model.wip.ts';
import { type RequestContext } from 'server/lib/request-context';
import { GOAL_TYPE } from 'server/lib/models/goal/consts';
import { LeaderboardModel } from 'server/lib/models/leaderboard/leaderboard-model';
import { LeaderboardMemberModel } from 'server/lib/models/leaderboard/leaderboard-member-model';
import { eachDayOfInterval } from 'date-fns';
import { formatDate, parseDateString } from 'src/lib/date';

type ProjectMap = Record<string, Project>;
type LeaderboardMap = Record<string, Leaderboard>;

type AccountResult = {
  user: User;
  projects: ProjectMap;
  targets: TargetGoal[];
  habits: HabitGoal[];
  leaderboards: LeaderboardMap;
  memberships: LeaderboardMember[];
  tallies: Tally[];
};

type AccountMap = Record<string, AccountResult>;

export async function createSeed(seedConfig: SeedSchema, reqCtx: RequestContext): Promise<AccountResult[]> {
  const validatedConfig = seedSchema.parse(seedConfig);

  const accountEntries = await Promise.all(Object.entries(validatedConfig.accounts).map(async ([key, config]) => {
    const result = await createAccount(config, reqCtx);
    return [key, result];
  }));
  const accountMap = Object.fromEntries(accountEntries);

  await joinLeaderboards(validatedConfig.joinLeaderboards, accountMap, reqCtx);

  return Object.values(accountMap);
}

async function createAccount(accountConfig: AccountSchema, reqCtx: RequestContext): Promise<AccountResult> {
  const user = await createUser(accountConfig.user, reqCtx);
  const projectMap = await createProjects(user, accountConfig.projects, reqCtx);
  const targets = await createTargets(user, accountConfig.targets, projectMap, reqCtx);
  const habits = await createHabits(user, accountConfig.habits, projectMap, reqCtx);
  const leaderboardMap = await createLeaderboards(user, accountConfig.leaderboards, reqCtx);
  const memberships = []; // we fill this in later
  const tallies = await createTallies(user, accountConfig.tallies, projectMap, reqCtx);

  return {
    user,
    projects: projectMap,
    targets,
    habits,
    leaderboards: leaderboardMap,
    memberships,
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

async function createProjects(user: User, projectConfigMap: Record<string, ProjectSchema>, reqCtx: RequestContext): Promise<ProjectMap> {
  const resultEntries = await Promise.all(Object.entries(projectConfigMap).map(async ([key, config]) => {
    const created = await ProjectModel.createProject(user, {
      title: config.title,
      description: config.description,
      phase: config.phase,
      cover: null,
      startingBalance: config.startingBalance,
      starred: false,
      displayOnProfile: false,
    }, reqCtx);

    return [key, created];
  }));

  return Object.fromEntries(resultEntries);
}

async function createTallies(user: User, tallyConfigs: TallySchema[], projectMap: ProjectMap, reqCtx: RequestContext): Promise<Tally[]> {
  const allTallies: TallyData[] = tallyConfigs.flatMap(config => {
    if(!projectMap[config.project]) {
      console.warn(`Unknown project key ${config.project} passed in tally config`);
      return [];
    }

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
          workId: projectMap[config.project].id,
          tags: [],
        };

        tallies.push(tally);
      } while(Math.random() < config.repeat);
    }

    return tallies;
  });

  const createds = await TallyModel.batchCreateTallies(user, allTallies, reqCtx);
  return createds;
}

async function createTargets(user: User, targetConfigs: TargetSchema[], projectMap: ProjectMap, reqCtx: RequestContext): Promise<TargetGoal[]> {
  const createds = await Promise.all(targetConfigs.map(async config => {
    const created = await GoalModel.createGoal(user, {
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
      workIds: projectKeysToIds(config.projects, projectMap),
      tagIds: tagKeysToIds(config.tags),
      starred: false,
      displayOnProfile: false,
    }, reqCtx);

    return created as TargetGoal;
  }));

  return createds;
}

async function createHabits(user: User, habitConfigs: HabitSchema[], projectMap: ProjectMap, reqCtx: RequestContext): Promise<HabitGoal[]> {
  const createds = await Promise.all(habitConfigs.map(async config => {
    const created = await GoalModel.createGoal(user, {
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
      workIds: projectKeysToIds(config.projects, projectMap),
      tagIds: tagKeysToIds(config.tags),
      starred: false,
      displayOnProfile: false,
    }, reqCtx);

    return created as HabitGoal;
  }));

  return createds;
}

async function createLeaderboards(user: User, leaderboardConfigMap: Record<string, LeaderboardSchema>, reqCtx: RequestContext): Promise<LeaderboardMap> {
  const resultEntries = await Promise.all(Object.entries(leaderboardConfigMap).map(async ([key, config]) => {
    if(config.individualGoalMode) {
      config.goal = {};
      config.measures = [];
      config.fundraiserMode = false;
    }

    const created = await LeaderboardModel.create({
      title: config.title,
      description: config.description,
      startDate: config.start,
      endDate: config.end,
      individualGoalMode: config.individualGoalMode!,
      fundraiserMode: config.fundraiserMode!,
      enableTeams: config.enableTeams!,
      goal: config.goal!,
      measures: config.measures!,
      isJoinable: true,
      isPublic: false,
    }, user.id, reqCtx);

    return [key, created];
  }));

  return Object.fromEntries(resultEntries);
}

async function joinLeaderboards(joinConfigs: JoinLeaderboardSchema[], accountMap: AccountMap, reqCtx: RequestContext): Promise<LeaderboardMember[]> {
  const joined = await Promise.all(joinConfigs.map(async config => {
    const leaderboard = await lookUpLeaderboard(config, accountMap);
    if(!leaderboard) {
      return null;
    }

    const account = accountMap[config.member] ?? null;
    if(!account) {
      return null;
    }

    const user = account.user;
    const projectMap = account.projects;

    const membershipData = config.participation ?
        {
          isParticipant: true,
          isOwner: leaderboard.ownerId === user.id,
          starred: false,
          displayName: config.displayName || user.displayName,
          color: config.participation.color ?? '',
          goal: leaderboard.individualGoalMode ?
              {
                count: config.participation.count!,
                measure: config.participation.measure!,
              } :
            null,
          workIds: projectKeysToIds(config.participation.projects, projectMap),
          tagIds: tagKeysToIds(config.participation.tags),
        } :
        {
          isParticipant: false,
          isOwner: leaderboard.ownerId === user.id,
          starred: false,
          displayName: config.displayName || user.displayName,
          color: '',
          goal: null,
          workIds: [],
          tagIds: [],
        };

    const member = await LeaderboardMemberModel.getByUserId(leaderboard, user.id);
    if(member) {
      return await LeaderboardMemberModel.update(member, membershipData, reqCtx);
    } else {
      return await LeaderboardMemberModel.create(leaderboard, user, membershipData, reqCtx);
    }
  }));

  const accounts = Object.values(accountMap);
  for(const member of joined) {
    // filter out the nulls
    if(!member) {
      continue;
    }

    const account = accounts.find(acc => acc.user.id === member.userId);
    if(!account) {
      continue;
    }

    account.memberships.push(member);
  }

  const filtered = joined.filter(x => x !== null);
  return filtered;
}

function projectKeysToIds(keys: string[], projectMap: ProjectMap) {
  return keys
    .map(key => projectMap[key]?.id)
    // filter out any unknown projects
    .filter(x => x);
}

// TODO: implement tags
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function tagKeysToIds(keys: string[]) {
  return [];
}

async function lookUpLeaderboard(joinConfig: JoinLeaderboardSchema, accountMap: AccountMap) {
  if('key' in joinConfig) {
    return accountMap[joinConfig.owner]?.leaderboards[joinConfig.key] ?? null;
  }

  if('uuid' in joinConfig) {
    return await LeaderboardModel.getByUuid(joinConfig.uuid) ?? null;
  }

  return null;
}

function intervalRand(min: number, max: number) {
  const spread = (max - min) + 1; // inclusive range
  return Math.floor(Math.random() * spread) + min;
}
