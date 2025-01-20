const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const listController = require('../controllers/list.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const createListValidation = [
  body('name').trim().notEmpty(),
  body('householdId').optional().isMongoId(),
  body('items').optional().isArray(),
  body('items.*.name').optional().trim().notEmpty(),
  body('items.*.quantity').optional().isInt({ min: 1 }),
];

const updateListValidation = [
  body('name').optional().trim().notEmpty(),
  body('items').optional().isArray(),
  body('items.*.name').optional().trim().notEmpty(),
  body('items.*.quantity').optional().isInt({ min: 1 }),
];

// Routes
router.get('/', auth, listController.getLists);
router.post('/', auth, validate(createListValidation), listController.createList);
router.get('/:id', auth, listController.getList);
router.put('/:id', auth, validate(updateListValidation), listController.updateList);
router.delete('/:id', auth, listController.deleteList);

// Item management
router.post('/:id/items', auth, listController.addItem);
router.put('/:id/items/:itemId', auth, listController.updateItem);
router.delete('/:id/items/:itemId', auth, listController.removeItem);

// List sharing
router.post('/:id/share', auth, listController.shareList);
router.delete('/:id/share/:userId', auth, listController.unshareList);

module.exports = router;
