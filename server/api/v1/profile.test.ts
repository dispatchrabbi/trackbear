import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser } from '../../lib/__mocks__/express.ts';

import * as profileModel from "../../lib/models/profile.ts";

import { handleGetProfile } from './profile.ts';

describe('profile api v1', () => {

  const getUserProfileSpy = vi.spyOn(profileModel, 'getUserProfile');

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(handleGetProfile, () => {
    it('returns a profile if the user has profiles turned on', async () => {
      getUserProfileSpy.mockResolvedValue(mockObject<profileModel.PublicProfile>());

      const { req, res } = getHandlerMocksWithUser();
      await handleGetProfile(req, res);

      expect(getUserProfileSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns a 404 if the user has profiles turned off', async () => {
      getUserProfileSpy.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetProfile(req, res);

      expect(getUserProfileSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });
})