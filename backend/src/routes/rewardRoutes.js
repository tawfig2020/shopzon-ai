const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get user rewards
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const rewardsSnapshot = await req.app.locals.db
      .collection('rewards')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const rewards = [];
    rewardsSnapshot.forEach((doc) => {
      rewards.push({ id: doc.id, ...doc.data() });
    });

    res.json(rewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// Add reward points
router.post('/points', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { points, reason } = req.body;

    const userRef = req.app.locals.db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPoints = userDoc.data().points || 0;
    const newPoints = currentPoints + points;

    await userRef.update({ points: newPoints });

    // Record the points transaction
    await req.app.locals.db.collection('rewards').add({
      userId,
      points,
      reason,
      type: 'EARNED',
      createdAt: new Date(),
    });

    res.json({ points: newPoints });
  } catch (error) {
    console.error('Error adding reward points:', error);
    res.status(500).json({ error: 'Failed to add reward points' });
  }
});

// Redeem rewards
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { rewardId, points } = req.body;

    const userRef = req.app.locals.db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPoints = userDoc.data().points || 0;

    if (currentPoints < points) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    const newPoints = currentPoints - points;

    await userRef.update({ points: newPoints });

    // Record the redemption
    await req.app.locals.db.collection('rewards').add({
      userId,
      points: -points,
      rewardId,
      type: 'REDEEMED',
      createdAt: new Date(),
    });

    res.json({ points: newPoints });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
});

module.exports = router;
