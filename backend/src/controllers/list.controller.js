const { validationResult } = require('express-validator');
const List = require('../models/List');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Get all lists for user
exports.getLists = async (req, res) => {
  try {
    const lists = await List.find({
      $or: [{ userId: req.user.id }, { sharedWith: req.user.id }],
    }).sort({ createdAt: -1 });
    res.json(lists);
  } catch (err) {
    logger.error('Error in getLists:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Create a new list
exports.createList = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newList = new List({
      name: req.body.name,
      userId: req.user.id,
      items: [],
      category: req.body.category,
    });

    const list = await newList.save();
    res.json(list);
  } catch (err) {
    logger.error('Error in createList:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get list by ID
exports.getListById = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ msg: 'List not found' });
    }

    // Check user authorization
    if (list.userId.toString() !== req.user.id && !list.sharedWith.includes(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(list);
  } catch (err) {
    logger.error('Error in getListById:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'List not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update a list
exports.updateList = async (req, res) => {
  try {
    let list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ msg: 'List not found' });
    }

    // Check user authorization
    if (list.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    list = await List.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });

    res.json(list);
  } catch (err) {
    logger.error('Error in updateList:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete a list
exports.deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ msg: 'List not found' });
    }

    // Check user authorization
    if (list.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await list.remove();
    res.json({ msg: 'List removed' });
  } catch (err) {
    logger.error('Error in deleteList:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Add item to list
exports.addItem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ msg: 'List not found' });
    }

    // Check user authorization
    if (list.userId.toString() !== req.user.id && !list.sharedWith.includes(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const newItem = {
      name: req.body.name,
      quantity: req.body.quantity || 1,
      category: req.body.category,
      price: req.body.price,
      completed: false,
    };

    list.items.unshift(newItem);
    await list.save();
    res.json(list);
  } catch (err) {
    logger.error('Error in addItem:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update item in list
exports.updateItem = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ msg: 'List not found' });
    }

    // Check user authorization
    if (list.userId.toString() !== req.user.id && !list.sharedWith.includes(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const itemIndex = list.items.findIndex((item) => item.id === req.params.itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ msg: 'Item not found' });
    }

    list.items[itemIndex] = {
      ...list.items[itemIndex].toObject(),
      ...req.body,
    };

    await list.save();
    res.json(list);
  } catch (err) {
    logger.error('Error in updateItem:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete item from list
exports.deleteItem = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ msg: 'List not found' });
    }

    // Check user authorization
    if (list.userId.toString() !== req.user.id && !list.sharedWith.includes(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const itemIndex = list.items.findIndex((item) => item.id === req.params.itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ msg: 'Item not found' });
    }

    list.items.splice(itemIndex, 1);
    await list.save();
    res.json(list);
  } catch (err) {
    logger.error('Error in deleteItem:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Share list with another user
exports.shareList = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ msg: 'List not found' });
    }

    // Check user authorization
    if (list.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already shared
    if (list.sharedWith.includes(user.id)) {
      return res.status(400).json({ msg: 'List already shared with this user' });
    }

    list.sharedWith.push(user.id);
    await list.save();
    res.json(list);
  } catch (err) {
    logger.error('Error in shareList:', err.message);
    res.status(500).send('Server error');
  }
};
