const { validationResult } = require('express-validator');
const Household = require('../models/Household');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get all households for user
exports.getHouseholds = async (req, res) => {
  try {
    const households = await Household.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }],
    })
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.json(households);
  } catch (err) {
    logger.error('Error in getHouseholds:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Create a new household
exports.createHousehold = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newHousehold = new Household({
      name: req.body.name,
      owner: req.user.id,
      description: req.body.description,
    });

    const household = await newHousehold.save();

    // Add household to user's households
    await User.findByIdAndUpdate(req.user.id, {
      $push: { households: household._id },
    });

    res.json(household);
  } catch (err) {
    logger.error('Error in createHousehold:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get household by ID
exports.getHouseholdById = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!household) {
      return res.status(404).json({ msg: 'Household not found' });
    }

    // Check user authorization
    if (
      household.owner.toString() !== req.user.id &&
      !household.members.some((member) => member._id.toString() === req.user.id)
    ) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(household);
  } catch (err) {
    logger.error('Error in getHouseholdById:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Household not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update a household
exports.updateHousehold = async (req, res) => {
  try {
    let household = await Household.findById(req.params.id);

    if (!household) {
      return res.status(404).json({ msg: 'Household not found' });
    }

    // Check user authorization
    if (household.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    household = await Household.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });

    res.json(household);
  } catch (err) {
    logger.error('Error in updateHousehold:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete a household
exports.deleteHousehold = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household) {
      return res.status(404).json({ msg: 'Household not found' });
    }

    // Check user authorization
    if (household.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Remove household from all members' households array
    await User.updateMany(
      { _id: { $in: [...household.members, household.owner] } },
      { $pull: { households: household._id } }
    );

    await household.remove();
    res.json({ msg: 'Household removed' });
  } catch (err) {
    logger.error('Error in deleteHousehold:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Add member to household
exports.addMember = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const household = await Household.findById(req.params.id);

    if (!household) {
      return res.status(404).json({ msg: 'Household not found' });
    }

    // Check user authorization
    if (household.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already a member
    if (household.members.includes(user.id)) {
      return res.status(400).json({ msg: 'User is already a member' });
    }

    household.members.push(user.id);
    await household.save();

    // Add household to user's households
    await User.findByIdAndUpdate(user.id, {
      $push: { households: household._id },
    });

    res.json(household);
  } catch (err) {
    logger.error('Error in addMember:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Remove member from household
exports.removeMember = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);

    if (!household) {
      return res.status(404).json({ msg: 'Household not found' });
    }

    // Check user authorization
    if (household.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Remove member from household
    household.members = household.members.filter(
      (member) => member.toString() !== req.params.memberId
    );
    await household.save();

    // Remove household from user's households
    await User.findByIdAndUpdate(req.params.memberId, {
      $pull: { households: household._id },
    });

    res.json(household);
  } catch (err) {
    logger.error('Error in removeMember:', err.message);
    res.status(500).send('Server error');
  }
};
