import type { ApiResponsePayload } from "server/lib/api-response.ts";

type ApiResponse<T> = ApiResponsePayload<T> & { status: number; }

async function callApi<T>(path: string, method: string = 'GET', payload: object | null = null): Promise<ApiResponse<T>> {
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

export {
  callApi
};
