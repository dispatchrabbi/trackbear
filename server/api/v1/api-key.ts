import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from '../../lib/api.ts';
import { ApiResponse, success, failure } from '../../lib/api-response.ts';

import { RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';

import { ApiKeyModel, type ApiKey, type CreateApiKeyData } from '../../lib/models/api-key/api-key-model.ts';
import { censorApiKey } from 'server/lib/api-key.ts';

import { reqCtx } from '../../lib/request-context.ts';

export type { ApiKey };

export async function handleGetApiKeys(req: RequestWithUser, res: ApiResponse<ApiKey[]>) {
  const apiKeys = await ApiKeyModel.getApiKeys(req.user);
  const censoredApiKeys = apiKeys.map(key => censorApiKey(key));

  return res.status(200).send(success(censoredApiKeys));
}

export async function handleGetApiKey(req: RequestWithUser, res: ApiResponse<ApiKey>) {
  const apiKey = await ApiKeyModel.getApiKey(req.user, +req.params.id);

  if(apiKey) {
    const censoredKey = censorApiKey(apiKey);
    return res.status(200).send(success(censoredKey));
  } else {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any api key with id ${req.params.id}.`));
  }
}

export type ApiKeyCreatePayload = {
  name: string;
  expiresAt: Date | null;
};
const zApiKeyCreatePayload = z.object({
  name: z.string().min(1),
  expiresAt: z.coerce.date().nullable(),
});

export async function handleCreateApiKey(req: RequestWithUser, res: ApiResponse<ApiKey>) {
  const user = req.user;
  const payload = req.body as ApiKeyCreatePayload;

  const created = await ApiKeyModel.createApiKey(user, payload as CreateApiKeyData, reqCtx(req));

  // this is the only time we do not censor the token on returning it
  return res.status(201).send(success(created));
}

export async function handleDeleteApiKey(req: RequestWithUser, res: ApiResponse<ApiKey>) {
  const user = req.user;

  const original = await ApiKeyModel.getApiKey(user, +req.params.id);
  if(!original) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any apiKey with id ${req.params.id}.`));
  }

  const deleted = await ApiKeyModel.deleteApiKey(user, original, reqCtx(req));
  const censoredDeleted = censorApiKey(deleted);

  return res.status(200).send(success(censoredDeleted));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetApiKeys,
    accessLevel: ACCESS_LEVEL.SESSION,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.GET,
    handler: handleGetApiKey,
    accessLevel: ACCESS_LEVEL.SESSION,
    paramsSchema: zIdParam(),
  },
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreateApiKey,
    accessLevel: ACCESS_LEVEL.SESSION,
    bodySchema: zApiKeyCreatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteApiKey,
    accessLevel: ACCESS_LEVEL.SESSION,
    paramsSchema: zIdParam(),
  },
];

export default routes;
