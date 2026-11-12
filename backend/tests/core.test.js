import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwt.js';
import { extractUsernames } from '../utils/mentions.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { cfRankColor } from '../../frontend/src/utils/cfRank.js';

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('getJwtSecret returns configured JWT_SECRET when set', () => {
  const prev = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test_secret_value';
  assert.equal(getJwtSecret(), 'test_secret_value');
  if (prev === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = prev;
});

test('getJwtSecret throws in production if JWT_SECRET is missing', () => {
  const prevSecret = process.env.JWT_SECRET;
  const prevEnv = process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';
  assert.throws(() => getJwtSecret(), /JWT_SECRET/);
  if (prevSecret !== undefined) process.env.JWT_SECRET = prevSecret;
  if (prevEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = prevEnv;
});

test('extractUsernames parses unique @mentions cleanly', () => {
  const result = extractUsernames('Hey @alice, check @bob_123 and @alice again. email@domain.com');
  assert.deepEqual(result, ['alice', 'bob_123']);
  assert.deepEqual(extractUsernames(''), []);
});

test('requireAuth returns 401 when token cookie is missing', () => {
  const req = { cookies: {} };
  const res = createMockRes();
  let called = false;
  requireAuth(req, res, () => {
    called = true;
  });
  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
});

test('requireAuth attaches decoded user when token cookie is valid', () => {
  const prev = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'unit_test_secret';
  const token = jwt.sign({ id: 'u1', username: 'nikky' }, 'unit_test_secret');
  const req = { cookies: { token } };
  const res = createMockRes();
  let called = false;
  requireAuth(req, res, () => {
    called = true;
  });
  assert.equal(called, true);
  assert.equal(req.user.username, 'nikky');
  if (prev === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = prev;
});

test('optionalAuth passes through without token', () => {
  const req = { cookies: {} };
  const res = createMockRes();
  let called = false;
  optionalAuth(req, res, () => {
    called = true;
  });
  assert.equal(called, true);
  assert.equal(req.user, undefined);
});

test('cfRankColor maps Codeforces ranks to expected hex colors', () => {
  assert.equal(cfRankColor('grandmaster'), '#ff0000');
  assert.equal(cfRankColor('Candidate Master'), '#aa00aa');
  assert.equal(cfRankColor('specialist'), '#03a89e');
  assert.equal(cfRankColor(''), '#94a3b8');
});

import {
  escapeRegex,
  isSafeHttpUrl,
  isValidCodeforcesProblemUrl,
  sanitizeScrapedHtml,
} from '../utils/sanitize.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

test('escapeRegex escapes regex metacharacters safely', () => {
  assert.equal(escapeRegex('user.name+(test)$'), 'user\\.name\\+\\(test\\)\\$');
});

test('isSafeHttpUrl accepts http/https and rejects javascript/data URIs', () => {
  assert.equal(isSafeHttpUrl('https://github.com/Nikky-SDE'), true);
  assert.equal(isSafeHttpUrl('http://localhost:5173'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<script>alert(1)</script>'), false);
});

test('isValidCodeforcesProblemUrl allows official CF problem URLs and blocks SSRF', () => {
  assert.equal(isValidCodeforcesProblemUrl('https://codeforces.com/problemset/problem/1900/A'), true);
  assert.equal(isValidCodeforcesProblemUrl('https://codeforces.com/contest/1900/problem/B2'), true);
  assert.equal(isValidCodeforcesProblemUrl('http://127.0.0.1:5000/api/health'), false);
  assert.equal(isValidCodeforcesProblemUrl('https://codeforces.com/problemset/problem/1/A;whoami'), false);
});

test('sanitizeScrapedHtml strips scripts, event handlers, and javascript URIs', () => {
  const dirty = '<p onclick="evil()">Hello <script>alert(1)</script><a href="javascript:evil()">link</a></p>';
  const clean = sanitizeScrapedHtml(dirty);
  assert.equal(clean.includes('<script'), false);
  assert.equal(clean.includes('onclick'), false);
  assert.equal(clean.includes('javascript:'), false);
  assert.equal(clean.includes('<p>Hello '), true);
});

test('createRateLimiter blocks requests exceeding max in window', () => {
  const limiter = createRateLimiter({ windowMs: 10000, max: 2 });
  const makeRes = () => ({
    headers: {},
    statusCode: 200,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  });
  let nextCount = 0;
  const next = () => { nextCount += 1; };

  limiter({ ip: '1.2.3.4' }, makeRes(), next);
  limiter({ ip: '1.2.3.4' }, makeRes(), next);
  const res3 = makeRes();
  limiter({ ip: '1.2.3.4' }, res3, next);

  assert.equal(nextCount, 2);
  assert.equal(res3.statusCode, 429);
});
