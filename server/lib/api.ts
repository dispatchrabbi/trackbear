import type { ZodSchema } from "zod";
import { h, type ApiHandler } from "./api-response";
import { requirePublic, requireUser, requireAdminUser, requirePrivate } from "./auth";
import { validateBody, validateParams, validateQuery } from "./middleware/validate";

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;
type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];

export const ACCESS_LEVEL = {
  PUBLIC: 'public',
  USER: 'user',
  ADMIN: 'admin',
  NONE: 'none',
} as const;
type AccessLevel = typeof ACCESS_LEVEL[keyof typeof ACCESS_LEVEL];

type EndpointOptions = {
  method: HttpMethod;
  accessLevel?: AccessLevel;
  paramsSchema?: ZodSchema;
  querySchema?: ZodSchema;
  bodySchema?: ZodSchema;
};

const HTTP_METHODS_TO_EXPRESS_METHOD: Record<HttpMethod, string> = {
  [HTTP_METHODS.GET]: 'get',
  [HTTP_METHODS.POST]: 'post',
  [HTTP_METHODS.PUT]: 'put',
  [HTTP_METHODS.PATCH]: 'patch',
  [HTTP_METHODS.DELETE]: 'delete',
};

const ACCESS_LEVEL_TO_MIDDLEWARE = {
  [ACCESS_LEVEL.PUBLIC]: requirePublic,
  [ACCESS_LEVEL.USER]: requireUser,
  [ACCESS_LEVEL.ADMIN]: requireAdminUser,
  [ACCESS_LEVEL.NONE]: requirePrivate,
};

export function mountEndpoint<ResponseShape>(app: Express.Application, path: string, handler: ApiHandler<ResponseShape>, options: EndpointOptions): void {
  if(!path.startsWith('/')) {
    throw new Error(`Attempted to mount endpoint on invalid path '${path}'`);
  }

  if(!(options.method in HTTP_METHODS_TO_EXPRESS_METHOD)) {
    throw new Error(`Unknown HTTP method '${options.method}' specified for path '${path}'`);
  }
  const method = HTTP_METHODS_TO_EXPRESS_METHOD[options.method];

  if((!options.accessLevel) || !(options.accessLevel in ACCESS_LEVEL_TO_MIDDLEWARE)) {
    // default to no access
    options.accessLevel = ACCESS_LEVEL.NONE;
  }
  const accessMiddleware = ACCESS_LEVEL_TO_MIDDLEWARE[options.accessLevel];

  const validators = [
    options.paramsSchema && validateParams(options.paramsSchema),
    options.querySchema && validateQuery(options.querySchema),
    options.bodySchema && validateBody(options.bodySchema)
  ].filter(v => !!v);

  app[method](
    path,
    accessMiddleware,
    ...validators,
    h(handler),
  );
}