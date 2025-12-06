import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, mockObjects, TEST_OBJECT_ID } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser } from '../../lib/__mocks__/express.ts';

import { success } from 'server/lib/api-response.ts';

vi.mock('../../lib/models/project/project-model.ts');
import { ProjectModel as _ProjectModel, type Project, type SummarizedProject } from '../../lib/models/project/project-model.ts';
const ProjectModel = vi.mocked(_ProjectModel, { deep: true });

import { handleGetProjects, handleGetProject, handleCreateProject, handleUpdateProject, handleDeleteProject } from './project.ts';

describe('project api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(handleGetProjects, () => {
    it('returns projects', async () => {
      const testProjects = mockObjects<SummarizedProject>(3);
      ProjectModel.getSummarizedProjects.mockResolvedValue(testProjects);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetProjects(req, res);

      expect(ProjectModel.getSummarizedProjects).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success(testProjects));
    });
  });

  describe(handleGetProject, () => {
    it('returns a project if it finds one', async () => {
      const testProject = mockObject<Project>();
      ProjectModel.getProject.mockResolvedValue(testProject);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetProject(req, res);

      expect(ProjectModel.getProject).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success(testProject));
    });

    it(`returns a 404 if the project doesn't exist`, async () => {
      ProjectModel.getProject.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetProject(req, res);

      expect(ProjectModel.getProject).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleCreateProject, () => {
    it('creates a project', async () => {
      const testProject = mockObject<Project>({ id: TEST_OBJECT_ID });
      ProjectModel.createProject.mockResolvedValue(testProject);

      const { req, res } = getHandlerMocksWithUser();
      await handleCreateProject(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(ProjectModel.createProject).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(success(testProject));
    });
  });

  describe(handleUpdateProject, () => {
    it('updates a project', async () => {
      const testProject = mockObject<Project>({ id: TEST_OBJECT_ID });
      ProjectModel.getProject.mockResolvedValue(testProject);
      ProjectModel.updateProject.mockResolvedValue(testProject);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleUpdateProject(req, res);

      expect(ProjectModel.getProject).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(ProjectModel.updateProject).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success(testProject));
    });

    it(`returns 404 when updating a project that doesn't exist`, async () => {
      ProjectModel.getProject.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleUpdateProject(req, res);

      expect(ProjectModel.getProject).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(ProjectModel.updateProject).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleDeleteProject, () => {
    it('deletes a project', async () => {
      const testProject = mockObject<Project>({ id: TEST_OBJECT_ID });
      ProjectModel.getProject.mockResolvedValue(testProject);
      ProjectModel.deleteProject.mockResolvedValue(testProject);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleDeleteProject(req, res);

      expect(ProjectModel.getProject).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(ProjectModel.deleteProject).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success(testProject));
    });

    it(`returns 404 when deleting a project that doesn't exist`, async () => {
      ProjectModel.getProject.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleDeleteProject(req, res);

      expect(ProjectModel.getProject).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(ProjectModel.deleteProject).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
