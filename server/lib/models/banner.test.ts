import { vi, expect, describe, it, afterEach, beforeEach, MockInstance } from "vitest";
import { mockObject, mockObjects, TEST_OBJECT_ID, getTestReqCtx } from "testing-support/util";

import { BannerModel, type Banner, type BannerData } from "./banner.ts";

vi.mock('../tracer.ts');

import _dbClient from '../db.ts';
vi.mock('../db.ts');
const dbClient = vi.mocked(_dbClient, { deep: true });

import { logAuditEvent as _logAuditEvent } from '../audit-events.ts';
import { AUDIT_EVENT_TYPE } from "./audit-event/consts.ts";
vi.mock('../audit-events.ts');
const logAuditEvent = vi.mocked(_logAuditEvent);

describe(BannerModel, () => {
  afterEach(() => {
    vi.resetAllMocks();
  })

  describe(BannerModel.getBanners, () => {
    it('gets banners', async () => {
      const testBanners = mockObjects<Banner>(4);
      dbClient.banner.findMany.mockResolvedValue(testBanners);

      const results = await BannerModel.getBanners();

      expect(results).toBe(testBanners);
      expect(dbClient.banner.findMany).toBeCalled();
    });
  });

  describe(BannerModel.getActiveBanners, () => {
    it('gets active banners', async () => {
      const testBanners = mockObjects<Banner>(4);
      dbClient.banner.findMany.mockResolvedValue(testBanners);

      const results = await BannerModel.getActiveBanners();

      expect(results).toBe(testBanners);
      expect(dbClient.banner.findMany).toBeCalledWith(expect.objectContaining({
        where: {
          enabled: true,
          showUntil: { gte: expect.any(Date) }
        },
      }));
    });
  });

  describe(BannerModel.getBanner, () => {
    it('gets a banner', async () => {
      const testBanner = mockObject<Banner>();
      dbClient.banner.findUnique.mockResolvedValue(testBanner);

      const results = await BannerModel.getBanner(TEST_OBJECT_ID);

      expect(results).toBe(testBanner);
      expect(dbClient.banner.findUnique).toBeCalledWith({
        where: { id: TEST_OBJECT_ID }
      });
    });

    it('returns null if does not find a banner', async () => {
      dbClient.banner.findUnique.mockResolvedValue(null);

      const results = await BannerModel.getBanner(TEST_OBJECT_ID);

      expect(results).toBe(null);
    });
  });

  describe(BannerModel.createBanner, () => {
    it('creates a banner with the data given', async () => {
      const reqCtx = getTestReqCtx();
      const testBannerData: BannerData = {
        message: 'This is a test banner',
        enabled: true,
        showUntil: new Date(),
        icon: 'fake-icon',
        color: 'danger',
      };
      const testBanner = mockObject<Banner>({ id: TEST_OBJECT_ID, ...testBannerData });
      dbClient.banner.create.mockResolvedValue(testBanner);

      const created = await BannerModel.createBanner(testBannerData, reqCtx);

      expect(created).toBe(testBanner);
      expect(dbClient.banner.create).toBeCalledWith({
        data: testBannerData
      });

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.BANNER_CREATE,
        reqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), reqCtx.sessionId
      );
    });

    it('uses the appropriate defaults if none are given', async () => {
      const reqCtx = getTestReqCtx();
      const testBannerData: BannerData = {
        message: 'This is a test banner',
      };
      const testBanner = mockObject<Banner>({ id: TEST_OBJECT_ID, ...testBannerData });
      dbClient.banner.create.mockResolvedValue(testBanner);

      const created = await BannerModel.createBanner(testBannerData, reqCtx);

      expect(created).toBe(testBanner);
      expect(dbClient.banner.create).toBeCalledWith({
        data: {
          message: testBannerData.message,
          enabled: false,
          showUntil: expect.any(Date),
          icon: 'campaign',
          color: 'info',
        }
      });

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.BANNER_CREATE,
        reqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), reqCtx.sessionId
      );
    });
  });

  describe(BannerModel.updateBanner, () => {
    let getBannerMock: MockInstance<typeof BannerModel.getBanner>;

    beforeEach(() => {
      getBannerMock = vi.spyOn(BannerModel, 'getBanner').mockResolvedValue(mockObject<Banner>({ id: TEST_OBJECT_ID }));
    });

    afterEach(() => {
      getBannerMock.mockRestore();
    });

    it('updates a banner', async () => {
      const reqCtx = getTestReqCtx();
      const testBannerData: BannerData = {
        message: 'This is a test banner',
        color: 'success',
      };
      const testBanner = mockObject<Banner>({ id: TEST_OBJECT_ID, ...testBannerData });
      dbClient.banner.update.mockResolvedValue(testBanner);

      const updated = await BannerModel.updateBanner(TEST_OBJECT_ID, testBannerData, reqCtx);

      expect(updated).toBe(testBanner);
      expect(dbClient.banner.update).toBeCalledWith({
        where: { id: TEST_OBJECT_ID },
        data: testBannerData,
      });

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.BANNER_UPDATE,
        reqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), reqCtx.sessionId
      );
    });

    it('returns null if there was no banner to update', async () => {
      const reqCtx = getTestReqCtx();
      const testBannerData: BannerData = {
        message: 'This is a test banner',
        color: 'success',
      };
      getBannerMock.mockResolvedValue(null);
      
      const updated = await BannerModel.updateBanner(TEST_OBJECT_ID, testBannerData, reqCtx);

      expect(updated).toBe(null);
      expect(dbClient.banner.update).not.toBeCalled();

      expect(logAuditEvent).not.toBeCalled();
    });
  });

  describe(BannerModel.deleteBanner, () => {
    let getBannerMock: MockInstance<typeof BannerModel.getBanner>;

    beforeEach(() => {
      getBannerMock = vi.spyOn(BannerModel, 'getBanner').mockResolvedValue(mockObject<Banner>({ id: TEST_OBJECT_ID }));
    });

    afterEach(() => {
      getBannerMock.mockRestore();
    });

    it('deletes a banner', async () => {
      const reqCtx = getTestReqCtx();
      const testBanner = mockObject<Banner>({ id: TEST_OBJECT_ID });
      dbClient.banner.delete.mockResolvedValue(testBanner);

      const deleted = await BannerModel.deleteBanner(TEST_OBJECT_ID, reqCtx);

      expect(deleted).toBe(testBanner);
      expect(dbClient.banner.delete).toBeCalledWith({
        where: { id: TEST_OBJECT_ID }
      });

      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.BANNER_DELETE,
        reqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), reqCtx.sessionId
      );
    });

    it('returns null if there was no banner to delete', async () => {
      const reqCtx = getTestReqCtx();
      getBannerMock.mockResolvedValue(null);
      
      const deleted = await BannerModel.deleteBanner(TEST_OBJECT_ID, reqCtx);

      expect(deleted).toBe(null);
      expect(dbClient.banner.delete).not.toBeCalled();

      expect(logAuditEvent).not.toBeCalled();
    });
  });
});