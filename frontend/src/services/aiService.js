import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

import { db } from '../config/firebase';

const ITEMS_COLLECTION = 'items';

export const aiService = {
  // Purchase Pattern Analysis
  analyzePurchasePatterns: async (userId) => {
    try {
      const itemsQuery = query(
        collection(db, ITEMS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(500)
      );

      const snapshot = await getDocs(itemsQuery);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Analyze frequency and patterns
      const patterns = items.reduce((acc, item) => {
        const key = item.name.toLowerCase();
        if (!acc[key]) {
          acc[key] = {
            name: item.name,
            frequency: 1,
            lastPurchased: item.createdAt,
            avgPrice: item.price || 0,
            categories: [item.category],
            quantities: [item.quantity || 1],
          };
        } else {
          acc[key].frequency += 1;
          acc[key].avgPrice =
            (acc[key].avgPrice * (acc[key].frequency - 1) + (item.price || 0)) / acc[key].frequency;
          if (!acc[key].categories.includes(item.category)) {
            acc[key].categories.push(item.category);
          }
          acc[key].quantities.push(item.quantity || 1);
        }
        return acc;
      }, {});

      return Object.values(patterns);
    } catch (error) {
      console.error('Error analyzing purchase patterns:', error);
      throw error;
    }
  },

  // Predictive Item Suggestions
  getPredictiveItems: async (userId) => {
    try {
      const patterns = await aiService.analyzePurchasePatterns(userId);
      const now = new Date();

      // Calculate purchase frequency and predict next purchase
      const predictions = patterns.map((pattern) => {
        const avgQuantity =
          pattern.quantities.reduce((a, b) => a + b, 0) / pattern.quantities.length;
        const lastPurchased = pattern.lastPurchased?.toDate() || new Date();
        const daysSinceLastPurchase = (now - lastPurchased) / (1000 * 60 * 60 * 24);

        // Simple prediction based on frequency
        const purchaseFrequencyDays = 30 / pattern.frequency;
        const dueForPurchase = daysSinceLastPurchase >= purchaseFrequencyDays;

        return {
          ...pattern,
          predictedQuantity: Math.round(avgQuantity),
          dueForPurchase,
          confidence: calculateConfidence(pattern.frequency, daysSinceLastPurchase),
        };
      });

      return predictions
        .filter((p) => p.dueForPurchase)
        .sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error getting predictive items:', error);
      throw error;
    }
  },

  // Price Optimization
  getPriceOptimizations: async (userId) => {
    try {
      const patterns = await aiService.analyzePurchasePatterns(userId);

      // Analyze price trends and find optimization opportunities
      const optimizations = patterns.map((pattern) => {
        const frequentPurchase = pattern.frequency > 2;
        const highSpend = pattern.avgPrice * pattern.frequency > 50;

        let recommendation = null;
        let potentialSavings = 0;

        if (frequentPurchase && highSpend) {
          recommendation = 'Consider buying in bulk';
          potentialSavings = pattern.avgPrice * pattern.frequency * 0.2; // Assume 20% bulk discount
        } else if (pattern.avgPrice > 20) {
          recommendation = 'Look for sales or alternatives';
          potentialSavings = pattern.avgPrice * 0.15; // Assume 15% potential savings
        }

        return {
          name: pattern.name,
          currentAvgPrice: pattern.avgPrice,
          recommendation,
          potentialSavings: potentialSavings > 0 ? potentialSavings : null,
          frequency: pattern.frequency,
        };
      });

      return optimizations.filter((opt) => opt.recommendation);
    } catch (error) {
      console.error('Error getting price optimizations:', error);
      throw error;
    }
  },

  // Natural Language Processing
  processVoiceInput: async (text) => {
    try {
      // Split text into potential items
      const items = text
        .split(/[,.]/)
        .map((item) => item.trim())
        .filter(Boolean);

      // Process each item
      const processedItems = items.map((item) => {
        const quantityMatch = item.match(/(\d+)\s+(.+)/);
        let quantity = 1;
        let name = item;

        if (quantityMatch) {
          quantity = parseInt(quantityMatch[1]);
          name = quantityMatch[2];
        }

        return {
          name: name.toLowerCase(),
          quantity,
        };
      });

      // Categorize items
      const categorizedItems = await Promise.all(
        processedItems.map(async (item) => ({
          ...item,
          category: await aiService.categorizeItem(item.name),
        }))
      );

      return categorizedItems;
    } catch (error) {
      console.error('Error processing voice input:', error);
      throw error;
    }
  },

  // Smart Item Categorization
  categorizeItem: async (itemName) => {
    // Define category keywords
    const categoryKeywords = {
      groceries: ['food', 'fruit', 'vegetable', 'meat', 'dairy', 'bread', 'milk', 'cheese'],
      household: ['cleaner', 'paper', 'towel', 'soap', 'detergent'],
      electronics: ['battery', 'charger', 'cable', 'device'],
      clothing: ['shirt', 'pants', 'socks', 'shoes'],
    };

    // Check if item name matches any category keywords
    const itemNameLower = itemName.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => itemNameLower.includes(keyword))) {
        return category;
      }
    }

    return 'other';
  },

  // Generate Shopping List from Recipe
  generateListFromRecipe: async (recipeText) => {
    try {
      // Extract ingredients from recipe text
      const ingredients = recipeText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.match(/^[\d½¼¾⅓⅔]|cup|tablespoon|teaspoon|pound|ounce/i));

      // Process ingredients
      const items = await Promise.all(
        ingredients.map(async (ingredient) => {
          const processed = processIngredient(ingredient);
          return {
            ...processed,
            category: await aiService.categorizeItem(processed.name),
          };
        })
      );

      return items;
    } catch (error) {
      console.error('Error generating list from recipe:', error);
      throw error;
    }
  },
};

// Helper functions
function calculateConfidence(frequency, daysSinceLastPurchase) {
  // Simple confidence calculation based on purchase frequency and recency
  const frequencyWeight = Math.min(frequency / 10, 1); // Max 1.0
  const recencyWeight = Math.max(1 - daysSinceLastPurchase / 60, 0); // Max 1.0
  return (frequencyWeight + recencyWeight) / 2;
}

function processIngredient(ingredient) {
  // Extract quantity and unit from ingredient text
  const regex =
    /^([\d½¼¾⅓⅔]+)?\s*(cup|tablespoon|teaspoon|pound|ounce|g|ml|tsp|tbsp|oz|lb|s|)s?\s+(.+)/i;
  const match = ingredient.match(regex);

  if (match) {
    const [, quantity, unit, name] = match;
    return {
      name: name.toLowerCase(),
      quantity: convertQuantity(quantity || '1'),
      unit: unit.toLowerCase(),
    };
  }

  return {
    name: ingredient.toLowerCase(),
    quantity: 1,
  };
}

function convertQuantity(quantity) {
  const fractions = {
    '½': 0.5,
    '¼': 0.25,
    '¾': 0.75,
    '⅓': 0.33,
    '⅔': 0.67,
  };

  return fractions[quantity] || parseFloat(quantity) || 1;
}

export default aiService;
