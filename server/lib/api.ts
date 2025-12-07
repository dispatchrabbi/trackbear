import type { Application, IRouter, Router } from 'express';
import type * as z from 'zod';
import { h, type ApiHandler } from './api-response';
import { decorateApiCallSpan, instrumentMiddleware } from './middleware/decorate-span';
import { requirePublic, requireApiKey, requireSession, requireUser, requireAdminUser, requirePrivate } from './middleware/access';
import { validateBody, validateParams, validateQuery } from './middleware/validate';
import { type ValueEnum } from './obj';

import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;
type HttpMethod = ValueEnum<typeof HTTP_METHODS>;

export const ACCESS_LEVEL = {
  /** Requires no authn or authz at all */
  PUBLIC: 'public',
  /** Requires a valid api key to access */
  API_KEY: 'api-key',
  /** Requires a valid session to access */
  SESSION: 'session',
  /** Requires either a valid api key or a valid session to access */
  USER: 'user',
  /** Requires a valid session whose user has admin permissions to access */
  ADMIN: 'admin',
  /** Not accessible in any way by anyone */
  NONE: 'none',
} as const;
type AccessLevel = ValueEnum<typeof ACCESS_LEVEL>;

export type RouteConfig = {
  method: HttpMethod;
  path: string;
  handler: ApiHandler<unknown>;
  accessLevel: AccessLevel;
  paramsSchema?: z.ZodType;
  querySchema?: z.ZodType;
  bodySchema?: z.ZodType;
};

type AllowedExpressMethods = keyof Pick<IRouter, 'get' | 'post' | 'put' | 'patch' | 'delete'>;
const HTTP_METHODS_TO_EXPRESS_METHOD: Record<HttpMethod, AllowedExpressMethods> = {
  [HTTP_METHODS.GET]: 'get',
  [HTTP_METHODS.POST]: 'post',
  [HTTP_METHODS.PUT]: 'put',
  [HTTP_METHODS.PATCH]: 'patch',
  [HTTP_METHODS.DELETE]: 'delete',
};

const ACCESS_LEVEL_TO_MIDDLEWARE = {
  [ACCESS_LEVEL.PUBLIC]: requirePublic,
  [ACCESS_LEVEL.API_KEY]: requireApiKey,
  [ACCESS_LEVEL.SESSION]: requireSession,
  [ACCESS_LEVEL.USER]: requireUser,
  [ACCESS_LEVEL.ADMIN]: requireAdminUser,
  [ACCESS_LEVEL.NONE]: requirePrivate,
};

export function prefixRoutes(prefix: string, routes: RouteConfig[]) {
  const prefixedRoutes = routes.map(route => ({
    ...route,
    path: route.path === '/' ? prefix : prefix + route.path,
  }));

  return prefixedRoutes;
}

export function mountEndpoints(app: Application | Router, routes: RouteConfig[]) {
  for(const route of routes) {
    mountEndpoint(app, route);
  }
}

const mountedEndpoints = new Set();
export function mountEndpoint(app: Application | Router, route: RouteConfig) {
  if(!validatePath(route.path)) {
    throw new Error(`Attempted to mount endpoint on invalid path '${route.path}'`);
  }

  if(!(route.method in HTTP_METHODS_TO_EXPRESS_METHOD)) {
    throw new Error(`Unknown HTTP method '${route.method}' specified for path '${route.path}'`);
  }
  const method = HTTP_METHODS_TO_EXPRESS_METHOD[route.method];

  if(!(route.accessLevel in ACCESS_LEVEL_TO_MIDDLEWARE)) {
    // default to no access
    logger.warn(`Unknown access level (${route.accessLevel}) specified for endpoint '${route.method} ${route.path}'. Defaulting to none...`);
    route.accessLevel = ACCESS_LEVEL.NONE;
  }
  const accessMiddleware = ACCESS_LEVEL_TO_MIDDLEWARE[route.accessLevel];

  const validators = [
    route.paramsSchema && validateParams(route.paramsSchema),
    route.querySchema && validateQuery(route.querySchema),
    route.bodySchema && validateBody(route.bodySchema),
  ].filter(fn => !!fn);

  const routeKey = `${route.method} ${route.path}`;
  if(mountedEndpoints.has(routeKey)) {
    logger.warn(`${routeKey} is already mounted! Overwriting...`);
  } else {
    mountedEndpoints.add(routeKey);
  }

  app[method](
    route.path,
    decorateApiCallSpan({ method, routePath: route.path }),
    instrumentMiddleware(accessMiddleware.name, accessMiddleware),
    // @ts-expect-error
    ...validators.map(valFn => instrumentMiddleware(valFn.name, valFn)),
    instrumentMiddleware(route.handler.name, h(route.handler)),
  );
}

const PATH_PART_REGEX = /^[:]?[a-z0-9-_]+$/i;
function validatePath(path: string) {
  // path must start with /
  if(!path.startsWith('/')) {
    return false;
  }

  // path must not end with /
  if(path.endsWith('/')) {
    return false;
  }

  const parts = path.substring(1).split('/');
  const allPartsValid = parts.every(part => PATH_PART_REGEX.test(part));

  return allPartsValid;
}
