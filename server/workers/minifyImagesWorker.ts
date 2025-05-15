import path from 'node:path';
import fs from 'node:fs/promises';

import sharp from 'sharp';
import dbClient from '../lib/db.ts';
import winston from 'winston';

import { getNormalizedEnv } from 'server/lib/env.ts';

const NAME = 'optimizeUploadsWorker';

const DRY_RUN: boolean = false;
const SHOULD_PRUNE: boolean = true;
const SHOULD_OPTIMIZE: boolean = false;

// run every day at 3:24 (time chosen at random)
const CRONTAB = '24 3 * * *';

const LOSSLESS_FILE_TYPES = ['avif', 'gif', 'png', 'webp'];
const LOSSLESS_OUTPUT_OPTIONS = { webp: { lossless: true, effort: 6 } };
const LOSSY_FILE_TYPES = ['jpeg', 'jpg'];
const LOSSY_OUTPUT_OPTIONS = { webp: { quality: 100, effort: 6 } };

const OPTIMIZED_TAG = 'min';

async function run() {
  const workerLogger = winston.loggers.get('worker');
  workerLogger.debug(`Worker has started`, { service: NAME });

  if(SHOULD_PRUNE) {
    await pruneAvatars(workerLogger);
    await pruneCovers(workerLogger);
  }

  if(SHOULD_OPTIMIZE) {
    await optimizeAvatars(workerLogger);
    await optimizeCovers(workerLogger);
  }
}

async function pruneAvatars(workerLogger: winston.Logger) {
  const env = await getNormalizedEnv();
  const avatarsDir = path.join(env.UPLOADS_PATH, 'avatars');

  const dbExistingAvatars = await dbClient.user.findMany({
    select: { avatar: true },
    where: { avatar: { not: null } },
    distinct: 'avatar',
  });
  const existingAvatars = dbExistingAvatars.map(record => record.avatar);

  await pruneUploads(avatarsDir, existingAvatars, workerLogger);
}

async function pruneCovers(workerLogger: winston.Logger) {
  const env = await getNormalizedEnv();
  const coversDir = path.join(env.UPLOADS_PATH, 'covers');

  const dbExistingCovers = await dbClient.work.findMany({
    select: { cover: true },
    where: { cover: { not: null } },
    distinct: 'cover',
  });
  const existingCovers = dbExistingCovers.map(record => record.cover);

  await pruneUploads(coversDir, existingCovers, workerLogger);
}

async function pruneUploads(directory: string, filesNotToPrune: string[], workerLogger: winston.Logger) {
  const allImagesInFolder = await getAllImagesInFolder(directory);
  workerLogger.debug(`Found ${allImagesInFolder.length} images in ${directory} (${filesNotToPrune.length} should not be pruned.)`, { service: NAME });
  const imagesToPrune = allImagesInFolder.filter(filename => !filesNotToPrune.includes(filename));
  workerLogger.info(`About to prune ${imagesToPrune.length} images from ${directory}...`, { service: NAME });

  for(const imageFilename of imagesToPrune) {
    const imagePath = path.join(directory, imageFilename);

    workerLogger.info(`Pruning ${imagePath}`, { service: NAME });
    if(!DRY_RUN) {
      await fs.unlink(imagePath);
    }
  }
}

async function getAllImagesInFolder(path: string) {
  const filenames = await fs.readdir(path);

  const unoptimized = filenames.filter(filename => {
    const parts = filename.split('.');
    return isValidFormat(parts.at(-1)); // is it a valid file type?;
  });

  return unoptimized;
}

async function optimizeAvatars(workerLogger: winston.Logger) {
  const env = await getNormalizedEnv();
  const avatarsDir = path.join(env.UPLOADS_PATH, 'avatars');

  await optimizeImagesInDirectory(avatarsDir, workerLogger, async function(oldFilename, newFilename) {
    if(!DRY_RUN) {
      await dbClient.user.updateMany({
        data: { avatar: newFilename },
        where: { avatar: oldFilename },
      });
    }
  });
}

