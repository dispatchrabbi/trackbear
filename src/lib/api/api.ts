import type { ApiResponsePayload } from "server/lib/api-response.ts";

type ApiResponse<T> = ApiResponsePayload<T> & { status: number; }

export async function callApi<T>(path: string, method: string = 'GET', payload: object | null = null): Promise<ApiResponse<T>> {
  const headers = {};
  let body = null;

  // until we have to do file uploads, this will suffice for all payloads
  if(payload !== null) {
    body = JSON.stringify(payload);
    headers['Content-Type'] = 'application/json';
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

export async function callApiV1<T>(path: string, method: string = 'GET', payload: object | null = null): Promise<T> {
  const response = await callApi<T>(path, method, payload);

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export function makeCrudFns<Entity extends object, CreatePayload extends object, UpdatePayload extends object = CreatePayload>(entityName: string) {
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
