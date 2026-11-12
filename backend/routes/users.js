import express from 'express';
import {
  getTopRankers,
  getTopContributors,
  makeWingMember,
  getUserProfile,
  getUserActivity,
  updateUserProfile,
  updateUsername,
  searchUsers,
  updateUserRoles,
  getAllUsers,
  followUser,
  unfollowUser,
  updateStreak,
} from '../controllers/usersController.js';
import { requireAuth, optionalAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public leaderboards
router.get('/users/top-rankers', getTopRankers);
router.get('/users/top-contributors', getTopContributors);
router.get('/users/search', searchUsers);

// Public user profiles
router.get('/users/:username', optionalAuth, getUserProfile);
router.get('/users/:username/activity', getUserActivity);

// Admin-only
router.get('/users', requireAuth, requireAdmin, getAllUsers);
router.post('/users/make-wing-member', requireAuth, requireAdmin, makeWingMember);
router.put('/users/:username/roles', requireAuth, requireAdmin, updateUserRoles);



// Authenticated user
router.put('/users/profile', requireAuth, updateUserProfile);
router.put('/users/profile/username', requireAuth, updateUsername);
router.post('/users/streak', requireAuth, updateStreak);
router.post('/users/:username/follow', requireAuth, followUser);
router.post('/users/:username/unfollow', requireAuth, unfollowUser);

export default router;
