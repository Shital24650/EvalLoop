// evalloop/backend/middleware.js
import rateLimitLib from 'express-rate-limit';

const DEFAULT_RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000); // 1 minute
const DEFAULT_RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 300);

export function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

function mask(value) {
  if (value == null) return value;
  const s = String(value);
  if (s.length <= 6) return '***';
  return s.slice(0, 3) + '***' + s.slice(-3);
}

function sanitizeForLog(obj) {
  try {
    const copy = JSON.parse(JSON.stringify(obj));
    // Mask obvious secret fields
    const secretKeys = ['authorization', 'authorization_token', 'bearer', 'apiKey', 'apikey', 'api_key', 'token', 'secret', 'password'];
    function walk(o) {
      if (!o || typeof o !== 'object') return;
      for (const k of Object.keys(o)) {
        const lower = k.toLowerCase();
        if (secretKeys.includes(k) || secretKeys.includes(lower)) {
          o[k] = mask(o[k]);
        } else if (typeof o[k] === 'object') {
          walk(o[k]);
        }
      }
    }
    walk(copy);
    return copy;
  } catch (e) {
    return '[unserializable]';
  }
}

export function requestLogger(req, res, next) {
  try {
    const safeHeaders = sanitizeForLog(req.headers);
    const safeBody = sanitizeForLog(req.body);
    console.info(`[request] ${req.method} ${req.path} - headers=${JSON.stringify(safeHeaders)} body=${JSON.stringify(safeBody)}`);
  } catch (e) {
    // keep going even if logging fails
  }
  next();
}

// Use a standard express-rate-limit with env-configurable params
export const rateLimit = rateLimitLib({
  windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
  max: DEFAULT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Slow down and retry later.' },
});