async function optimizeCovers(workerLogger: winston.Logger) {
  const env = await getNormalizedEnv();
  const coversDir = path.join(env.UPLOADS_PATH, 'covers');

  await optimizeImagesInDirectory(coversDir, workerLogger, async function(oldFilename, newFilename) {
    if(!DRY_RUN) {
      await dbClient.work.updateMany({
        data: { cover: newFilename },
        where: { cover: oldFilename },
      });
    }
  });
}

type OnOptimizeImageCallback = (oldFilename: string, newFilename: string) => Promise<void>;

async function optimizeImagesInDirectory(directory: string, workerLogger: winston.Logger, onOptimizeImage: OnOptimizeImageCallback) {
  const imagesToOptimize = await getUnoptimizedImagesInFolder(directory);
  workerLogger.info(`About to optimize ${imagesToOptimize.length} images from ${directory}...`, { service: NAME });

  for(const imageFilename of imagesToOptimize) {
    const imagePath = path.join(directory, imageFilename);

    try {
      const {
        data: optimizedImageData,
        filename: optimizedPath,
      } = await optimizeImage(imagePath, workerLogger);

      if(optimizedImageData) {
        // write a new file with the optimized image data
        workerLogger.info(`Writing a new file to ${optimizedPath}`, { service: NAME });
        await fs.writeFile(optimizedPath, optimizedImageData, { mode: 0o644 });
      } else {
        // copy the file over because it's already optimized
        workerLogger.info(`Copying an existing file to ${optimizedPath}`);
        await fs.copyFile(imagePath, optimizedPath);
      }

      const optimizedFilename = optimizedPath.split('/').at(-1);
      await onOptimizeImage(imageFilename, optimizedFilename);

      if(!DRY_RUN) {
        await fs.unlink(imagePath);
      }

      workerLogger.info(`Optimized image ${imageFilename}, now ${optimizedFilename}`, { service: NAME });
    } catch (err) {
      workerLogger.error(`Unable to optimize ${imageFilename}: ${err.message}`);
    }
  }
}

async function getUnoptimizedImagesInFolder(path: string) {
  const filenames = await fs.readdir(path);

  const unoptimized = filenames.filter(filename => {
    const parts = filename.split('.');
    return (
      isValidFormat(parts.at(-1)) && // is it a valid file type?
      parts.at(-2) !== OPTIMIZED_TAG && // is it an already-optimized file?
      (!filenames.includes(getOptimizedFilename(filename))) // did we already optimize it?
    );
  });

  return unoptimized;
}

async function optimizeImage(originalPath: string, workerLogger: winston.Logger) {
  const originalStats = await fs.stat(originalPath);
  const originalSizeInBytes = originalStats.size;

  const fileType = originalPath.split('.').at(-1);
  let outputOptions = { webp: {} };

  if(LOSSLESS_FILE_TYPES.includes(fileType)) {
    outputOptions = LOSSLESS_OUTPUT_OPTIONS;
  } else if(LOSSY_FILE_TYPES.includes(fileType)) {
    outputOptions = LOSSY_OUTPUT_OPTIONS;
  } else {
    throw new Error(`Unknown filetype ${fileType} found for image ${originalPath}`);
  }

  const { data, info } = await sharp(originalPath)
    .toFormat('webp', outputOptions.webp)
    .toBuffer({ resolveWithObject: true });

  const sharpenedSizeInBytes = info.size;
  workerLogger.debug(`Original: ${originalSizeInBytes} | Optimized: ${sharpenedSizeInBytes}`, { service: NAME });
  if(sharpenedSizeInBytes < originalSizeInBytes) {
    return {
      data,
      filename: getOptimizedFilename(originalPath, 'webp'),
    };
  } else {
    return {
      data: null,
      filename: getOptimizedFilename(originalPath),
    };
  }
}

function isValidFormat(fileType: string) {
  return LOSSLESS_FILE_TYPES.includes(fileType) || LOSSY_FILE_TYPES.includes(fileType);
}

function getOptimizedFilename(filename: string, extension?: string) {
  const parts = filename.split('.');
  return parts.toSpliced(-1, 1, OPTIMIZED_TAG, extension ?? parts.at(-1)).join('.');
}

export default {
  name: NAME,
  crontab: CRONTAB,
  runFn: run,
};
