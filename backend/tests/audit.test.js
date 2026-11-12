import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/User.js';
import {
  serializeAuthUser,
  registerUser,
  loginUser,
  logoutUser,
} from '../controllers/authController.js';
import {
  toInternalPath,
  getSafeNextPath,
} from '../../frontend/src/utils/navigation.js';

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    clearedCookies: [],
    cookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    clearCookie(name, options) {
      this.clearedCookies.push({ name, options });
      return this;
    },
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
  };
}

test('serializeAuthUser includes profile stats, wing role, and arena fields', () => {
  const user = {
    _id: 'u123',
    username: 'nikky',
    cfHandle: 'Nikky',
    isVerified: true,
    isAdmin: false,
    isCoordinator: true,
    isWingMember: true,
    customTitle: 'Coach',
    rating: 1750,
    rank: 'expert',
    karma: 42,
    avatarUrl: 'https://example.com/a.png',
    arenaElo: 1210,
    arenaWins: 5,
    arenaLosses: 2,
    arenaDraws: 1,
  };
  const dto = serializeAuthUser(user);
  assert.equal(dto.id, 'u123');
  assert.equal(dto.username, 'nikky');
  assert.equal(dto.karma, 42);
  assert.equal(dto.rating, 1750);
  assert.equal(dto.rank, 'expert');
  assert.equal(dto.isWingMember, true);
  assert.equal(dto.arenaElo, 1210);
  assert.equal(dto.arenaWins, 5);
});

test('toInternalPath and getSafeNextPath prevent open redirects and loops', () => {
  assert.equal(toInternalPath('/hub/'), '/hub');
  assert.equal(toInternalPath('/post/abc?tab=1'), '/post/abc?tab=1');
  assert.equal(toInternalPath('https://evil.com/phish'), null);
  assert.equal(toInternalPath('/api/auth/verify'), null);

  assert.equal(getSafeNextPath('//evil.com'), '/hub');
  assert.equal(getSafeNextPath('https://evil.com'), '/hub');
  assert.equal(getSafeNextPath('/auth'), '/hub');
  assert.equal(getSafeNextPath('/auth?next=/arena'), '/hub');
  assert.equal(getSafeNextPath('/arena?timer=15'), '/arena?timer=15');
  assert.equal(getSafeNextPath('/messages?to=tourist'), '/messages?to=tourist');
});

test('registerUser returns 400 on duplicate key race (code 11000)', async () => {
  const origFindOne = User.findOne;
  const origSave = User.prototype.save;
  User.findOne = async () => null;
  User.prototype.save = async () => {
    const err = new Error('E11000 duplicate key');
    err.code = 11000;
    throw err;
  };

  try {
    const req = {
      body: {
        username: 'Nikky_Test',
        email: 'nikky@example.com',
        password: 'password123',
      },
    };
    const res = createMockRes();
    await registerUser(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /already taken/i);
  } finally {
    User.findOne = origFindOne;
    User.prototype.save = origSave;
  }
});

test('loginUser rejects Google-only accounts without crashing bcrypt', async () => {
  const origFindOne = User.findOne;
  User.findOne = async () => ({ _id: 'g1', username: 'google_user', password: null });

  try {
    const req = { body: { username: 'google_user', password: 'password123' } };
    const res = createMockRes();
    await loginUser(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Google Sign-In/i);
  } finally {
    User.findOne = origFindOne;
  }
});

test('logoutUser clears token cookie with matching security options', () => {
  const res = createMockRes();
  logoutUser({}, res);
  assert.equal(res.clearedCookies.length, 1);
  assert.equal(res.clearedCookies[0].name, 'token');
  assert.equal(res.clearedCookies[0].options.httpOnly, true);
  assert.equal(res.clearedCookies[0].options.sameSite, 'strict');
});
