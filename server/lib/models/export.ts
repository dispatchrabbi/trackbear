import { type Writable } from 'node:stream';
import { promisify } from 'node:util';
import { formatISO } from 'date-fns';
import slugify from '@sindresorhus/slugify';
import { stringify as _stringify } from 'csv-stringify';
import yazl from 'yazl';

import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import { UserModel, type UserSettings, type User } from './user/user-model.ts';
import { TagModel, type Tag } from './tag/tag-model.ts';
import { TallyModel, type Tally } from './tally/tally-model.wip.ts';
import { ProjectModel, type Project } from './project/project-model.ts';
import { GoalModel, type TargetGoal, type HabitGoal } from './goal/goal-model.ts';
import { GOAL_TYPE } from './goal/consts.ts';

import { type RequestContext } from '../request-context.ts';
import { logAuditEvent } from '../audit-events.ts';
import { AUDIT_EVENT_TYPE } from './audit-event/consts.ts';
import { createChartSeries, createParSeries, determineChartIntervals } from 'src/components/chart/chart-functions.ts';
import { type HabitRange, populateHabitRanges } from './goal/helpers.ts';

export async function exportUserDataZip(user: User, destination: Writable, reqCtx: RequestContext) {
  logger.debug('exportUserDataZip: getting tallies...');
  const tallies = await TallyModel.getTallies(user);

  logger.debug('exportUserDataZip: getting projects...');
  const projects = await ProjectModel.getProjects(user);
  const projectsMap = mapById(projects);

  logger.debug('exportUserDataZip: getting tags...');
  const tags = await TagModel.getTags(user);
  const tagsMap = mapById(tags);

  logger.debug('exportUserDataZip: getting goals...');
  const goals = await GoalModel.getGoals(user);
  const targets = goals.filter(goal => goal.type === GOAL_TYPE.TARGET) as TargetGoal[];
  const habits = goals.filter(goal => goal.type === GOAL_TYPE.HABIT) as HabitGoal[];

  logger.debug('exportUserDataZip: getting settings...');
  const settings = await UserModel.getUserSettings(user);

  /**
   * The zip export should include:
   * - A CSV file with all the user's tallies
   * - One CSV file per project, listing the tallies for that project
   * - One CSV file per target, listing the daily progress for the target
   * - One CSV file per habit, listing the accomplishments for each habit
   * - A JSON file that includes all the tallies, projects, tags, targets, and habits
   */
  const filesToZip = await Promise.all([
    makeEverythingJson(tallies, projects, targets, habits, tags),
    makeTalliesCsv(tallies, projectsMap, tagsMap),
    ...projects.map(project => makeProjectCsv(project, tallies, projectsMap, tagsMap)),
    ...targets.map(target => makeTargetCsv(target, tallies)),
    ...habits.map(habit => makeHabitCsv(habit, tallies, projectsMap, tagsMap, settings!)),
  ]);

  const { promise, resolve, reject } = Promise.withResolvers();

  const zipfile = new yazl.ZipFile();
  zipfile.outputStream
    .pipe(destination)
    .on('close', async () => {
      logger.debug(`exportUserDataZip: done zipping!`);
      await logAuditEvent(AUDIT_EVENT_TYPE.EXPORT_REQUEST, reqCtx.userId, user.id, null, null, reqCtx.sessionId);
      resolve(void 0);
    })
    .on('error', err => {
      logger.error(`exportUserDataZip: error zipping export: ${err.message}`, err);
      reject(err);
    });

  for(const [filepath, contents] of filesToZip) {
    logger.debug(`adding ${filepath} to the zip file...`);
    zipfile.addBuffer(Buffer.from(contents, 'utf-8'), filepath);
  }

  zipfile.end();

  return promise;
}

async function makeTalliesCsv(tallies: Tally[], projectsMap: Map<number, Project>, tagsMap: Map<number, Tag>): Promise<[string, string]> {
  const csvContents = await collateCsvRowsFromTallies(tallies, projectsMap, tagsMap);

  const filename = 'tallies/all-tallies.csv';
  return [filename, csvContents];
};

async function makeProjectCsv(project: Project, tallies: Tally[], projectsMap: Map<number, Project>, tagsMap: Map<number, Tag>): Promise<[string, string]> {
  const projectTallies = tallies.filter(tally => tally.workId === project.id);
  const csvContents = await collateCsvRowsFromTallies(projectTallies, projectsMap, tagsMap);

  const filename = `projects/${slugify(project.title)}_${project.id}.csv`;
  return [filename, csvContents];
}

