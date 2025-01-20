const Reward = require('../models/Reward');
const User = require('../models/User');

// Get all rewards
exports.getRewards = async (req, res) => {
  try {
    const rewards = await Reward.find();
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new reward
exports.createReward = async (req, res) => {
  const reward = new Reward({
    name: req.body.name,
    description: req.body.description,
    points: req.body.points,
    type: req.body.type,
    expiryDate: req.body.expiryDate,
  });

  try {
    const newReward = await reward.save();
    res.status(201).json(newReward);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update reward
exports.updateReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });

    Object.assign(reward, req.body);
    const updatedReward = await reward.save();
    res.json(updatedReward);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete reward
exports.deleteReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });

    await reward.remove();
    res.json({ message: 'Reward deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Claim reward
exports.claimReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.points < reward.points) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    user.points -= reward.points;
    user.claimedRewards.push({
      reward: reward._id,
      claimedAt: new Date(),
    });

    await user.save();
    res.json({ message: 'Reward claimed successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
