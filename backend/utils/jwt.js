import crypto from 'crypto';

let ephemeralDevSecret = null;

/**
 * Returns the configured JWT signing secret from environment variables.
 * In non-production environments without JWT_SECRET set, generates an ephemeral
 * per-process secret so no hardcoded secret exists in source control.
 */
export function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production.');
  }

  if (!ephemeralDevSecret) {
    ephemeralDevSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Auth] JWT_SECRET is not set; using an ephemeral development secret.');
  }

  return ephemeralDevSecret;
}
