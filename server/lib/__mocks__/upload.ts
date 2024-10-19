import * as upload from '../upload.ts';
import { vi, beforeEach } from 'vitest';
import { mockReset } from 'vitest-mock-extended';
import { mockObject } from './util.ts';

const getAvatarUploadFnMock = vi.spyOn(upload, 'getAvatarUploadFn');
const getAvatarUploadPathMock = vi.spyOn(upload, 'getAvatarUploadPath');

const makeMockUploadFn = function(path: string, mimetype: string) {
  return vi.fn(async (req/*, res */) => {
    req.file = mockObject<typeof req.file>({ path, mimetype });
  });
}

export {
  getAvatarUploadFnMock,
  getAvatarUploadPathMock,
  makeMockUploadFn,
};

beforeEach(() => {
  mockReset(getAvatarUploadFnMock);
  mockReset(getAvatarUploadPathMock);
});
