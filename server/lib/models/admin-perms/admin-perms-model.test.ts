import { vi, expect, describe, it, afterEach } from "vitest";
import { mockObject, TEST_USER_ID } from "testing-support/util";

import _dbClient from '../../db.ts';

import { USER_STATE } from "../user/consts.ts";
import { RecordNotFoundError } from "../errors.ts";

import { AdminPermsModel, type AdminPerms } from "./admin-perms-model.ts";

vi.mock('../tracer.ts');

vi.mock('../../db.ts');
const dbClient = vi.mocked(_dbClient, { deep: true });

describe(AdminPermsModel, () => {
  describe(AdminPermsModel.getAdminPerms, () => {
    afterEach(() => {
      vi.resetAllMocks();
    });

    it('gets admin perms', async () => {
      const testAdminPerms = mockObject<AdminPerms>();
      dbClient.adminPerms.findUnique.mockResolvedValue(testAdminPerms);

      const result = await AdminPermsModel.getAdminPerms(TEST_USER_ID);

      expect(result).toBe(testAdminPerms);
      expect(dbClient.adminPerms.findUnique).toBeCalledWith({
        where: {
          userId: TEST_USER_ID,
          user: { state: USER_STATE.ACTIVE }
        },
      });
    });

    it('throws if there are no perms to get', async () => {
      dbClient.adminPerms.findUnique.mockResolvedValue(null);

      await expect(
        async () => await AdminPermsModel.getAdminPerms(TEST_USER_ID)
      ).rejects.toThrow(RecordNotFoundError);
    });

  });
});