import crypto from 'crypto';
import { promisify } from 'util';
const pbkdf2 = promisify(crypto.pbkdf2);

const ITERATIONS = 310000;
const KEYLENGTH = 32;
const DIGEST = 'sha256';

async function verifyHash(givenPassword: string, hashedPassword: string, salt: string) {
  const computedHashedPassword = await pbkdf2(givenPassword, Buffer.from(salt, 'base64'), ITERATIONS, KEYLENGTH, DIGEST);
  const givenHashedPassword = Buffer.from(hashedPassword, 'base64');

  return crypto.timingSafeEqual(computedHashedPassword, givenHashedPassword);
}

async function hash(password: string) {
  const salt = crypto.randomBytes(16);
  const hashedPassword = await pbkdf2(password, salt, ITERATIONS, KEYLENGTH, DIGEST);

  return {
    hashedPassword: hashedPassword.toString('base64'),
    salt: salt.toString('base64'),
  };
}

export {
  hash,
  verifyHash
};
