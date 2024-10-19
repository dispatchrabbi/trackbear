import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import { mockObject, NIL_UUID, TEST_SESSION_ID } from '../../lib/__mocks__/util.ts';
import { getHandlerMocksWithUser, MOCK_USER_ID } from '../../lib/__mocks__/express.ts';
import type { PendingEmailVerification, User } from '@prisma/client';

vi.mock('../../lib/db.ts');
import dbClientMock from '../../lib/__mocks__/db.ts';

vi.mock('../../lib/audit-events.ts', { spy: true });
import logAuditEventMock from '../../lib/__mocks__/audit-events.ts';

import * as queue from "../../lib/queue.ts";
vi.spyOn(queue, 'pushTask').mockReturnValue(void 0);
import sendEmailverificationEmail from "../../lib/tasks/send-emailverification-email.ts";
import sendUsernameChangedEmail from "../../lib/tasks/send-username-changed-email.ts";
import sendAccountDeletedEmail from "../../lib/tasks/send-account-deleted-email.ts";

import {
  handleGetMe, handlePatchMe, handleDeleteMe,
  handleUploadAvatar, handleDeleteAvatar,
  handleUpdateSettings,
  type FullUser
} from './me.ts';

describe('me api v1', () => {

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleGetMe', () => {
    it('returns the current user', async () => {
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.user.findUnique.mockResolvedValue(mockObject<FullUser>());

      const { req, res } = getHandlerMocksWithUser();
      await handleGetMe(req, res);

      expect(dbClientMock.user.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns a 404 if there is no current user', async () => {
      dbClientMock.user.findUnique.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetMe(req, res);

      expect(dbClientMock.user.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('handlePatchMe', () => {
    // each of these tests needs some user setup, so here it is
    const mockUserData = {
      id: MOCK_USER_ID,
      username: 'testuser',
      displayName: 'Test User',
      email: 'testuser@example.com',
      isEmailVerified: true,
    };
    let req, res;
    beforeEach(() => {
      const handlerMocks = getHandlerMocksWithUser({
        user: mockObject<User>(mockUserData)
      });
      req = handlerMocks.req;
      res = handlerMocks.res;
    });

    it('updates a changed username', async () => {
      const NEW_USERNAME = 'new-username';
      req.body = { username: NEW_USERNAME };

      dbClientMock.user.findMany.mockResolvedValue([]);
      dbClientMock.user.update.mockResolvedValue(mockObject<User>({
        ...mockUserData,
        username: NEW_USERNAME,
      }));

      await handlePatchMe(req, res);

      expect(dbClientMock.user.findMany).toHaveBeenCalled();
      expect(dbClientMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          username: NEW_USERNAME,
          isEmailVerified: true,
          pendingEmailVerifications: undefined,
        },
      }));
      expect(logAuditEventMock).toHaveBeenCalledWith('user:update', MOCK_USER_ID, MOCK_USER_ID, null, expect.anything(), TEST_SESSION_ID);
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.pendingEmailVerification.findFirst).not.toHaveBeenCalled();
      expect(queue.pushTask).toHaveBeenCalledWith(sendUsernameChangedEmail.makeTask(MOCK_USER_ID));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns a 409 if the proposed username already exists', async () => {
      const NEW_USERNAME = 'new-username';
      req.body = { username: NEW_USERNAME };

      dbClientMock.user.findMany.mockResolvedValue([mockObject<User>()]);

      await handlePatchMe(req, res);

      expect(dbClientMock.user.findMany).toHaveBeenCalled();
      expect(dbClientMock.user.update).not.toHaveBeenCalled();
      expect(logAuditEventMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalled();
    });

    it('updates a changed display name', async () => {
      const NEW_DISPLAY_NAME = 'New Display Name';
      req.body = { displayName: NEW_DISPLAY_NAME };

      dbClientMock.user.update.mockResolvedValue(mockObject<User>({
        ...mockUserData,
        displayName: NEW_DISPLAY_NAME
      }));

      await handlePatchMe(req, res);

      expect(dbClientMock.user.findMany).not.toHaveBeenCalled();
      expect(dbClientMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          displayName: NEW_DISPLAY_NAME,
          isEmailVerified: true,
          pendingEmailVerifications: undefined,
        },
      }));
      expect(logAuditEventMock).toHaveBeenCalledWith('user:update', MOCK_USER_ID, MOCK_USER_ID, null, expect.anything(), TEST_SESSION_ID);
      expect(dbClientMock.pendingEmailVerification.findFirst).not.toHaveBeenCalled();
      expect(queue.pushTask).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('updates a changed email address', async () => {
      const NEW_EMAIL = 'new@example.com';
      req.body = { email: NEW_EMAIL };

      dbClientMock.user.findMany.mockResolvedValue([]);
      dbClientMock.user.update.mockResolvedValue(mockObject<User>({
        ...mockUserData,
        email: NEW_EMAIL,
      }));
      dbClientMock.pendingEmailVerification.findFirst.mockResolvedValue(mockObject<PendingEmailVerification>({
        uuid: NIL_UUID,
        newEmail: NEW_EMAIL
      }));

      await handlePatchMe(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.user.findMany).not.toHaveBeenCalled();
      expect(dbClientMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          email: NEW_EMAIL,
          isEmailVerified: false,
          pendingEmailVerifications: { create: expect.objectContaining({ newEmail: NEW_EMAIL }) },
        },
      }));
      expect(logAuditEventMock).toHaveBeenCalledWith('user:update', MOCK_USER_ID, MOCK_USER_ID, null, expect.anything(), TEST_SESSION_ID);
      expect(dbClientMock.pendingEmailVerification.findFirst).toHaveBeenCalled();
      expect(queue.pushTask).toHaveBeenCalledWith(sendEmailverificationEmail.makeTask(NIL_UUID));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns a 404 if there is no current user', async () => {
      dbClientMock.user.findUnique.mockResolvedValue(null);

      req.body = {
        displayName: 'New Display Name',
      };
      await handleGetMe(req, res);

      expect(dbClientMock.user.findUnique).toHaveBeenCalled();
      expect(logAuditEventMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('handleDeleteMe', () => {
    it('deletes the current user', async () => {
      dbClientMock.user.update.mockResolvedValue(
        mockObject<User>({ id: MOCK_USER_ID })
      );

      const { req, res } = getHandlerMocksWithUser();
      await handleDeleteMe(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.user.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('user:delete', MOCK_USER_ID, MOCK_USER_ID, null, null, TEST_SESSION_ID);
      expect(queue.pushTask).toHaveBeenCalledWith(sendAccountDeletedEmail.makeTask(MOCK_USER_ID));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe.todo('handleUploadAvatar', () => {
    it.todo('uploads an avatar');

    it.todo('sends 400 if getting the file from the request fails', async () => {

    });

    it.todo(`sends 400 if getting the file isn't an allowed format`, async () => {

    });

    it.todo(`sends 500 if the file can't be copied from temp storage`, async () => {

    });

    it.todo(`still uploads if the file can't be deleted from temp storage`, async () => {

    });

    it.todo(`sends 404 if there is no current user`, async () => {

    });
  });

  describe.todo('handleDeleteAvatar');

  describe.todo('handleUpdateSettings');
});