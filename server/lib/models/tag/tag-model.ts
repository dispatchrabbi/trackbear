import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import { getDbClient } from 'server/lib/db.ts';
import { type Tag } from 'generated/prisma/client';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import type { User } from '../user/user-model.ts';
import { TAG_DEFAULT_COLOR, TAG_STATE, type TagColor } from './consts';

import { traced } from '../../metrics/tracer.ts';
import { ValidationError } from '../errors.ts';
import { supplyDefaults } from '../helpers.ts';

export type { Tag };
export type TagData = {
  name: string;
  color?: TagColor;
};

export class TagModel {
  @traced
  static async getTags(owner: User): Promise<Tag[]> {
    const db = getDbClient();
    const tags = await db.tag.findMany({
      where: {
        ownerId: owner.id,
        state: TAG_STATE.ACTIVE,
      },
    });

    return tags;
  }

  @traced
  static async getTag(owner: User, id: number): Promise<Tag | null> {
    const db = getDbClient();
    const tag = await db.tag.findUnique({
      where: {
        id: id,
        ownerId: owner.id,
        state: TAG_STATE.ACTIVE,
      },
    });

    if(!tag) {
      return null;
    }

    return tag;
  }

  @traced
  static async getTagByName(owner: User, name: string): Promise<Tag | null> {
    const db = getDbClient();
    const tags = await db.tag.findMany({
      where: {
        name: name,
        ownerId: owner.id,
        state: TAG_STATE.ACTIVE,
      },
    });

    if(tags.length === 0) {
      return null;
    }

    if(tags.length > 1) {
      logger.warn(`Found more than one tag belonging to ${owner.id} with name ${name}: ${tags.map(tag => tag.id).join(', ')}`);
    }

    return tags[0];
  }

  @traced
  static async validateTagName(owner: User, name: string, exceptTagId: number | null = null): Promise<string> {
    const existingTagWithThatName = await this.getTagByName(owner, name);
    if(existingTagWithThatName && existingTagWithThatName.id !== exceptTagId) {
      throw new ValidationError('tag', 'name', 'A tag with that name already exists');
    }

    return name;
  }

  @traced
  static async createTag(owner: User, data: TagData, reqCtx: RequestContext): Promise<Tag> {
    data.name = await this.validateTagName(owner, data.name);

    const dataWithDefaults = supplyDefaults(data, {
      color: TAG_DEFAULT_COLOR,
    });

    const db = getDbClient();
    const created = await db.tag.create({
      data: {
        ...dataWithDefaults,
        state: TAG_STATE.ACTIVE,
        ownerId: owner.id,
      },
    });

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(AUDIT_EVENT_TYPE.TAG_CREATE, reqCtx.userId, created.id, null, changes, reqCtx.sessionId);

    return created;
  }

  @traced
  static async updateTag(owner: User, tag: Tag, data: Partial<TagData>, reqCtx: RequestContext): Promise<Tag> {
    if('name' in data) {
      data.name = await this.validateTagName(owner, data.name!, tag.id);
    }

    const db = getDbClient();
    const updated = await db.tag.update({
      where: {
        id: tag.id,
        ownerId: owner.id,
      },
      data: { ...data },
    });

    const changes = buildChangeRecord(tag, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.TAG_UPDATE, reqCtx.userId, updated.id, null, changes, reqCtx.sessionId);

    return updated;
  }

  @traced
  static async deleteTag(owner: User, tag: Tag, reqCtx: RequestContext): Promise<Tag> {
    const db = getDbClient();
    const deleted = await db.tag.delete({
      where: {
        id: tag.id,
        ownerId: owner.id,
      },
    });

    const changes = buildChangeRecord(tag, deleted);
    await logAuditEvent(AUDIT_EVENT_TYPE.TAG_DELETE, reqCtx.userId, deleted.id, null, changes, reqCtx.sessionId);

    return deleted;
  }
}
