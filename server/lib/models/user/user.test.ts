import { vi, expect, describe, it, afterEach, beforeEach, MockInstance } from 'vitest';
import { getTestReqCtx, mockObject, mockObjects, TEST_SESSION_ID, TEST_USER_ID, TEST_UUID } from 'testing-support/util';

import { CreateUserData, UpdateUserData, UserModel } from './user.ts';
import { hash } from '../../hash.ts';
import type { PasswordResetLink, PendingEmailVerification, User, UserAuth } from '@prisma/client';
import { ValidationError } from '../errors.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';
import { USER_STATE } from './consts.ts';
import { PASSWORD_RESET_LINK_STATE } from '../password-reset-link.ts';

vi.mock('../../tracer.ts');

import _dbClient from '../../db.ts';
vi.mock('../../db.ts');
const dbClient = vi.mocked(_dbClient, { deep: true });

import { logAuditEvent as _logAuditEvent } from '../../audit-events.ts';
vi.mock('../../audit-events.ts');
const logAuditEvent = vi.mocked(_logAuditEvent);

import { pushTask as _pushTask } from '../../queue.ts';
vi.mock('../../queue.ts');
const pushTask = vi.mocked(_pushTask);

import * as _hash from '../../hash.ts';

describe(UserModel, () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(UserModel.getUsers, () => {
    it('gets a list of users', async () => {
      const testUsers = mockObjects<User>(3);
      dbClient.user.findMany.mockResolvedValue(testUsers);

      const users = await UserModel.getUsers();

      expect(dbClient.user.findMany).toBeCalled();
      expect(users).toEqual(testUsers);
    });
  });

  describe(UserModel.getUser, () => {
    it('gets a user by id', async () => {
      const testId = -10;
      const mockUser = mockObject<User>({ id: testId });
      dbClient.user.findUnique.mockResolvedValue(mockUser);

      const user = await UserModel.getUser(testId);

      expect(dbClient.user.findUnique).toBeCalled();
      expect(user).toEqual(mockUser);
    });

    it(`returns null if it doesn't find a user`, async () => {
      const testId = -10;
      dbClient.user.findUnique.mockResolvedValue(null);

      const user = await UserModel.getUser(testId);

      expect(user).toBeNull();
      expect(dbClient.user.findUnique).toBeCalled();
    });
  });

  describe(UserModel.getUserAuth, () => {
    it('gets a userauth by user id', async () => {
      const testUser = mockObject<User>({ id: -10 });
      const mockUserAuth = mockObject<UserAuth>({ userId: testUser.id });
      dbClient.userAuth.findUnique.mockResolvedValue(mockUserAuth);

      const userAuth = await UserModel.getUserAuth(testUser);

      expect(dbClient.userAuth.findUnique).toBeCalled();
      expect(userAuth).toEqual(mockUserAuth);
    });

    it(`returns null if it doesn't find a userauth`, async () => {
      const testUser = mockObject<User>({ id: -10 });
      dbClient.userAuth.findUnique.mockResolvedValue(null);

      const userAuth = await UserModel.getUserAuth(testUser);

      expect(userAuth).toBeNull();
      expect(dbClient.userAuth.findUnique).toBeCalled();
    });
  });

  describe(UserModel.getUserByUsername, () => {
    it('gets a user by username', async () => {
      const testUsername = 'alice';
      const mockUser = mockObject<User>({ username: testUsername });
      dbClient.user.findUnique.mockResolvedValue(mockUser);

      const user = await UserModel.getUserByUsername(testUsername);

      expect(dbClient.user.findUnique).toBeCalled();
      expect(user).toEqual(mockUser);
    });

    it(`returns null if it doesn't find a user`, async () => {
      const testUsername = 'bob';
      dbClient.user.findUnique.mockResolvedValue(null);

      const user = await UserModel.getUserByUsername(testUsername);

      expect(user).toBeNull();
      expect(dbClient.user.findUnique).toBeCalled();
    });
  });

  describe(UserModel.validateUsername, () => {
    let getUserByUsernameMock: MockInstance<typeof UserModel.getUserByUsername>;

    beforeEach(() => {
      getUserByUsernameMock = vi.spyOn(UserModel, 'getUserByUsername');
      getUserByUsernameMock.mockResolvedValue(mockObject<User>({}));
    });

    afterEach(() => {
      getUserByUsernameMock.mockRestore();
    });

    it('returns the username if it is valid and no user with the username exists', async () => {
      getUserByUsernameMock.mockResolvedValue(null);

      const expected = 'new';

      const actual = await UserModel.validateUsername('new');

      expect(actual).toBe(expected);
    });

    it('converts the username to lowercase', async () => {
      getUserByUsernameMock.mockResolvedValue(null);

      const expected = 'username123';

      const actual = await UserModel.validateUsername('UsErNaMe123');

      expect(actual).toBe(expected);
    });

    it('throws a ValidationError on an invalid username', async () => {
      await expect(() => UserModel.validateUsername('3startswithanumber')).rejects.toThrow(ValidationError);
      await expect(() => UserModel.validateUsername('has&anampersand')).rejects.toThrow(ValidationError);
      await expect(() => UserModel.validateUsername('no')).rejects.toThrow(ValidationError);
      await expect(() => UserModel.validateUsername('thisisabsolutelyanddefinitelytoolong')).rejects.toThrow(ValidationError);
      await expect(() => UserModel.validateUsername(' with spaces ')).rejects.toThrow(ValidationError);
    });

    it('throws a ValidationError if a user with the username exists', async () => {
      getUserByUsernameMock.mockResolvedValue(mockObject<User>({ username: 'exists' }));

      await expect(() => UserModel.validateUsername('exists')).rejects.toThrow(ValidationError);
    });
  });

  describe(UserModel.signUpUser, () => {
    let validateUsername: MockInstance<typeof UserModel.validateUsername>;
    let createUser: MockInstance<typeof UserModel.createUser>;
    let sendSignupEmail: MockInstance<typeof UserModel.sendSignupEmail>;
    let sendEmailVerificationLink: MockInstance<typeof UserModel.sendEmailVerificationLink>;

    beforeEach(() => {
      validateUsername = vi.spyOn(UserModel, 'validateUsername');
      createUser = vi.spyOn(UserModel, 'createUser');
      sendSignupEmail = vi.spyOn(UserModel, 'sendSignupEmail');
      sendEmailVerificationLink = vi.spyOn(UserModel, 'sendEmailVerificationLink');
    });

    afterEach(() => {
      validateUsername.mockRestore();
      createUser.mockRestore();
      sendSignupEmail.mockRestore();
      sendEmailVerificationLink.mockRestore();
    });

    it('validates the username, creates a user, logs an audit event, and sends two emails', async () => {
      const testUser = mockObject<User>({ id: -10 });
      const testReqCtx = { userId: null, sessionId: TEST_SESSION_ID };
      
      validateUsername.mockImplementation(async (username) => username.toLowerCase());
      createUser.mockResolvedValue(testUser);
      sendSignupEmail.mockResolvedValue(void 0);
      sendEmailVerificationLink.mockResolvedValue(void 0);

      const signedUpUser = await UserModel.signUpUser({
        username: 'alice',
        email: 'alice@example.com',
        password: 'p4ssw0rd',
      }, testReqCtx);

      expect(signedUpUser).toBe(testUser);

      expect(validateUsername).toBeCalled();
      expect(createUser).toBeCalled();
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.USER_SIGNUP,
        testUser.id, testUser.id, null,
        null,
        TEST_SESSION_ID
      );
      expect(sendSignupEmail).toBeCalledWith(testUser, { force: true }, { ...testReqCtx, userId: -10 });
      expect(sendEmailVerificationLink).toBeCalledWith(testUser, { force: true }, { ...testReqCtx, userId: -10 });
    });
  });

  describe(UserModel.createUser, () => {
    it('creates a user with the given data', async () => {
      const testCreateData: CreateUserData = {
        username: 'test-alice',
        password: 'testing',
        email: 'test-alice@example.com',
        displayName: 'TestAlice',
        isEmailVerified: true,
      };
      const testUser = mockObject<User>({ id: -10 });
      dbClient.user.create.mockResolvedValue(testUser);

      const reqCtx = getTestReqCtx();
      const created = await UserModel.createUser(testCreateData, reqCtx);

      expect(created).toBe(testUser);

      expect(dbClient.user.create).toBeCalledWith({
        data: expect.objectContaining({
          username: testCreateData.username,
          email: testCreateData.email,
          displayName: testCreateData.displayName,
          isEmailVerified: testCreateData.isEmailVerified,
          userAuth: { create: expect.any(Object) },
          userSettings: { create: expect.any(Object) },
        }),
      });

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.USER_CREATE,
        testUser.id, testUser.id, null,
        null,
        TEST_SESSION_ID
      );
    });

    it(`creates a user in the active state`, async () => {
      const testCreateData: CreateUserData = {
        username: 'test-alice',
        password: 'testing',
        email: 'test-alice@example.com',
      };
      const testUser = mockObject<User>({ id: -10 });
      dbClient.user.create.mockResolvedValue(testUser);
      
      await UserModel.createUser(testCreateData, getTestReqCtx());

      expect(dbClient.user.create).toBeCalledWith({
        data: expect.objectContaining({
          state: USER_STATE.ACTIVE,
        })
      });
    });

    it(`defaults the display name to the username if it's not included`, async () => {
      const testCreateData: CreateUserData = {
        username: 'test-alice',
        password: 'testing',
        email: 'test-alice@example.com',
      };
      const testUser = mockObject<User>({ id: -10 });
      dbClient.user.create.mockResolvedValue(testUser);
      
      await UserModel.createUser(testCreateData, getTestReqCtx());

      expect(dbClient.user.create).toBeCalledWith({
        data: expect.objectContaining({
          username: testCreateData.username,
          displayName: testCreateData.username,
        })
      });
    });

    it(`defaults email verification to false`, async () => {
      const testCreateData: CreateUserData = {
        username: 'test-alice',
        password: 'testing',
        email: 'test-alice@example.com',
      };
      const testUser = mockObject<User>({ id: -10 });
      dbClient.user.create.mockResolvedValue(testUser);
      
      await UserModel.createUser(testCreateData, getTestReqCtx());

      expect(dbClient.user.create).toBeCalledWith({
        data: expect.objectContaining({
          isEmailVerified: false,
        })
      });
    });
  });

  describe(UserModel.updateUser, () => {
    let mockValidateUsername;

    beforeEach(() => {
      mockValidateUsername = vi.spyOn(UserModel, 'validateUsername').mockImplementation(async (username) => username.toLowerCase());
    });

    afterEach(() => {
      mockValidateUsername.mockRestore();
    })

    it('updates a user with the given data', async () => {
      const testUser = mockObject<User>({ id: -10 });
      const testUpdateData: UpdateUserData = {
        displayName: 'TestAlice',
        username: 'alice',
        email: 'alice@example.com',
      };
      dbClient.user.update.mockResolvedValue(testUser);

      const reqCtx = getTestReqCtx();
      const updated = await UserModel.updateUser(testUser, testUpdateData, reqCtx);

      expect(updated).toBe(testUser);

      expect(dbClient.user.update).toBeCalledWith({
        where: { id: testUser.id },
        data: {
          displayName: testUpdateData.displayName,
          username: testUpdateData.username,
          email: testUpdateData.email,
        },
      });

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.USER_UPDATE,
        testUser.id, testUser.id, null,
        expect.any(Object),
        TEST_SESSION_ID
      );
    });

    it('throws an error if asked to update a username to an invalid one', async () => {
      const testUser = mockObject<User>({ id: -10 });
      const testUpdateData: UpdateUserData = {
        username: 'this-username-is-taken',
      };
      mockValidateUsername.mockRejectedValue(new ValidationError('user', 'username', `something ain't right`));

      const reqCtx = getTestReqCtx();
      await expect(async () => {
        await UserModel.updateUser(testUser, testUpdateData, reqCtx);
      }).rejects.toThrow(ValidationError);

      expect(UserModel.validateUsername).toBeCalled();
      expect(dbClient.user.update).not.toBeCalled();
      expect(logAuditEvent).not.toBeCalled();
    });

    it('throws an error if asked to update an email to an invalid one', async () => {
      const testUser = mockObject<User>({ id: -10 });
      const testUpdateData: UpdateUserData = {
        email: 'this is definitely not an email address',
      };

      const reqCtx = getTestReqCtx();
      await expect(async () => {
        await UserModel.updateUser(testUser, testUpdateData, reqCtx);
      }).rejects.toThrow(ValidationError);

      expect(dbClient.user.update).not.toBeCalled();
      expect(logAuditEvent).not.toBeCalled();
    });
  });

  describe(UserModel.setUserState, () => {
    it('updates a user with the given state', async () => {
      const testUser = mockObject<User>({ id: -10 });
      const testNewState = USER_STATE.ACTIVE;
      dbClient.user.update.mockResolvedValue(testUser);

      const reqCtx = getTestReqCtx();
      const updated = await UserModel.setUserState(testUser, testNewState, reqCtx);

      expect(updated).toBe(testUser);

      expect(dbClient.user.update).toBeCalledWith({
        where: { id: testUser.id },
        data: {
          state: testNewState
        },
      });
    });

    it.each([
      { state: USER_STATE.ACTIVE, event: AUDIT_EVENT_TYPE.USER_ACTIVATE },
      { state: USER_STATE.SUSPENDED, event: AUDIT_EVENT_TYPE.USER_SUSPEND },
      { state: USER_STATE.DELETED, event: AUDIT_EVENT_TYPE.USER_DELETE },
    ])('logs an audit event of type $event when setting state to $state', async ({ state, event }) => {
      const testUser = mockObject<User>({ id: -10 });
      const testNewState = state;
      dbClient.user.update.mockResolvedValue(testUser);

      const reqCtx = getTestReqCtx();
      await UserModel.setUserState(testUser, testNewState, reqCtx);

      expect(logAuditEvent).toBeCalledWith(
        event,
        testUser.id, testUser.id, null,
        expect.any(Object),
        TEST_SESSION_ID
      );
    });
  });

  describe(UserModel.verifyEmail, () => {
    it(`verifies the user's email address`, async () => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        email: 'alice@example.com',
      });
      const testPendingVerification = mockObject<PendingEmailVerification & { user: User }>({
        uuid: TEST_UUID,
        newEmail: 'alice@example.com',
        user: testUser,
      });
      dbClient.pendingEmailVerification.findUnique.mockResolvedValue(testPendingVerification);
      dbClient.user.update.mockResolvedValue(testUser);

      const isVerified = await UserModel.verifyEmail(TEST_UUID, getTestReqCtx());
      
      expect(isVerified).toBe(true);

      expect(dbClient.pendingEmailVerification.findUnique).toBeCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          uuid: TEST_UUID,
          expiresAt: { gt: expect.any(Date) },
        }),
      }));

      expect(dbClient.user.update).toBeCalledWith({
        data: {
          isEmailVerified: true,
          pendingEmailVerifications: { deleteMany: [] },
        },
        where: { id: TEST_USER_ID }
      });

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.USER_VERIFY_EMAIL,
        TEST_USER_ID, testUser.id, null,
        expect.any(Object),
        TEST_SESSION_ID
      );
    });

    it(`will not verify for a missing verification`, async () => {
      dbClient.pendingEmailVerification.findUnique.mockResolvedValue(null);

      const isVerified = await UserModel.verifyEmail(TEST_UUID, getTestReqCtx());
      
      expect(isVerified).toBe(false);

      expect(dbClient.pendingEmailVerification.findUnique).toBeCalled();

      expect(dbClient.user.update).not.toBeCalled();

      expect(logAuditEvent).not.toBeCalled();
    });

    it(`will not verify a different email than the one in the pending verification`, async () => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        email: 'alice-different@example.com',
      });
      const testPendingVerification = mockObject<PendingEmailVerification & { user: User }>({
        uuid: TEST_UUID,
        newEmail: 'alice@example.com',
        user: testUser,
      });
      dbClient.pendingEmailVerification.findUnique.mockResolvedValue(testPendingVerification);

      const isVerified = await UserModel.verifyEmail(TEST_UUID, getTestReqCtx());
      
      expect(isVerified).toBe(false);

      expect(dbClient.pendingEmailVerification.findUnique).toBeCalledWith(expect.objectContaining({
        where: expect.objectContaining({ uuid: TEST_UUID }),
      }));

      expect(dbClient.user.update).not.toBeCalled();

      expect(logAuditEvent).not.toBeCalled();
    });
  });

  describe(UserModel.resetPassword, () => {
    let mockSetUserPassword: MockInstance<typeof UserModel.setPassword>;
    let mockSendPasswordChangedEmail: MockInstance<typeof UserModel.sendPasswordChangedEmail>;

    beforeEach(() => {
      mockSetUserPassword = vi.spyOn(UserModel, 'setPassword').mockResolvedValue(void 0);
      mockSendPasswordChangedEmail = vi.spyOn(UserModel, 'sendPasswordChangedEmail').mockResolvedValue(true);
    });

    afterEach(() => {
      mockSetUserPassword.mockRestore();
      mockSendPasswordChangedEmail.mockRestore();
    });

    it(`sets the user's password`, async () => {
      const testUser = mockObject<User>({ id: TEST_USER_ID });
      const testPasswordResetLink = mockObject<PasswordResetLink & { user: User }>({
        uuid: TEST_UUID,
        user: testUser,
      });
      const testNewPassword = 'secrets secrets';
      const testReqCtx = getTestReqCtx();
      
      dbClient.passwordResetLink.findUnique.mockResolvedValue(testPasswordResetLink);

      const isReset = await UserModel.resetPassword(TEST_UUID, testNewPassword, testReqCtx);
      
      expect(isReset).toBe(true);

      expect(dbClient.passwordResetLink.findUnique).toBeCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          uuid: TEST_UUID,
          expiresAt: { gt: expect.any(Date) },
          state: PASSWORD_RESET_LINK_STATE.ACTIVE,
        }),
      }));

      expect(mockSetUserPassword).toBeCalledWith(testUser, testNewPassword, testReqCtx);

      expect(dbClient.passwordResetLink.update).toBeCalledWith({
        data: {
          state: PASSWORD_RESET_LINK_STATE.USED,
        },
        where: {
          uuid: TEST_UUID,
        },
      });

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.USER_PASSWORD_RESET,
        testUser.id, testUser.id, null,
        expect.any(Object),
        TEST_SESSION_ID
      );

      expect(mockSendPasswordChangedEmail).toBeCalledWith(testUser, testReqCtx);
    });

    it(`refuses to reset the password if it can't find the link`, async () => {
      const testNewPassword = 'secrets secrets';
      const testReqCtx = getTestReqCtx();
      
      dbClient.passwordResetLink.findUnique.mockResolvedValue(null);

      const isReset = await UserModel.resetPassword(TEST_UUID, testNewPassword, testReqCtx);
      
      expect(isReset).toBe(false);

      expect(mockSetUserPassword).not.toBeCalled();

      expect(dbClient.passwordResetLink.update).not.toBeCalled();

      expect(logAuditEvent).not.toBeCalled();

      expect(mockSendPasswordChangedEmail).not.toBeCalled();
    });
  });

  describe(UserModel.checkPassword, () => {
    let mockGetUserAuth: MockInstance<typeof UserModel.getUserAuth>;

    beforeEach(() => {
      mockGetUserAuth = vi.spyOn(UserModel, 'getUserAuth');
    });

    afterEach(() => {
      mockGetUserAuth.mockRestore();
    });

    it('returns true if the password matches', async () => {
      const testUser = mockObject<User>({ id: TEST_USER_ID });
      
      const testPassword = 'this should match';
      const { hashedPassword, salt } = await hash(testPassword);

      const testUserAuth = mockObject<UserAuth>({
        password: hashedPassword,
        salt: salt,
      });
      mockGetUserAuth.mockResolvedValue(testUserAuth);

      const isMatch = await UserModel.checkPassword(testUser, testPassword);

      expect(isMatch).toBe(true);
    });

    it('returns false if the password does not match', async () => {
      const testUser = mockObject<User>({ id: TEST_USER_ID });
      
      const testPassword = 'this is one thing';
      const { hashedPassword, salt } = await hash(testPassword);

      const testUserAuth = mockObject<UserAuth>({
        password: hashedPassword,
        salt: salt,
      });
      mockGetUserAuth.mockResolvedValue(testUserAuth);

      const isMatch = await UserModel.checkPassword(testUser, 'this is another');

      expect(isMatch).toBe(false);
    });
  });

  describe(UserModel.setPassword, () => {
    let hashSpy;

    beforeEach(() => {
      hashSpy = vi.spyOn(_hash, 'hash');
    });

    afterEach(() => {
      hashSpy.mockRestore();
    });
    
    it(`sets a user's password`, async () => {
      const testUser = mockObject<User>({ id: TEST_USER_ID });
      const testNewPassword = 'secrets secrets';
      const testReqCtx = getTestReqCtx();

      await UserModel.setPassword(testUser, testNewPassword, testReqCtx);

      expect(hashSpy).toHaveBeenCalled();
      const { hashedPassword, salt } = hashSpy.mock.settledResults.at(-1).value as Awaited<ReturnType<typeof _hash.hash>>;

      expect(dbClient.userAuth.update).toBeCalledWith({
        data: {
          password: hashedPassword,
          salt: salt,
        },
        where: { userId: testUser.id }
      });

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.USER_PASSWORD_CHANGE,
        TEST_USER_ID, testUser.id, null,
        null,
        TEST_SESSION_ID
      );
    });
  });

  describe(UserModel.sendSignupEmail, () => {
    it(`sends a signup email to an active user`, async () => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        state: USER_STATE.ACTIVE,
      });

      const wasSent = await UserModel.sendSignupEmail(testUser, {}, getTestReqCtx());

      expect(wasSent).toBe(true);
      expect(pushTask).toHaveBeenCalled();
    });

    it.each([
      { state: USER_STATE.SUSPENDED },
      { state: USER_STATE.DELETED },
    ])(`does not send a signup email to a user with a state of $state`, async ({ state }) => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        state,
      });

      const wasSent = await UserModel.sendSignupEmail(testUser, {}, getTestReqCtx());

      expect(wasSent).toBe(false);
      expect(pushTask).not.toHaveBeenCalled();
    });

    it.each([
      { state: USER_STATE.SUSPENDED },
      { state: USER_STATE.DELETED },
    ])(`sends a signup email to a user with a state of $state if forced`, async ({ state }) => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        state,
      });

      const wasSent = await UserModel.sendSignupEmail(testUser, { force: true }, getTestReqCtx());

      expect(wasSent).toBe(true);
      expect(pushTask).toHaveBeenCalled();
    });
  });

  describe(UserModel.sendPasswordChangedEmail, () => {
    it(`sends a password changed email`, async () => {
      const testUser = mockObject<User>({ id: TEST_USER_ID });

      const wasSent = await UserModel.sendPasswordChangedEmail(testUser, getTestReqCtx());

      expect(wasSent).toBe(true);
      expect(pushTask).toHaveBeenCalled();
    });
  });

  describe(UserModel.sendEmailVerificationLink, () => {
    it(`creates and sends an email verification link if the user's email is not verified`, async () => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        email: 'alice@example.com',
        isEmailVerified: false,
      });
      
      const testPendingVerification = mockObject<PendingEmailVerification>({ uuid: TEST_UUID });
      dbClient.pendingEmailVerification.create.mockResolvedValue(testPendingVerification);

      const link = await UserModel.sendEmailVerificationLink(testUser, {}, getTestReqCtx());

      expect(link).toBe(testPendingVerification);

      expect(dbClient.pendingEmailVerification.create).toHaveBeenCalledWith({
        data: {
          userId: testUser.id,
          newEmail: testUser.email,
          expiresAt: expect.any(Date),
        },
      });

      expect(pushTask).toHaveBeenCalled();

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.USER_REQUEST_EMAIL_VERIFICATION,
        TEST_USER_ID, testUser.id, null,
        expect.any(Object),
        TEST_SESSION_ID
      );
    });

    it(`does not send an email verification link if the user's email is verified`, async () => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        email: 'alice@example.com',
        isEmailVerified: true,
      });

      const link = await UserModel.sendEmailVerificationLink(testUser, {}, getTestReqCtx());

      expect(link).toBe(null);

      expect(dbClient.pendingEmailVerification.create).not.toHaveBeenCalled();

      expect(pushTask).not.toHaveBeenCalled();

      expect(logAuditEvent).not.toHaveBeenCalled();
    });

    it(`creates and sends an email verification link if the user's email is verified when forced`, async () => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        email: 'alice@example.com',
        isEmailVerified: true,
      });
      
      const testPendingVerification = mockObject<PendingEmailVerification>({ uuid: TEST_UUID });
      dbClient.pendingEmailVerification.create.mockResolvedValue(testPendingVerification);

      const link = await UserModel.sendEmailVerificationLink(testUser, { force: true }, getTestReqCtx());

      expect(link).toBe(testPendingVerification);

      expect(dbClient.pendingEmailVerification.create).toHaveBeenCalledWith({
        data: {
          userId: testUser.id,
          newEmail: testUser.email,
          expiresAt: expect.any(Date),
        },
      });

      expect(pushTask).toHaveBeenCalled();

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.USER_REQUEST_EMAIL_VERIFICATION,
        TEST_USER_ID, testUser.id, null,
        expect.any(Object),
        TEST_SESSION_ID
      );
    });
  });

  describe(UserModel.sendPasswordResetLink, () => {
    it(`creates and sends a password reset link to an active user`, async () => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        state: USER_STATE.ACTIVE,
      });
      
      const testPasswordResetLink = mockObject<PasswordResetLink>({ uuid: TEST_UUID });
      dbClient.passwordResetLink.create.mockResolvedValue(testPasswordResetLink);

      const link = await UserModel.sendPasswordResetLink(testUser, {}, getTestReqCtx());

      expect(link).toBe(testPasswordResetLink);

      expect(dbClient.passwordResetLink.create).toHaveBeenCalledWith({
        data: {
          userId: testUser.id,
          state: PASSWORD_RESET_LINK_STATE.ACTIVE,
          expiresAt: expect.any(Date),
        },
      });

      expect(pushTask).toHaveBeenCalled();

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.USER_REQUEST_PASSWORD_RESET,
        TEST_USER_ID, testUser.id, null,
        expect.any(Object),
        TEST_SESSION_ID
      );
    });

    it(`will not send a password reset link to a suspended user`, async () => {
      const testUser = mockObject<User>({
        id: TEST_USER_ID,
        state: USER_STATE.SUSPENDED,
      });
      
      const link = await UserModel.sendPasswordResetLink(testUser, {}, getTestReqCtx());

      expect(link).toBe(null);

      expect(dbClient.passwordResetLink.create).not.toHaveBeenCalled();

      expect(pushTask).not.toHaveBeenCalled();

      expect(logAuditEvent).not.toHaveBeenCalled();
    });
  });

});