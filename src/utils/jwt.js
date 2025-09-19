import crypto from 'node:crypto';
import AppError from '../errors/AppError.js';

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input) {
  const pad = input.length % 4;
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/') + (pad ? '='.repeat(4 - pad) : '');
  return Buffer.from(normalized, 'base64').toString();
}

function sign(payload, secret, options = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now };
  if (options.expiresIn) {
    fullPayload.exp = now + Number(options.expiresIn);
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verify(token, secret) {
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    throw new AppError(401, 'Invalid authentication token.');
  }
  const [headerSegment, payloadSegment, signatureSegment] = token.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerSegment}.${payloadSegment}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (!crypto.timingSafeEqual(Buffer.from(signatureSegment), Buffer.from(expectedSignature))) {
    throw new AppError(401, 'Invalid authentication token.');
  }
  const payload = JSON.parse(base64UrlDecode(payloadSegment));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new AppError(401, 'Authentication token has expired.');
  }
  return payload;
}

export {
  sign,
  verify,
};
