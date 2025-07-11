import { vi, expect, describe, it, afterEach } from 'vitest';
import { getTestReqCtx, mockObject, mockObjects, TEST_API_TOKEN, TEST_OBJECT_ID, TEST_USER_ID } from 'testing-support/util';

import _dbClient from '../../db.ts';
import { logAuditEvent as _logAuditEvent, type ChangeRecord } from '../../audit-events.ts';

import { ApiKeyModel, type ApiKey, type CreateApiKeyData, type UpdateApiKeyData } from './api-key-model.ts';
import { generateApiToken as _generateApiToken } from '../../api-key.ts';
import { type User } from '../user/user-model.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

vi.mock('../../tracer.ts');

vi.mock('../../db.ts');
const dbClient = vi.mocked(_dbClient, { deep: true });

vi.mock('../../audit-events.ts', async () => {
  const originalModule = await vi.importActual('../../audit-events.ts');
  // only actually mock logAuditEvent
  return { ...originalModule, logAuditEvent: vi.fn() };
});
const logAuditEvent = vi.mocked(_logAuditEvent);

vi.mock('../../api-key.ts', async () => {
  const originalModule = await vi.importActual('../../api-key.ts');
  // only actually mock generateApiToken
  return { ...originalModule, generateApiToken: vi.fn() };
});
const generateApiToken = vi.mocked(_generateApiToken);

describe(ApiKeyModel, () => {
  const testUser = mockObject<User>({ id: TEST_USER_ID });
  const testReqCtx = getTestReqCtx();

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(ApiKeyModel.getApiKeys, () => {
    it('gets a list of api keys', async () => {
      const testApiKeys = mockObjects<ApiKey>(3);
      dbClient.apiKey.findMany.mockResolvedValue(testApiKeys);

      const apiKeys = await ApiKeyModel.getApiKeys(testUser);

      expect(apiKeys).toBe(testApiKeys);
      expect(dbClient.apiKey.findMany).toBeCalledWith({
        where: {
          ownerId: testUser.id,
        },
      });
    });
  });

  describe(ApiKeyModel.getApiKey, () => {
    it('gets an api key', async () => {
      const testApiKey = mockObject<ApiKey>({ id: TEST_OBJECT_ID });
      dbClient.apiKey.findUnique.mockResolvedValue(testApiKey);

      const apiKey = await ApiKeyModel.getApiKey(testUser, TEST_OBJECT_ID);

      expect(apiKey).toBe(testApiKey);
      expect(dbClient.apiKey.findUnique).toBeCalledWith({
        where: {
          id: TEST_OBJECT_ID,
          ownerId: testUser.id,
        },
      });
    });

    it('returns null if the apiKey is not found', async () => {
      dbClient.apiKey.findUnique.mockResolvedValue(null);

      const apiKey = await ApiKeyModel.getApiKey(testUser, TEST_OBJECT_ID);

      expect(apiKey).toBe(null);
    });
  });

  describe(ApiKeyModel.createApiKey, () => {
    it('creates an api key', async () => {
      const testData: CreateApiKeyData = {
        title: 'a test API key',
        expiresAt: new Date(),
      };

      generateApiToken.mockResolvedValue(TEST_API_TOKEN);

      const testApiKey = mockObject<ApiKey>({
        id: TEST_OBJECT_ID,
        token: TEST_API_TOKEN,
        ...testData,
      });
      dbClient.apiKey.create.mockResolvedValue(testApiKey);

      const created = await ApiKeyModel.createApiKey(testUser, testData, testReqCtx);

      expect(created).toBe(testApiKey);
      expect(dbClient.apiKey.create).toBeCalledWith({
        data: {
          ...testData,
          token: TEST_API_TOKEN,
          ownerId: testUser.id,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.API_KEY_CREATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );
      // ensure that the tokens got censored
      const changeRecord = logAuditEvent.mock.lastCall[4] as ChangeRecord<ApiKey>;
      expect(changeRecord.token.from).toBeNull();
      expect(changeRecord.token.to).toContain('t0.');
    });

    it('creates an api key with defaults supplied as needed', async () => {
      const testData: CreateApiKeyData = {
        title: 'barebones api key',
      };

      generateApiToken.mockResolvedValue(TEST_API_TOKEN);

      const testApiKey = mockObject<ApiKey>({
        id: TEST_OBJECT_ID,
        token: TEST_API_TOKEN,
        ...testData,
      });
      dbClient.apiKey.create.mockResolvedValue(testApiKey);

      await ApiKeyModel.createApiKey(testUser, testData, testReqCtx);

      expect(dbClient.apiKey.create).toBeCalledWith({
        data: {
          title: testData.title,
          expiresAt: expect.any(Date),
          token: TEST_API_TOKEN,
          ownerId: testUser.id,
        },
      });
    });
  });

  describe(ApiKeyModel.updateApiKey, () => {
    it('updates an api key', async () => {
      const testData: UpdateApiKeyData = {
        title: 'a more flowery title',
      };
      const testApiKey = mockObject<ApiKey>({
        id: TEST_OBJECT_ID,
        token: TEST_API_TOKEN,
        ...testData,
      });
      dbClient.apiKey.update.mockResolvedValue(testApiKey);

      const updated = await ApiKeyModel.updateApiKey(testUser, testApiKey, testData, testReqCtx);

      expect(updated).toBe(testApiKey);
      expect(dbClient.apiKey.update).toBeCalledWith({
        where: {
          id: testApiKey.id,
          ownerId: testUser.id,
        },
        data: {
          ...testData,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.API_KEY_UPDATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );

      // `token` should never be in the changeRecord because it should never be updated
      const changeRecord = logAuditEvent.mock.lastCall[4] as ChangeRecord<ApiKey>;
      expect(changeRecord).not.toHaveProperty('token');
    });
  });

  describe(ApiKeyModel.deleteApiKey, () => {
    it('deletes an api key', async () => {
      const testApiKey = mockObject<ApiKey>({
        id: TEST_OBJECT_ID,
        token: TEST_API_TOKEN,
      });
      dbClient.apiKey.delete.mockResolvedValue(testApiKey);

      const deleted = await ApiKeyModel.deleteApiKey(testUser, testApiKey, testReqCtx);

      expect(deleted).toBe(testApiKey);
      expect(dbClient.apiKey.delete).toBeCalledWith({
        where: {
          id: testApiKey.id,
          ownerId: testUser.id,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.API_KEY_DELETE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );

      // no change record when deleting (and this ensures tokens don't leak)
      const changeRecord = logAuditEvent.mock.lastCall[4] as ChangeRecord<ApiKey>;
      expect(changeRecord).toBeNull();
    });
  });
});
