import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { getJwtSecret } from '../utils/jwt.js';
import { escapeRegex } from '../utils/sanitize.js';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = CLIENT_ID ? new OAuth2Client(CLIENT_ID) : null;

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };
}

/**
 * Serializes user fields required by frontend navigation, profile widgets, and Arena.
 */
export function serializeAuthUser(user) {
  return {
    id: user._id,
    username: user.username,
    cfHandle: user.cfHandle,
    isVerified: user.isVerified,
    isAdmin: user.isAdmin,
    isCoordinator: user.isCoordinator,
    isWingMember: user.isWingMember,
    customTitle: user.customTitle,
    rating: user.rating,
    rank: user.rank,
    karma: user.karma ?? 0,
    avatarUrl: user.avatarUrl || '',
    arenaElo: user.arenaElo ?? 1000,
    arenaWins: user.arenaWins ?? 0,
    arenaLosses: user.arenaLosses ?? 0,
    arenaDraws: user.arenaDraws ?? 0,
  };
}

// Google Auth Login/Signup
export const googleAuth = async (req, res) => {
  try {
    if (!CLIENT_ID || !googleClient) {
      return res.status(503).json({ message: 'Google OAuth is not configured on the server.' });
    }
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      const baseUsername = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9_.-]/g, '').toLowerCase() || 'coder';
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = new User({
        username,
        email,
        googleId,
        avatarUrl: picture,
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatarUrl) user.avatarUrl = picture;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      ...getAuthCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Google login successful', user: serializeAuthUser(user) });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

// Standard Register User
export const registerUser = async (req, res) => {
  try {
    const { username, password, cfHandle, email } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string' || typeof email !== 'string' || !username.trim() || !password || !email.trim()) {
      return res.status(400).json({ message: 'Username, password, and email are required' });
    }
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({ message: 'Username must be 3-30 characters and contain only letters, numbers, _, ., or -.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${escapeRegex(cleanUsername)}$`, 'i') } },
        { email: cleanEmail },
      ],
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      cfHandle: typeof cfHandle === 'string' && cfHandle.trim() ? cfHandle.trim() : undefined,
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'Username or email already taken' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please continue with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      ...getAuthCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Logged in successfully', user: serializeAuthUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout User
export const logoutUser = (req, res) => {
  res.clearCookie('token', getAuthCookieOptions());
  res.json({ message: 'Logged out successfully' });
};

// Verify User Session Mapping
export const verifySession = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(200).json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(200).json({ isAuthenticated: false });
    }
    res.json({ isAuthenticated: true, user: serializeAuthUser(user) });
  } catch {
    return res.status(200).json({ isAuthenticated: false });
  }
};

// Change Password (for logged-in users)
export const changePassword = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { currentPassword, newPassword } = req.body;

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    if (user.password) {
      if (typeof currentPassword !== 'string' || !currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
