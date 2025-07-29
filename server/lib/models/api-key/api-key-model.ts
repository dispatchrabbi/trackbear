import { addDays } from 'date-fns';

import dbClient from '../../db.ts';
import type { ApiKey } from 'generated/prisma/client';
import type { Create, Update } from '../types.ts';

import { type RequestContext } from '../../request-context.ts';
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import type { User } from '../user/user-model.ts';
import { censorApiKey, generateApiToken } from '../../api-key.ts';
import CONFIG from 'server/config.ts';

import { traced } from '../../metrics/tracer.ts';

export type { ApiKey };

type OptionalFields = 'expiresAt';
type ExcludedFields = 'token' | 'lastUsed';
export type CreateApiKeyData = Create<ApiKey, OptionalFields, ExcludedFields>;
export type UpdateApiKeyData = Update<ApiKey, ExcludedFields>;

export class ApiKeyModel {
  @traced
  static async getApiKeys(owner: User): Promise<ApiKey[]> {
    const keys = await dbClient.apiKey.findMany({
      where: {
        ownerId: owner.id,
      },
    });

    return keys;
  }

  @traced
  static async getApiKey(owner: User, id: number): Promise<ApiKey | null> {
    const key = await dbClient.apiKey.findUnique({
      where: {
        id: id,
        ownerId: owner.id,
      },
    });

    if(!key) {
      return null;
    }

    return key;
  }

  @traced
  static async createApiKey(owner: User, data: CreateApiKeyData, reqCtx: RequestContext): Promise<ApiKey> {
    const now = new Date();
    const dataWithDefaults = Object.assign({
      expiresAt: addDays(now, CONFIG.DEFAULT_API_KEY_EXPIRATION_IN_DAYS),
    }, data);

    const token = await generateApiToken();
    const created = await dbClient.apiKey.create({
      data: {
        ...dataWithDefaults,
        token: token,
        ownerId: owner.id,
      },
    });

    const changes = buildChangeRecord({}, censorApiKey(created));
    await logAuditEvent(AUDIT_EVENT_TYPE.API_KEY_CREATE, reqCtx.userId, created.id, null, changes, reqCtx.sessionId);

    return created;
  }

  @traced
  static async updateApiKey(owner: User, apiKey: ApiKey, data: UpdateApiKeyData, reqCtx: RequestContext): Promise<ApiKey> {
    const updated = await dbClient.apiKey.update({
      where: {
        id: apiKey.id,
        ownerId: owner.id,
      },
      data: { ...data },
    });

    const changes = buildChangeRecord(
      censorApiKey(apiKey),
      censorApiKey(updated),
    );
    await logAuditEvent(AUDIT_EVENT_TYPE.API_KEY_UPDATE, reqCtx.userId, updated.id, null, changes, reqCtx.sessionId);

    return updated;
  }

  @traced
  static async deleteApiKey(owner: User, apiKey: ApiKey, reqCtx: RequestContext): Promise<ApiKey> {
    const deleted = await dbClient.apiKey.delete({
      where: {
        id: apiKey.id,
        ownerId: owner.id,
      },
    });

    await logAuditEvent(AUDIT_EVENT_TYPE.API_KEY_DELETE, reqCtx.userId, deleted.id, null, null, reqCtx.sessionId);

    return deleted;
  }

  @traced
  static async touchApiKey(token: string): Promise<ApiKey> {
    const now = new Date();

    const apiKeyToTouch = await dbClient.apiKey.findFirst({
      where: { token },
    });

    if(!apiKeyToTouch) {
      return null;
    }

    const touched = await dbClient.apiKey.update({
      where: {
        id: apiKeyToTouch.id,
      },
      data: {
        lastUsed: now,
      },
    });

    // no audit event here — we'd be logging one literally every API call along with whatever was actually called
    // plus we're not super interested in this action for auditing

    return touched;
  }
}
