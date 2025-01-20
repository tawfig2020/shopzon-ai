import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

import { db } from '../config/firebase';

const ITEMS_COLLECTION = 'items';

export const suggestionService = {
  // Get suggestions based on user's previous purchases
  getSuggestions: async (userId, searchTerm = '') => {
    try {
      // Query items from user's previous lists
      const q = query(
        collection(db, ITEMS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Process items to get unique suggestions
      const suggestions = items.reduce((acc, item) => {
        const key = `${item.name}-${item.category}`;
        if (!acc[key]) {
          acc[key] = {
            name: item.name,
            category: item.category,
            frequency: 1,
            lastPrice: item.price,
          };
        } else {
          acc[key].frequency += 1;
        }
        return acc;
      }, {});

      // Convert to array and sort by frequency
      const sortedSuggestions = Object.values(suggestions)
        .sort((a, b) => b.frequency - a.frequency)
        .filter((item) =>
          searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
        )
        .slice(0, 10);

      return sortedSuggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  },

  // Get category suggestions based on item name
  getCategorySuggestions: async (itemName) => {
    try {
      const q = query(
        collection(db, ITEMS_COLLECTION),
        where('name', '==', itemName.toLowerCase()),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const categories = querySnapshot.docs.map((doc) => doc.data().category).filter(Boolean);

      // Return most common category
      if (categories.length > 0) {
        const categoryCounts = categories.reduce((acc, cat) => {
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});

        return Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0][0];
      }

      return 'other';
    } catch (error) {
      console.error('Error getting category suggestions:', error);
      return 'other';
    }
  },
};

export default suggestionService;
