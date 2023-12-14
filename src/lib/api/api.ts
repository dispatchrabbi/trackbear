type ApiResponse<T> = {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
}

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

  const responsePayload = await response.json();

  return {
    success: response.ok,
    status: response.status,
    data: response.ok ? responsePayload : null,
    error: response.ok ? null : responsePayload.message,
  };
}

export {
  callApi
};
