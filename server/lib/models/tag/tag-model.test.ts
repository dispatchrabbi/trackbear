import { vi, expect, describe, it, afterEach, beforeEach, type MockInstance } from 'vitest';
import { getTestReqCtx, mockObject, mockObjects, TEST_OBJECT_ID, TEST_SESSION_ID, TEST_USER_ID } from 'testing-support/util';

import { TagModel, type Tag, type TagData } from './tag-model.ts';
import { type User } from '../user/user-model.ts';
import { ValidationError } from '../errors.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';
import { TAG_DEFAULT_COLOR, TAG_STATE } from './consts.ts';

vi.mock('../../tracer.ts');

import { getDbClient } from 'server/lib/db.ts';
vi.mock('server/lib/db.ts');
const db = vi.mocked(getDbClient(), { deep: true });

import { logAuditEvent as _logAuditEvent } from '../../audit-events.ts';
vi.mock('../../audit-events.ts');
const logAuditEvent = vi.mocked(_logAuditEvent);

describe(TagModel, () => {
  const testOwner = mockObject<User>({ id: TEST_USER_ID });
  const testReqCtx = getTestReqCtx();

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(TagModel.getTags, () => {
    it('gets a list of tags', async () => {
      const testTags = mockObjects<Tag>(4);
      db.tag.findMany.mockResolvedValue(testTags);

      const tags = await TagModel.getTags(testOwner);

      expect(tags).toBe(testTags);
      expect(db.tag.findMany).toBeCalledWith({
        where: {
          ownerId: testOwner.id,
          state: TAG_STATE.ACTIVE,
        },
      });
    });
  });

  describe(TagModel.getTag, () => {
    it('gets a tag by its id', async () => {
      const testTag = mockObject<Tag>({ id: TEST_OBJECT_ID });
      db.tag.findUnique.mockResolvedValue(testTag);

      const tag = await TagModel.getTag(testOwner, TEST_OBJECT_ID);

      expect(tag).toBe(testTag);
      expect(db.tag.findUnique).toBeCalledWith({
        where: {
          id: TEST_OBJECT_ID,
          ownerId: testOwner.id,
          state: TAG_STATE.ACTIVE,
        },
      });
    });

    it('returns null if there is no tag with that id', async () => {
      db.tag.findUnique.mockResolvedValue(null);

      const tag = await TagModel.getTag(testOwner, TEST_OBJECT_ID);

      expect(tag).toBeNull();
    });
  });

  describe(TagModel.getTagByName, () => {
    it('gets a tag by its name', async () => {
      const testName = 'fake tag';
      const testTag = mockObject<Tag>({ id: TEST_OBJECT_ID, name: testName });
      db.tag.findMany.mockResolvedValue([testTag]);

      const tag = await TagModel.getTagByName(testOwner, testName);

      expect(tag).toBe(testTag);
      expect(db.tag.findMany).toBeCalledWith({
        where: {
          name: testName,
          ownerId: testOwner.id,
          state: TAG_STATE.ACTIVE,
        },
      });
    });

    it('returns only the first tag if (for some reason) there are multiple tags with that name', async () => {
      const testName = 'fake tag';
      const testTag = mockObject<Tag>({ id: TEST_OBJECT_ID, name: testName });
      db.tag.findMany.mockResolvedValue([
        testTag,
        ...mockObjects<Tag>(2),
      ]);

      const tag = await TagModel.getTagByName(testOwner, testName);

      expect(tag).toBe(testTag);
    });

    it('returns null if there are no tags with that name', async () => {
      db.tag.findMany.mockResolvedValue([]);

      const tag = await TagModel.getTagByName(testOwner, 'no matches');

      expect(tag).toBeNull();
    });
  });

  describe(TagModel.validateTagName, () => {
    let getTagByNameMock: MockInstance<typeof TagModel.getTagByName>;

    beforeEach(() => {
      getTagByNameMock = vi.spyOn(TagModel, 'getTagByName');
    });

    afterEach(() => {
      getTagByNameMock.mockRestore();
    });

    it('returns the given name if valid', async () => {
      const testName = 'this is a valid tag';
      getTagByNameMock.mockResolvedValue(null);

      const name = await TagModel.validateTagName(testOwner, testName);

      expect(name).toBe(testName);
      expect(getTagByNameMock).toBeCalledWith(testOwner, testName);
    });

    it('passes validation if the existing tag has the same ID as the exception', async () => {
      const testName = 'this tag matches';
      getTagByNameMock.mockResolvedValue(mockObject<Tag>({ id: TEST_OBJECT_ID, name: testName }));

      const name = await TagModel.validateTagName(testOwner, testName, TEST_OBJECT_ID);

      expect(name).toBe(testName);
      expect(getTagByNameMock).toBeCalledWith(testOwner, testName);
    });

    it('throws an error if invalid', async () => {
      const testName = 'this is an invalid tag';
      getTagByNameMock.mockResolvedValue(mockObject<Tag>({ name: testName }));

      await expect(async () => {
        await TagModel.validateTagName(testOwner, testName);
      }).rejects.toThrow(ValidationError);

      expect(getTagByNameMock).toBeCalledWith(testOwner, testName);
    });
  });

  describe(TagModel.createTag, () => {
    let validateTagNameMock: MockInstance<typeof TagModel.validateTagName>;

    beforeEach(() => {
      validateTagNameMock = vi.spyOn(TagModel, 'validateTagName').mockImplementation(async (owner, name) => name);
    });

    afterEach(() => {
      validateTagNameMock.mockRestore();
    });

    it('creates a tag', async () => {
      const testData: TagData = {
        name: 'new tag',
        color: 'purple',
      };
      const testTag = mockObject<Tag>({ id: TEST_OBJECT_ID });
      db.tag.create.mockResolvedValue(testTag);

      const created = await TagModel.createTag(testOwner, testData, testReqCtx);

      expect(created).toBe(testTag);
      expect(validateTagNameMock).toBeCalledWith(testOwner, testData.name);
      expect(db.tag.create).toBeCalledWith({
        data: {
          name: testData.name,
          color: testData.color,
          state: TAG_STATE.ACTIVE,
          ownerId: testOwner.id,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.TAG_CREATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), TEST_SESSION_ID,
      );
    });

    it('creates a tag with defaults supplied when needed', async () => {
      const testData: TagData = {
        name: 'new tag',
      };
      const testTag = mockObject<Tag>({ id: TEST_OBJECT_ID });
      db.tag.create.mockResolvedValue(testTag);

      await TagModel.createTag(testOwner, testData, testReqCtx);

      expect(db.tag.create).toBeCalledWith({
        data: {
          name: testData.name,
          color: TAG_DEFAULT_COLOR,
          state: TAG_STATE.ACTIVE,
          ownerId: testOwner.id,
        },
      });
    });
  });

  describe(TagModel.updateTag, () => {
    let validateTagNameMock: MockInstance<typeof TagModel.validateTagName>;

    beforeEach(() => {
      validateTagNameMock = vi.spyOn(TagModel, 'validateTagName').mockImplementation(async (owner, name) => name);
    });

    afterEach(() => {
      validateTagNameMock.mockRestore();
    });

    it('updates a tag', async () => {
      const testData: Partial<TagData> = {
        color: 'white',
      };
      const testTag = mockObject<Tag>({ id: TEST_OBJECT_ID });
      db.tag.update.mockResolvedValue(testTag);

      const updated = await TagModel.updateTag(testOwner, testTag, testData, testReqCtx);

      expect(updated).toBe(testTag);
      expect(db.tag.update).toBeCalledWith({
        where: {
          id: testTag.id,
          ownerId: testOwner.id,
        },
        data: {
          color: testData.color,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.TAG_UPDATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), TEST_SESSION_ID,
      );
    });

    it('validates the name before updating', async () => {
      const testData: Partial<TagData> = {
        name: 'needs validation',
      };
      const testTag = mockObject<Tag>({ id: TEST_OBJECT_ID });
      db.tag.update.mockResolvedValue(testTag);

      await TagModel.updateTag(testOwner, testTag, testData, testReqCtx);

      expect(validateTagNameMock).toBeCalledWith(testOwner, testData.name, testTag.id);
    });
  });

  describe(TagModel.deleteTag, () => {
    it('deletes a tag', async () => {
      const testTag = mockObject<Tag>({ id: TEST_OBJECT_ID });
      db.tag.delete.mockResolvedValue(testTag);

      const deleted = await TagModel.deleteTag(testOwner, testTag, testReqCtx);

      expect(deleted).toBe(testTag);
      expect(db.tag.delete).toBeCalledWith({
        where: {
          id: testTag.id,
          ownerId: testOwner.id,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.TAG_DELETE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), TEST_SESSION_ID,
      );
    });
  });
});
