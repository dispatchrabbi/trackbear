import type { Application, Router } from "express";
import type { ZodSchema } from "zod";
import winston from "winston";
import { h, type ApiHandler } from "./api-response";
import { decorateApiCallSpan, instrumentMiddleware } from "./middleware/decorate-span";
import { requirePublic, requireUser, requireAdminUser, requirePrivate } from "./middleware/access";
import { validateBody, validateParams, validateQuery } from "./middleware/validate";
import { ValueEnum } from "./obj";

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;
type HttpMethod = ValueEnum<typeof HTTP_METHODS>;

export const ACCESS_LEVEL = {
  PUBLIC: 'public',
  USER: 'user',
  ADMIN: 'admin',
  NONE: 'none',
} as const;
type AccessLevel = ValueEnum<typeof ACCESS_LEVEL>;

export type RouteConfig = {
  method: HttpMethod;
  path: string;
  handler: ApiHandler<unknown>
  accessLevel: AccessLevel;
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
    route.accessLevel = ACCESS_LEVEL.NONE;
  }
  const accessMiddleware = ACCESS_LEVEL_TO_MIDDLEWARE[route.accessLevel];

  const validators = [
    route.paramsSchema && validateParams(route.paramsSchema),
    route.querySchema && validateQuery(route.querySchema),
    route.bodySchema && validateBody(route.bodySchema)
  ].filter(fn => !!fn);

  const routeKey = `${route.method} ${route.path}`;
  if(mountedEndpoints.has(routeKey)) {
    winston.warn(`${routeKey} is already mounted! Overwriting...`);
  } else {
    mountedEndpoints.add(routeKey);
  }

  app[method](
    route.path,
    decorateApiCallSpan({ method, routePath: route.path }),
    instrumentMiddleware(accessMiddleware.name, accessMiddleware),
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