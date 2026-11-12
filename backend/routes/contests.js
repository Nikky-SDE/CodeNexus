import express from 'express';
import {
  getContests,
  getContestById,
  createContest,
  updateContest,
  deleteContest,
  linkPost,
  unlinkPost,
} from '../controllers/contestController.js';
import {
  getContestMessages,
  postContestMessage,
} from '../controllers/contestMessageController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public read
router.get('/contests', getContests);
router.get('/contests/:id', getContestById);

// Admin write
router.post('/contests', requireAuth, requireAdmin, createContest);
router.put('/contests/:id', requireAuth, requireAdmin, updateContest);
router.delete('/contests/:id', requireAuth, requireAdmin, deleteContest);

// Authenticated users — link/unlink posts to contests
router.post('/contests/:id/link-post', requireAuth, linkPost);
router.post('/contests/:id/unlink-post', requireAuth, unlinkPost);

// Contest Chat
router.get('/contests/:id/chat', getContestMessages);
router.post('/contests/:id/chat', requireAuth, postContestMessage);

export default router;
