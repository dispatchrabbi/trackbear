#!/usr/bin/env -S node --import ./ts-node-loader.js

import dotenv from 'dotenv';
import { getNormalizedEnv } from '../server/lib/env.ts';

import winston from 'winston';
import { initLoggers } from '../server/lib/logger.ts';

import dbClient from '../server/lib/db.ts';
import type { User, Project, Update, Work, Goal } from '@prisma/client';
import { PROJECT_STATE, PROJECT_TYPE } from '../server/lib/states.ts';
import { WORK_STATE, WORK_PHASE } from '../server/lib/entities/work.ts';
import { TALLY_STATE, TALLY_MEASURE } from '../server/lib/entities/tally.ts';
import { GOAL_STATE, GOAL_TYPE, GoalParameters } from '../server/lib/entities/goal.ts';

const MEASURE_CONVERSION = {
  [PROJECT_TYPE.WORDS]: TALLY_MEASURE.WORD,
  [PROJECT_TYPE.TIME]: TALLY_MEASURE.TIME,
  [PROJECT_TYPE.PAGES]: TALLY_MEASURE.PAGE,
  [PROJECT_TYPE.CHAPTERS]: TALLY_MEASURE.CHAPTER,
};

type ResultsEntry = {
  userId: number;
  username: string;
  error: boolean;

  projects: {
    projectId: number;
    title: string;
    goal: boolean;

    workId: number | null;
    goalId: number | null;

    error: boolean;
  }[];
};

async function main() {
  process.env.NODE_ENV = 'development';
  dotenv.config();
  await getNormalizedEnv();

  await initLoggers({ forceConsoles: true });
  const scriptLogger = winston.child({ service: 'transition-to-tag-and-tally.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  // okay, first, we need to grab every user (including the suspended and deleted ones)
  let users: User[] = [];
  try {
    scriptLogger.info(`Fetching all users...`);
    // TODO: remove the where clause here
    users = await dbClient.user.findMany({
      where: { username: { notIn: [ 'beartest2' ] } }
    });
  } catch(err) {
    scriptLogger.error(`Error fetching users: ${err.message}`);
  }

  const resultsLog: ResultsEntry[] = [];

  // then, for each user, we'll pull up their projects
  for(const user of users) {
    scriptLogger.info(`Transitioning user ${user.id} (${user.username})...`);

    const resultsEntry: ResultsEntry = {
      userId: user.id,
      username: user.username,
      error: true,

      projects: [],
    };
    resultsLog.push(resultsEntry);

    let projects: Project[] = [];
    try {
      scriptLogger.info(`Fetching projects for user ${user.id}...`);
      projects = await dbClient.project.findMany({
        where: {
          ownerId: user.id,
          transitionedId: null,
        },
      });

      resultsEntry.error = false;
      resultsEntry.projects = projects.map(p => ({
        projectId: p.id,
        title: p.title,
        goal: p.goal !== null,

        workId: null,
        goalId: null,

        error: true,
      }));
    } catch(err) {
      scriptLogger.error(`Error fetching projects for user ${user.id}: ${err.message}`);
      resultsEntry.error = true;

      continue;
    }

    for(const project of projects) {
      const projectEntry = resultsEntry.projects.find(p => p.projectId === project.id);
      if(!projectEntry) {
        scriptLogger.error(`How did we get here?`, { projectId: project.id, resultsEntry });
        continue;
       }

      // transition each project within a transaction
      try {
        await dbClient.$transaction(async function(tx) {
          // for each project, convert it to a work, and record the id of work it converted into
          const work: Work = await tx.work.create({
            data: {
              state: project.state === PROJECT_STATE.DELETED ? WORK_STATE.DELETED : WORK_STATE.ACTIVE,
              ownerId: user.id,
              title: project.title,
              description: '',
              phase: WORK_PHASE.DRAFTING,
            },
          });

          // get the updates for this project and bulk-convert them to tallies, adding info from the associated project
          const updates: Update[] = await tx.update.findMany({ where: { projectId: project.id } });
          const tallyCreateCount = await tx.tally.createMany({
            data: updates.map(update => ({
              state: project.state === PROJECT_STATE.DELETED ? TALLY_STATE.DELETED : TALLY_STATE.ACTIVE,

              ownerId: user.id,

              date: update.date,
              measure: MEASURE_CONVERSION[project.type],
              count: update.value,
              note: '',

              workId: work.id,
            })),
          });

          if(updates.length !== tallyCreateCount.count) {
            throw new Error(`Tally create count (${tallyCreateCount.count}) did not match update count (${updates.length})`);
          }

          // also add any goal the project may have had
          let goal: Goal | null = null;
          if(project.goal !== null) {
            const goalParams: GoalParameters = { threshold: {
              measure: MEASURE_CONVERSION[project.type],
              count: project.goal,
            } };

            goal = await tx.goal.create({
              data: {
                state: project.state === PROJECT_STATE.DELETED ? GOAL_STATE.DELETED : GOAL_STATE.ACTIVE,

                ownerId: user.id,

                title: `${project.title} Goal`,
                description: '',

                type: GOAL_TYPE.TARGET,
                parameters: goalParams,

                startDate: project.startDate,
                endDate: project.endDate,

                worksIncluded: {
                  connect: [ { id: work.id } ]
                },
              },
            });
          }

          // update the project to say it has been transitioned
          tx.project.update({
            where: { id: project.id },
            data: {
              transitionedId: work.id,
            },
          });

          scriptLogger.info(`Successfully transitioned project ${project.id} (${project.title})`);
          projectEntry.error = false;
          projectEntry.workId = work.id;
          projectEntry.goalId = goal ? goal.id : null;
        });
      } catch(err) {
        // the transaction did not succeed, so let's note that and move on
        scriptLogger.error(`Was not able to transition project ${project.id} (${project.title}): ${err.message}`);
        projectEntry.error = true;
        resultsEntry.error = true;
      }
    }

    scriptLogger.info(`Done transitioning user ${user.id} (${user.username})`);
  }

  scriptLogger.info(`All users have been processed; Here's the report:`);
  for(const userEntry of resultsLog) {
    scriptLogger.info(`${userEntry.error ? '❌' : '✅'} #${userEntry.userId} ${userEntry.username}:`);
    for(const projectEntry of userEntry.projects) {
      scriptLogger.info(`- ${projectEntry.error ? '❌' : '✅'} #${projectEntry.projectId} ${projectEntry.title} -> Work #${projectEntry.workId}` + (projectEntry.goal ? `, Goal #${projectEntry.goalId}` : ''));
    }
  }
}

main().catch(e => console.error(e));
