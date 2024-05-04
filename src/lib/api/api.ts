import qs from 'qs';

import type { ApiResponsePayload } from "server/lib/api-response.ts";
type ApiResponse<T> = ApiResponsePayload<T> & { status: number; }

export type DateString = string;
// this type lets us turn server-side objects into client-side objects that have been through JSON.parse(JSON.stringify())
export type RoundTrip<T extends object> = {
  [K in keyof T]: T[K] extends Date ? DateString : T[K]
};

export async function callApi<T>(path: string, method: string = 'GET', payload: Record<string, unknown> | FormData | null = null, query: object | null = null): Promise<ApiResponse<T>> {
  const headers = {};
  let body = null;

  if(payload instanceof FormData) {
    body = payload;
    // do not set Content-Type; this allows fetch to set the multipart/form-data boundary itself
  } else if(payload !== null) {
    body = JSON.stringify(payload);
    headers['Content-Type'] = 'application/json';
  }

  if(query !== null) {
    path += '?' + qs.stringify(query, { arrayFormat: 'comma', encode: false });
  }

  const response = await fetch(path, {
    method,
    headers,
    body,
  });

  const responsePayload: ApiResponsePayload<T> = await response.json();

  return {
    ...responsePayload,
    status: response.status,
  };
}

export async function callApiV1<T>(path: string, method: string = 'GET', payload: Record<string, unknown> | FormData | null = null, query: object | null = null): Promise<T> {
  const response = await callApi<T>(path, method, payload, query);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export function makeCrudFns<Entity extends object, CreatePayload extends Record<string, unknown>, UpdatePayload extends Record<string, unknown> = CreatePayload>(entityName: string) {
  const path = `/api/v1/${entityName}`;
  return {
    getAll: async function() {
      return callApiV1<Entity[]>(path, 'GET');
    },
    get: async function(id: number) {
      return callApiV1<Entity>(path + `/${id}`, 'GET');
    },
    create: async function(data: CreatePayload) {
      return callApiV1<Entity>(path, 'POST', data);
    },
    update: async function(id: number, data: UpdatePayload) {
      return callApiV1<Entity>(path + `/${id}`, 'PUT', data);
    },
    delete: async function(id: number) {
      return callApiV1<Entity>(path + `/${id}`, 'DELETE');
    },
  };
}
