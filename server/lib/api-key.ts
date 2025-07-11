import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
const randomBytesAsPromised = promisify(randomBytes);

import { encode } from 'b36';

import { type ApiKey } from './models/api-key/api-key-model.ts';

const API_TOKEN_LENGTH = 24;

export async function generateApiToken() {
  const random = await randomBytesAsPromised(API_TOKEN_LENGTH);
  const encoded = encode(random);

  return 'tb.' + encoded;
}

export function censorApiKey(apiKey: ApiKey): ApiKey {
  if(apiKey === null) {
    return null;
  }

  const censoredApiKey = {
    ...apiKey,
    token: 't0.' + '0'.repeat(apiKey.token.length - 3),
  };
  return censoredApiKey;
}
