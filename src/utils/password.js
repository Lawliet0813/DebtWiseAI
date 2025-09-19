import crypto from 'node:crypto';

const ITERATIONS = 120_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) {
    return false;
  }
  const [salt, originalHash] = stored.split(':');
  if (!salt || !originalHash) {
    return false;
  }
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');

  const originalBuffer = Buffer.from(originalHash, 'hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  if (originalBuffer.length !== hashBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(originalBuffer, hashBuffer);
}

export {
  hashPassword,
  verifyPassword,
};
