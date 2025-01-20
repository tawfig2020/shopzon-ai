const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const householdController = require('../controllers/household.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const createHouseholdValidation = [
  body('name').trim().notEmpty(),
  body('description').optional().trim(),
];

const updateHouseholdValidation = [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
];

// Routes
router.get('/', auth, householdController.getHouseholds);
router.post('/', auth, validate(createHouseholdValidation), householdController.createHousehold);
router.get('/:id', auth, householdController.getHousehold);
router.put('/:id', auth, validate(updateHouseholdValidation), householdController.updateHousehold);
router.delete('/:id', auth, householdController.deleteHousehold);

// Member management
router.post('/:id/members', auth, householdController.addMember);
router.delete('/:id/members/:memberId', auth, householdController.removeMember);

module.exports = router;
