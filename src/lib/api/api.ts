async function callApi(path: string, method: string = 'GET', payload: object | null = null) {
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

  // anything that's a 400 or 500, just bail
  // TODO: standardize API error response payload somehow
  if(!response.ok) {
    throw new Error(`API: API responded with status code ${response.status} ${response.statusText}`);
  }

  // we should always get a JSON response
  const jsonResponse = await response.json();
  return jsonResponse;
}

export {
  callApi
};
