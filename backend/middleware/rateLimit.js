/**
 * Lightweight in-memory fixed-window rate limiter middleware.
 * Avoids adding external dependencies while protecting auth and compute-heavy routes.
 */
export function createRateLimiter({ windowMs = 60_000, max = 60, message = 'Too many requests, please try again later.' } = {}) {
  const hits = new Map();

  // Periodically prune expired entries to prevent unbounded memory growth
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 60_000));
  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const existing = hits.get(ip);

    if (!existing || existing.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({ message });
    }

    return next();
  };
}
