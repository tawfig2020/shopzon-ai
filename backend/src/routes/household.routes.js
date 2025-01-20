const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check } = require('express-validator');
const householdController = require('../controllers/household.controller');

// @route   GET api/households
// @desc    Get all households for user
// @access  Private
router.get('/', auth, householdController.getHouseholds);

// @route   POST api/households
// @desc    Create a new household
// @access  Private
router.post(
  '/',
  [auth, check('name', 'Name is required').not().isEmpty()],
  householdController.createHousehold
);

// @route   GET api/households/:id
// @desc    Get household by ID
// @access  Private
router.get('/:id', auth, householdController.getHouseholdById);

// @route   PUT api/households/:id
// @desc    Update a household
// @access  Private
router.put('/:id', auth, householdController.updateHousehold);

// @route   DELETE api/households/:id
// @desc    Delete a household
// @access  Private
router.delete('/:id', auth, householdController.deleteHousehold);

// @route   POST api/households/:id/members
// @desc    Add member to household
// @access  Private
router.post(
  '/:id/members',
  [auth, check('email', 'Valid email is required').isEmail()],
  householdController.addMember
);

// @route   DELETE api/households/:id/members/:memberId
// @desc    Remove member from household
// @access  Private
router.delete('/:id/members/:memberId', auth, householdController.removeMember);

module.exports = router;
