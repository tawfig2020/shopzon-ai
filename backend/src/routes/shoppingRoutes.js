const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get all shopping lists for a user
router.get('/lists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const lists = await req.app.locals.db
      .collection('shoppingLists')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const shoppingLists = [];
    lists.forEach((doc) => {
      shoppingLists.push({ id: doc.id, ...doc.data() });
    });

    res.json(shoppingLists);
  } catch (error) {
    console.error('Error fetching shopping lists:', error);
    res.status(500).json({ error: 'Failed to fetch shopping lists' });
  }
});

// Create a new shopping list
router.post('/lists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, items } = req.body;

    const newList = {
      name,
      items: items || [],
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await req.app.locals.db.collection('shoppingLists').add(newList);
    res.status(201).json({ id: docRef.id, ...newList });
  } catch (error) {
    console.error('Error creating shopping list:', error);
    res.status(500).json({ error: 'Failed to create shopping list' });
  }
});

// Update a shopping list
router.put('/lists/:id', authenticateToken, async (req, res) => {
  try {
    const listId = req.params.id;
    const userId = req.user.uid;
    const updates = req.body;

    const listRef = req.app.locals.db.collection('shoppingLists').doc(listId);
    const list = await listRef.get();

    if (!list.exists) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    if (list.data().userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this list' });
    }

    await listRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    res.json({ id: listId, ...updates });
  } catch (error) {
    console.error('Error updating shopping list:', error);
    res.status(500).json({ error: 'Failed to update shopping list' });
  }
});

// Delete a shopping list
router.delete('/lists/:id', authenticateToken, async (req, res) => {
  try {
    const listId = req.params.id;
    const userId = req.user.uid;

    const listRef = req.app.locals.db.collection('shoppingLists').doc(listId);
    const list = await listRef.get();

    if (!list.exists) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    if (list.data().userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this list' });
    }

    await listRef.delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting shopping list:', error);
    res.status(500).json({ error: 'Failed to delete shopping list' });
  }
});

module.exports = router;
