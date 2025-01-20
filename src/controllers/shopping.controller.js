const ShoppingList = require('../models/ShoppingList');

// Get all shopping lists
exports.getShoppingLists = async (req, res) => {
    try {
        const lists = await ShoppingList.find({ userId: req.user.id });
        res.json(lists);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create new shopping list
exports.createShoppingList = async (req, res) => {
    const list = new ShoppingList({
        name: req.body.name,
        userId: req.user.id,
        items: [],
        category: req.body.category
    });

    try {
        const newList = await list.save();
        res.status(201).json(newList);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update shopping list
exports.updateShoppingList = async (req, res) => {
    try {
        const list = await ShoppingList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });
        if (list.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        Object.assign(list, req.body);
        const updatedList = await list.save();
        res.json(updatedList);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete shopping list
exports.deleteShoppingList = async (req, res) => {
    try {
        const list = await ShoppingList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });
        if (list.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await list.remove();
        res.json({ message: 'List deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add item to shopping list
exports.addItem = async (req, res) => {
    try {
        const list = await ShoppingList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });
        if (list.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        list.items.push({
            name: req.body.name,
            quantity: req.body.quantity,
            category: req.body.category,
            price: req.body.price,
            completed: false
        });

        const updatedList = await list.save();
        res.json(updatedList);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Remove item from shopping list
exports.removeItem = async (req, res) => {
    try {
        const list = await ShoppingList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });
        if (list.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        list.items = list.items.filter(item => item.id !== req.params.itemId);
        const updatedList = await list.save();
        res.json(updatedList);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update item in shopping list
exports.updateItem = async (req, res) => {
    try {
        const list = await ShoppingList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });
        if (list.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const item = list.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        Object.assign(item, req.body);
        const updatedList = await list.save();
        res.json(updatedList);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
