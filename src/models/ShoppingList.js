const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    category: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: false
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const shoppingListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [itemSchema],
    category: {
        type: String,
        required: false
    },
    shared: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    totalAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Calculate total amount before saving
shoppingListSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + (item.price || 0) * item.quantity;
    }, 0);
    next();
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
