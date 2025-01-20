const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import reward controller
const {
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  claimReward,
} = require('../controllers/rewardController');

// Get all rewards
router.get('/', auth, getRewards);

// Create new reward
router.post('/', auth, createReward);

// Update reward
router.put('/:id', auth, updateReward);

// Delete reward
router.delete('/:id', auth, deleteReward);

// Claim reward
router.post('/:id/claim', auth, claimReward);

module.exports = router;
