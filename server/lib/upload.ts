import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import multer from 'multer';
import { getNormalizedEnv } from './env.ts';

import { MAX_AVATAR_SIZE_IN_BYTES } from './models/user/consts.ts';
import { MAX_COVER_SIZE_IN_BYTES } from './models/work/consts.ts';

export async function getAvatarUploadPath() {
  const env = await getNormalizedEnv();
  const avatarPath = path.join(env.UPLOADS_PATH, 'avatars');
  return avatarPath;
}

export async function getCoverUploadPath() {
  const env = await getNormalizedEnv();
  const avatarPath = path.join(env.UPLOADS_PATH, 'covers');
  return avatarPath;
}

export async function createAvatarUploadDirectory() {
  const avatarUploadPath = await getAvatarUploadPath();
  // create the avatar directory if it doesn't exist
  try {
    await fs.mkdir(avatarUploadPath);
  } catch(err) {
    if(err.code !== 'EEXIST') {
      throw err;
    } // else EEXIST means it exists and we're good
  }
}

export async function createCoverUploadDirectory() {
  const avatarUploadPath = await getAvatarUploadPath();
  // create the avatar directory if it doesn't exist
  try {
    await fs.mkdir(avatarUploadPath);
  } catch(err) {
    if(err.code !== 'EEXIST') {
      throw err;
    } // else EEXIST means it exists and we're good
  }
}

let multerStorage: multer.StorageEngine | null = null;
function getMulterStorage(useMemoryStorage = false): multer.StorageEngine {
  if(multerStorage === null) {
    if(useMemoryStorage) {
      multerStorage = multer.memoryStorage();
    } else {
      multerStorage = multer.diskStorage({
        destination: async (req, file, cb) => {
          // create a temporary directory to store files in on upload
          const tbTmpDir = await fs.mkdtemp(path.join(tmpdir(), 'trackbear-'));
          cb(null, tbTmpDir);
        }
      });
    }
  }

  return multerStorage!;
}

export function getAvatarUploadFn() {
  return promisify(multer({
    storage: getMulterStorage(),
    limits: {
      fileSize: MAX_AVATAR_SIZE_IN_BYTES,
    },
  }).single('avatar'));
}

export function getCoverUploadFn() {
  return promisify(multer({
    storage: getMulterStorage(),
    limits: {
      fileSize: MAX_COVER_SIZE_IN_BYTES,
    },
  }).single('cover'));
}