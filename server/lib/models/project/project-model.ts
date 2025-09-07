import { traced } from '../../metrics/tracer.ts';

import dbClient from '../../db.ts';
import { type Work as PrismaWork } from 'generated/prisma/client';
import type { Create, Update } from '../types.ts';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import type { User } from '../user/user-model.ts';
import { PROJECT_PHASE, PROJECT_STATE, type ProjectPhase } from './consts.ts';
import type { Tally } from '../tally/tally-model.wip.ts';
import { TALLY_STATE } from '../tally/consts.ts';
import { sumTallies } from '../tally/helpers.ts';
import { omit } from 'server/lib/obj.ts';
import { type MeasureCounts } from '../tally/types.ts';
import { supplyDefaults } from '../helpers.ts';

export type Project = Omit<PrismaWork, 'phase' | 'startingBalance'> & {
  phase: ProjectPhase;
  startingBalance: MeasureCounts;
};
export type SummarizedProject = Project & {
  totals: MeasureCounts;
  lastUpdated: string | null;
};
export type ProjectWithTallies = Project & {
  tallies: Tally[];
};

type OptionalProjectFields = 'description' | 'phase' | 'startingBalance' | 'cover';
export type CreateProjectData = Create<Project, OptionalProjectFields>;
export type UpdateProjectData = Update<Project>;

export class ProjectModel {
  @traced
  static async getProjects(owner: User): Promise<Project[]> {
    const projects = await dbClient.work.findMany({
      where: {
        ownerId: owner.id,
        state: PROJECT_STATE.ACTIVE,
      },
    }) as Project[];

    return projects;
  }

  @traced
  static async getSummarizedProjects(owner: User): Promise<SummarizedProject[]> {
    const projectsWithTallies = await dbClient.work.findMany({
      where: {
        ownerId: owner.id,
        state: PROJECT_STATE.ACTIVE,
      },
      include: {
        tallies: {
          where: {
            ownerId: owner.id, // this is redundant but it lets us use the db index
            state: TALLY_STATE.ACTIVE,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    }) as ProjectWithTallies[];

    const summarizedProjects: SummarizedProject[] = projectsWithTallies.map(project => {
      const totals = sumTallies(project.tallies, project.startingBalance);

      // since we have the tallies ordered by date desc, we can just do this
      const lastUpdated = project.tallies.length > 0 ? project.tallies[0].date : null;

      return {
        ...omit(project, ['tallies']),
        totals,
        lastUpdated,
      };
    });

    return summarizedProjects;
  }

  @traced
  static async getProject(owner: User, id: number): Promise<Project | null> {
    const project = await dbClient.work.findUnique({
      where: {
        id,
        ownerId: owner.id,
        state: PROJECT_STATE.ACTIVE,
      },
    }) as Project;

    return project;
  }

  @traced
  static async createProject(owner: User, data: CreateProjectData, reqCtx: RequestContext): Promise<Project> {
    const dataWithDefaults = supplyDefaults(data, {
      description: '',
      phase: PROJECT_PHASE.PLANNING,
      startingBalance: {},
      cover: null,
      starred: false,
      displayOnProfile: false,
    });

    const created = await dbClient.work.create({
      data: {
        ...dataWithDefaults,
        state: PROJECT_STATE.ACTIVE,
        ownerId: owner.id,
      },
    }) as Project;

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.PROJECT_CREATE,
      reqCtx.userId, created.id, null,
      changes, reqCtx.sessionId,
    );

    return created;
  }

  @traced
  static async updateProject(owner: User, project: Project, data: UpdateProjectData, reqCtx: RequestContext): Promise<Project> {
    const updated = await dbClient.work.update({
      where: {
        id: project.id,
        ownerId: owner.id,
        state: PROJECT_STATE.ACTIVE,
      },
      data: {
        ...data,
      },
    }) as Project;

    const changes = buildChangeRecord(project, updated);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.PROJECT_UPDATE,
      reqCtx.userId, updated.id, null,
      changes, reqCtx.sessionId,
    );

    return updated;
  }

  @traced
  static async deleteProject(owner: User, project: Project, reqCtx: RequestContext): Promise<Project> {
    // when deleting a project, we set the status to deleted and set the associated tally statuses to deleted as well
    // that makes it easy to un-delete a project if a user asks us to
    const deleted = await dbClient.work.update({
      where: {
        id: project.id,
        ownerId: owner.id,
        state: PROJECT_STATE.ACTIVE,
      },
      data: {
        state: PROJECT_STATE.DELETED,
        tallies: {
          updateMany: {
            where: { state: TALLY_STATE.ACTIVE },
            data: { state: TALLY_STATE.DELETED },
          },
        },
      },
    }) as Project;

    const changes = buildChangeRecord(project, deleted);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.PROJECT_DELETE,
      reqCtx.userId, deleted.id, null,
      changes, reqCtx.sessionId,
    );

    return deleted;
  }

  @traced
  static async undeleteProject(owner: User, project: Project, reqCtx: RequestContext): Promise<Project> {
    // this is the inverse of deleting: the project is activated and the tallies are as well
    const undeleted = await dbClient.work.update({
      where: {
        id: project.id,
        ownerId: owner.id,
        state: PROJECT_STATE.DELETED,
      },
      data: {
        state: PROJECT_STATE.ACTIVE,
        tallies: {
          updateMany: {
            where: { state: TALLY_STATE.DELETED },
            data: { state: TALLY_STATE.ACTIVE },
          },
        },
      },
    }) as Project;

    const changes = buildChangeRecord(project, undeleted);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.PROJECT_UNDELETE,
      reqCtx.userId, undeleted.id, null,
      changes, reqCtx.sessionId,
    );

    return undeleted;
  }
}
