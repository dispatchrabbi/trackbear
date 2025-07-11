import { callApiV1, roundTrip, type RoundTrip } from '../api.ts';

import type { ApiKey, ApiKeyCreatePayload } from 'server/api/v1/api-key.ts';
export type { ApiKey, ApiKeyCreatePayload };

const ENDPOINT = '/api/v1/api-key';

export async function getApiKeys(): Promise<ApiKey[]> {
  const result = await callApiV1<RoundTrip<ApiKey>[]>(ENDPOINT, 'GET');
  return result.map(roundTripApiKey);
}

export async function getApiKey(id: number): Promise<ApiKey> {
  const result = await callApiV1<RoundTrip<ApiKey>>(ENDPOINT + `/${id}`, 'GET');
  return roundTripApiKey(result);
}

export async function createApiKey(data: ApiKeyCreatePayload): Promise<ApiKey> {
  const result = await callApiV1<RoundTrip<ApiKey>>(ENDPOINT, 'POST', data);
  return roundTripApiKey(result);
}

export async function deleteApiKey(id: number): Promise<ApiKey> {
  const result = await callApiV1<RoundTrip<ApiKey>>(ENDPOINT + `/${id}`, 'DELETE');
  return roundTripApiKey(result);
}

function roundTripApiKey(apiKey: RoundTrip<ApiKey>): ApiKey {
  return roundTrip(apiKey, ['expiresAt', 'createdAt', 'updatedAt']);
}