async function makeTargetCsv(target: TargetGoal, tallies: Tally[]): Promise<[string, string]> {
  const targetTallies = tallies.filter(tally => (
    (target.parameters.threshold.measure === tally.measure) &&
    (target.startDate === null || tally.date >= target.startDate) &&
    (target.endDate === null || tally.date <= target.endDate) &&
    (target.workIds.length === 0 || target.workIds.includes(tally.workId!)) &&
    (target.tagIds.length === 0 || tally.tagIds.some(tagId => target.tagIds.includes(tagId)))
  ));

  const intervals = determineChartIntervals(targetTallies, target.startDate, target.endDate);

  const progress = createChartSeries(targetTallies, {
    series: 'progress',
    startDate: intervals.startDate,
    endDate: intervals.endDate,
    accumulate: false,
    densify: false,
    extend: false,
  });
  const par = createParSeries(target.parameters.threshold.count, {
    series: 'par',
    startDate: intervals.startDate,
    endDate: intervals.endDate,
    accumulate: false,
  });

  const csvContents = await makeCSV([...progress, ...par], ['date', 'series', 'value']);

  const filename = `targets/${slugify(target.title)}_${target.id}.csv`;
  return [filename, csvContents];
}

async function makeHabitCsv(habit: HabitGoal, tallies: Tally[], projectsMap: Map<number, Project>, tagsMap: Map<number, Tag>, settings: UserSettings): Promise<[string, string]> {
  const habitTallies = tallies.filter(tally => (
    (habit.startDate === null || tally.date >= habit.startDate) &&
    (habit.endDate === null || tally.date <= habit.endDate) &&
    ((!habit.parameters.threshold?.measure) || habit.parameters.threshold.measure === tally.measure) &&
    (habit.workIds.length === 0 || habit.workIds.includes(tally.workId!)) &&
    (habit.tagIds.length === 0 || tally.tagIds.some(tagId => habit.tagIds.includes(tagId)))
  ));
  const habitRanges = populateHabitRanges(
    habitTallies,
    habit.parameters.cadence,
    habit.parameters.threshold,
    habit.startDate, habit.endDate, settings.weekStartDay,
  );

  const columns: Record<string, (obj: HabitRange) => CsvValue> = {
    start_date: r => r.startDate,
    end_date: r => r.endDate,
    total: r => r.total,
    is_success: r => r.isSuccess,
  };
  const csvRows = collateCsvRows(columns, habitRanges);
  const csvContents = await makeCSV(csvRows, Object.keys(columns));

  const filename = `habits/${slugify(habit.title)}_${habit.id}.csv`;
  return [filename, csvContents];
}

async function makeEverythingJson(tallies: Tally[], projects: Project[], targets: TargetGoal[], habits: HabitGoal[], tags: Tag[]): Promise<[string, string]> {
  const jsonContents = JSON.stringify({
    tallies,
    projects,
    targets,
    habits,
    tags,
  });

  const filename = 'trackbear-progress-data.json';
  return [filename, jsonContents];
}

function mapById<T extends { id: number }>(objs: T[]): Map<number, T> {
  const map = new Map<number, T>();
  for(const obj of objs) {
    map.set(obj.id, obj);
  }
  return map;
}

type CsvValue = string | number | boolean | null;
function collateCsvRows<O extends object>(
  columns: Record<string, (obj: O) => CsvValue>,
  objs: O[],
): Record<string, CsvValue>[] {
  const columnEntries = Object.entries(columns);
  const rows: Record<string, CsvValue>[] = [];

  for(const obj of objs) {
    const row: Record<string, CsvValue> = {};
    for(const [key, transformFn] of columnEntries) {
      row[key] = transformFn(obj);
    }

    rows.push(row);
  }

  return rows;
}

async function collateCsvRowsFromTallies(tallies: Tally[], projectsMap: Map<number, Project>, tagsMap: Map<number, Tag>): Promise<string> {
  const columns: Record<string, (obj: Tally) => CsvValue> = {
    id: (t: Tally) => t.id,
    uuid: (t: Tally) => t.uuid,
    project_id: (t: Tally) => t.workId!,
    project_title: (t: Tally) => projectsMap.get(t.workId!)!.title,
    date: (t: Tally) => t.date,
    measure: (t: Tally) => t.measure,
    count: (t: Tally) => t.count,
    note: (t: Tally) => t.note,
    tag_ids: (t: Tally) => t.tagIds.join(';'),
    tag_names: (t: Tally) => t.tagIds.map(tagId => tagsMap.get(tagId)!.name).join(';'),
    created_at: (t: Tally) => formatISO(t.createdAt),
    updated_at: (t: Tally) => formatISO(t.updatedAt),
  };

  const csvData = collateCsvRows(columns, tallies);
  const csvContents = await makeCSV(csvData, Object.keys(columns));
  return csvContents;
};

type StringifyParams = Parameters<typeof _stringify>;
const stringify = promisify<StringifyParams[0], StringifyParams[1], string>(_stringify);
async function makeCSV(data: object[], columns: string[]) {
  const csvContents = await stringify(data, {
    columns,
    header: true,
    cast: {
      boolean: val => val ? 'true' : 'false',
      date: val => val.toISOString(),
    },
  });

  return csvContents;
}
