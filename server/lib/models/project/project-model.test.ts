import { vi, expect, describe, it, afterEach } from 'vitest';
import { getTestReqCtx, mockObject, mockObjects, TEST_OBJECT_ID, TEST_USER_ID } from 'testing-support/util';

import { getDbClient } from 'server/lib/db.ts';
import { logAuditEvent as _logAuditEvent } from '../../audit-events.ts';

import { CreateProjectData, SummarizedProject, UpdateProjectData, ProjectModel, ProjectWithTallies, type Project } from './project-model.ts';
import { PROJECT_PHASE, PROJECT_STATE } from './consts.ts';
import { type User } from '../user/user-model.ts';
import { type Tally } from '../tally/tally-model.wip.ts';
import { TALLY_MEASURE, TALLY_STATE } from '../tally/consts.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

vi.mock('../../tracer.ts');

vi.mock('server/lib/db.ts');
const db = vi.mocked(getDbClient(), { deep: true });

vi.mock('../../audit-events.ts');
const logAuditEvent = vi.mocked(_logAuditEvent);

describe(ProjectModel, () => {
  const testOwner = mockObject<User>({ id: TEST_USER_ID });
  const testReqCtx = getTestReqCtx();

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(ProjectModel.getProjects, () => {
    it('gets a list of projects', async () => {
      const testProjects = mockObjects<Project>(3);
      db.work.findMany.mockResolvedValue(testProjects);

      const projects = await ProjectModel.getProjects(testOwner);

      expect(projects).toBe(testProjects);
      expect(db.work.findMany).toBeCalledWith({
        where: {
          ownerId: testOwner.id,
          state: PROJECT_STATE.ACTIVE,
        },
      });
    });
  });

  describe(ProjectModel.getSummarizedProjects, () => {
    it('gets a list of summarized projects', async () => {
      const testProjectsWithTallies = mockObjects<ProjectWithTallies>(3, () => ({
        tallies: mockObjects<Tally>(4, () => ({
          date: '2024-01-01',
          measure: TALLY_MEASURE.WORD,
          count: 1000,
        })),
      }));
      db.work.findMany.mockResolvedValue(testProjectsWithTallies);

      const expectedSummarizedProjects = mockObjects<SummarizedProject>(3, () => ({
        totals: { [TALLY_MEASURE.WORD]: 4000 },
        lastUpdated: '2024-01-01',
      }));

      const projects = await ProjectModel.getSummarizedProjects(testOwner);

      expect(projects).toEqual(expectedSummarizedProjects);
      expect(db.work.findMany).toBeCalledWith({
        where: {
          ownerId: testOwner.id,
          state: PROJECT_STATE.ACTIVE,
        },
        include: {
          tallies: {
            where: {
              state: TALLY_STATE.ACTIVE,
              ownerId: testOwner.id,
            },
            orderBy: {
              date: 'desc',
            },
          },
        },
      });
    });

    it('summarizes multiple measures in the tallies', async () => {
      const testProjectsWithTallies = mockObjects<ProjectWithTallies>(1, () => ({
        tallies: mockObjects<Tally>(6, ix => ({
          date: `2024-01-${10 + (5 - ix)}`,
          measure: ix % 2 ? TALLY_MEASURE.SCENE : TALLY_MEASURE.LINE,
          count: ix % 2 ? 5 : 100,
        })),
      }));
      db.work.findMany.mockResolvedValue(testProjectsWithTallies);

      const expectedSummarizedWorks = mockObjects<SummarizedProject>(1, () => ({
        totals: {
          [TALLY_MEASURE.SCENE]: 15,
          [TALLY_MEASURE.LINE]: 300,
        },
        lastUpdated: '2024-01-15',
      }));

      const projects = await ProjectModel.getSummarizedProjects(testOwner);

      expect(projects).toEqual(expectedSummarizedWorks);
    });

    it('returns reasonable info when there are no tallies for a project', async () => {
      const testProjectsWithTallies = mockObjects<ProjectWithTallies>(1, () => ({
        tallies: [],
      }));
      db.work.findMany.mockResolvedValue(testProjectsWithTallies);

      const expectedSummarizedWorks = mockObjects<SummarizedProject>(1, () => ({
        totals: {},
        lastUpdated: null,
      }));

      const projects = await ProjectModel.getSummarizedProjects(testOwner);

      expect(projects).toEqual(expectedSummarizedWorks);
    });
  });

  describe(ProjectModel.getProject, () => {
    it('gets a project', async () => {
      const testWork = mockObject<Project>({ id: TEST_OBJECT_ID });
      db.work.findUnique.mockResolvedValue(testWork);

      const project = await ProjectModel.getProject(testOwner, TEST_OBJECT_ID);

      expect(project).toBe(testWork);
      expect(db.work.findUnique).toBeCalledWith({
        where: {
          id: TEST_OBJECT_ID,
          ownerId: testOwner.id,
          state: PROJECT_STATE.ACTIVE,
        },
      });
    });

    it('returns null if the project is not found', async () => {
      db.work.findUnique.mockResolvedValue(null);

      const project = await ProjectModel.getProject(testOwner, TEST_OBJECT_ID);

      expect(project).toBe(null);
    });
  });

  describe(ProjectModel.createProject, () => {
    it('creates a project', async () => {
      const testData: CreateProjectData = {
        title: 'fake title',
        description: 'fake description',
        phase: PROJECT_PHASE.DRAFTING,
        startingBalance: { [TALLY_MEASURE.LINE]: 8 },
        cover: 'fake-cover-path.png',
        starred: true,
        displayOnProfile: true,
      };
      const testProject = mockObject<Project>({ id: TEST_OBJECT_ID });
      db.work.create.mockResolvedValue(testProject);

      const created = await ProjectModel.createProject(testOwner, testData, testReqCtx);

      expect(created).toBe(testProject);
      expect(db.work.create).toBeCalledWith({
        data: {
          ...testData,
          state: PROJECT_STATE.ACTIVE,
          ownerId: testOwner.id,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.PROJECT_CREATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );
    });

    it('creates a project with defaults supplied as needed', async () => {
      const testData: CreateProjectData = {
        title: 'barebones title',
      };
      const testProject = mockObject<Project>({ id: TEST_OBJECT_ID });
      db.work.create.mockResolvedValue(testProject);

      await ProjectModel.createProject(testOwner, testData, testReqCtx);

      expect(db.work.create).toBeCalledWith({
        data: {
          title: testData.title,
          description: '',
          phase: PROJECT_PHASE.PLANNING,
          startingBalance: {},
          cover: null,
          starred: false,
          displayOnProfile: false,
          state: PROJECT_STATE.ACTIVE,
          ownerId: testOwner.id,
        },
      });
    });
  });

  describe(ProjectModel.updateProject, () => {
    it('updates a project', async () => {
      const testData: UpdateProjectData = {
        description: 'a more flowery description',
        phase: PROJECT_PHASE.FINISHED,
      };
      const testProject = mockObject<Project>({ id: TEST_OBJECT_ID });
      db.work.update.mockResolvedValue(testProject);

      const updated = await ProjectModel.updateProject(testOwner, testProject, testData, testReqCtx);

      expect(updated).toBe(testProject);
      expect(db.work.update).toBeCalledWith({
        where: {
          id: testProject.id,
          ownerId: testOwner.id,
          state: PROJECT_STATE.ACTIVE,
        },
        data: {
          ...testData,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.PROJECT_UPDATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );
    });
  });

  describe(ProjectModel.deleteProject, () => {
    it('deletes a project', async () => {
      const testWork = mockObject<Project>({ id: TEST_OBJECT_ID });
      db.work.update.mockResolvedValue(testWork);

      const deleted = await ProjectModel.deleteProject(testOwner, testWork, testReqCtx);

      expect(deleted).toBe(testWork);
      expect(db.work.update).toBeCalledWith({
        where: {
          id: testWork.id,
          ownerId: testOwner.id,
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
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.PROJECT_DELETE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );
    });
  });

  describe(ProjectModel.undeleteProject, () => {
    it('undeletes a project', async () => {
      const testWork = mockObject<Project>({ id: TEST_OBJECT_ID });
      db.work.update.mockResolvedValue(testWork);

      const deleted = await ProjectModel.undeleteProject(testOwner, testWork, testReqCtx);
      expect(deleted).toBe(testWork);
      expect(db.work.update).toBeCalledWith({
        where: {
          id: testWork.id,
          ownerId: testOwner.id,
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
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.PROJECT_UNDELETE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );
    });
  });
});
