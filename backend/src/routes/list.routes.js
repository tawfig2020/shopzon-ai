const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check } = require('express-validator');
const listController = require('../controllers/list.controller');

// @route   GET api/lists
// @desc    Get all lists for user
// @access  Private
router.get('/', auth, listController.getLists);

// @route   POST api/lists
// @desc    Create a new list
// @access  Private
router.post(
  '/',
  [auth, check('name', 'Name is required').not().isEmpty()],
  listController.createList
);

// @route   GET api/lists/:id
// @desc    Get list by ID
// @access  Private
router.get('/:id', auth, listController.getListById);

// @route   PUT api/lists/:id
// @desc    Update a list
// @access  Private
router.put('/:id', auth, listController.updateList);

// @route   DELETE api/lists/:id
// @desc    Delete a list
// @access  Private
router.delete('/:id', auth, listController.deleteList);

// @route   POST api/lists/:id/items
// @desc    Add item to list
// @access  Private
router.post(
  '/:id/items',
  [auth, check('name', 'Item name is required').not().isEmpty()],
  listController.addItem
);

// @route   PUT api/lists/:id/items/:itemId
// @desc    Update item in list
// @access  Private
router.put('/:id/items/:itemId', auth, listController.updateItem);

// @route   DELETE api/lists/:id/items/:itemId
// @desc    Delete item from list
// @access  Private
router.delete('/:id/items/:itemId', auth, listController.deleteItem);

// @route   POST api/lists/:id/share
// @desc    Share list with another user
// @access  Private
router.post(
  '/:id/share',
  [auth, check('email', 'Valid email is required').isEmail()],
  listController.shareList
);

module.exports = router;
