const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import shopping controller (we'll create this next)
const { 
    getShoppingLists,
    createShoppingList,
    updateShoppingList,
    deleteShoppingList,
    addItem,
    removeItem,
    updateItem
} = require('../controllers/shopping.controller');

// Get all shopping lists
router.get('/', auth, getShoppingLists);

// Create new shopping list
router.post('/', auth, createShoppingList);

// Update shopping list
router.put('/:id', auth, updateShoppingList);

// Delete shopping list
router.delete('/:id', auth, deleteShoppingList);

// Add item to shopping list
router.post('/:id/items', auth, addItem);

// Remove item from shopping list
router.delete('/:id/items/:itemId', auth, removeItem);

// Update item in shopping list
router.put('/:id/items/:itemId', auth, updateItem);

module.exports = router;
