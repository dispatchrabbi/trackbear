import * as _hash from '../hash';
import { vi, beforeEach, afterEach } from 'vitest';

const MOCK_HASHED_PASSWORD = 'hash-browns-rule';
const MOCK_SALT = 'always-taste-test-first';

const hashMock = vi.spyOn(_hash, 'hash');
const verifyHashMock = vi.spyOn(_hash, 'verifyHash');

beforeEach(() => {
  hashMock.mockResolvedValue({
    hashedPassword: MOCK_HASHED_PASSWORD,
    salt: MOCK_SALT,
  });

  verifyHashMock.mockResolvedValue(true);
});

afterEach(() => {
  hashMock.mockReset();
  verifyHashMock.mockReset();
});

const hash = hashMock;
const verifyHash = verifyHashMock;

export {
  MOCK_HASHED_PASSWORD,
  MOCK_SALT,
  hash,
  verifyHash,
};