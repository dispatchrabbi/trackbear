import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, mockObjects, TEST_OBJECT_ID, TEST_API_TOKEN, TEST_USER_ID } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser } from '../../lib/__mocks__/express.ts';

import { success } from 'server/lib/api-response.ts';

vi.mock('../../lib/models/api-key/api-key-model.ts');
import { ApiKeyModel as _ApiKeyModel, type ApiKey } from '../../lib/models/api-key/api-key-model.ts';
const ApiKeyModel = vi.mocked(_ApiKeyModel, { deep: true });

import { handleGetApiKeys, handleGetApiKey, handleCreateApiKey, handleDeleteApiKey } from './api-key.ts';
import { censorApiKey } from 'server/lib/api-key.ts';

describe('api key api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(handleGetApiKeys, () => {
    it('returns api keys', async () => {
      const testApiKeys = mockObjects<ApiKey>(3, generateFakeApiKey);
      ApiKeyModel.getApiKeys.mockResolvedValue(testApiKeys);

      const testCensoredApiKeys = testApiKeys.map(censorApiKey);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetApiKeys(req, res);

      expect(ApiKeyModel.getApiKeys).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success(testCensoredApiKeys));
    });
  });

  describe(handleGetApiKey, () => {
    it('returns an api key if it finds one', async () => {
      const testApiKey = mockObject<ApiKey>(generateFakeApiKey());
      ApiKeyModel.getApiKey.mockResolvedValue(testApiKey);

      const testCensoredApiKey = censorApiKey(testApiKey);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetApiKey(req, res);

      expect(ApiKeyModel.getApiKey).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success(testCensoredApiKey));
    });

    it(`returns a 404 if the api key doesn't exist`, async () => {
      ApiKeyModel.getApiKey.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetApiKey(req, res);

      expect(ApiKeyModel.getApiKey).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleCreateApiKey, () => {
    it('creates an api key', async () => {
      const testApiKey = mockObject<ApiKey>(generateFakeApiKey());
      ApiKeyModel.createApiKey.mockResolvedValue(testApiKey);

      const { req, res } = getHandlerMocksWithUser({
        body: {
          works: [],
          tags: [],
        },
      });
      await handleCreateApiKey(req, res);

      expect(ApiKeyModel.createApiKey).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(success(testApiKey));
    });
  });

  describe(handleDeleteApiKey, () => {
    it(`deletes an api key if it exists`, async () => {
      const testApiKey = mockObject<ApiKey>(generateFakeApiKey());
      ApiKeyModel.getApiKey.mockResolvedValue(testApiKey);
      ApiKeyModel.deleteApiKey.mockResolvedValue(testApiKey);

      const testCensoredApiKey = censorApiKey(testApiKey);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleDeleteApiKey(req, res);

      expect(ApiKeyModel.getApiKey).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(ApiKeyModel.deleteApiKey).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success(testCensoredApiKey));
    });

    it(`returns 404 when deleting an api key that doesn't exist`, async () => {
      ApiKeyModel.getApiKey.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleDeleteApiKey(req, res);

      expect(ApiKeyModel.getApiKey).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(ApiKeyModel.deleteApiKey).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });
});

function generateFakeApiKey(i = 0): ApiKey {
  const now = new Date();
  return {
    id: TEST_OBJECT_ID - i,
    ownerId: TEST_USER_ID,
    name: 'Fake API Key',
    token: TEST_API_TOKEN,
    expiresAt: now,
    lastUsed: null,
    createdAt: now,
    updatedAt: now,
  };
}
