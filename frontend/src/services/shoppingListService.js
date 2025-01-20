import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../config/firebase';

import { analyticsService } from './analyticsService';

const LISTS_COLLECTION = 'shoppingLists';
const ITEMS_COLLECTION = 'items';

export const shoppingListService = {
  // Shopping List Operations
  createList: async (userId, listData) => {
    try {
      const newList = {
        ...listData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        shared: [],
      };
      const docRef = await addDoc(collection(db, LISTS_COLLECTION), newList);
      analyticsService.trackEvent('shopping_list_created');
      return { id: docRef.id, ...newList };
    } catch (error) {
      analyticsService.trackEvent('shopping_list_error', {
        action: 'create',
        error: error.message,
      });
      throw error;
    }
  },

  updateList: async (listId, updates) => {
    try {
      const listRef = doc(db, LISTS_COLLECTION, listId);
      await updateDoc(listRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      analyticsService.trackEvent('shopping_list_updated');
    } catch (error) {
      analyticsService.trackEvent('shopping_list_error', {
        action: 'update',
        error: error.message,
      });
      throw error;
    }
  },

  deleteList: async (listId) => {
    try {
      await deleteDoc(doc(db, LISTS_COLLECTION, listId));
      analyticsService.trackEvent('shopping_list_deleted');
    } catch (error) {
      analyticsService.trackEvent('shopping_list_error', {
        action: 'delete',
        error: error.message,
      });
      throw error;
    }
  },

  getUserLists: async (userId) => {
    try {
      const q = query(collection(db, LISTS_COLLECTION), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      analyticsService.trackEvent('shopping_list_error', {
        action: 'fetch',
        error: error.message,
      });
      throw error;
    }
  },

  shareList: async (listId, userEmail) => {
    try {
      const listRef = doc(db, LISTS_COLLECTION, listId);
      const listDoc = await getDoc(listRef);
      const currentShared = listDoc.data().shared || [];

      await updateDoc(listRef, {
        shared: [...currentShared, userEmail],
        updatedAt: serverTimestamp(),
      });
      analyticsService.trackEvent('shopping_list_shared');
    } catch (error) {
      analyticsService.trackEvent('shopping_list_error', {
        action: 'share',
        error: error.message,
      });
      throw error;
    }
  },

  // Item Operations
  addItem: async (listId, itemData) => {
    try {
      const newItem = {
        ...itemData,
        listId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, ITEMS_COLLECTION), newItem);
      analyticsService.trackEvent('shopping_item_added');
      return { id: docRef.id, ...newItem };
    } catch (error) {
      analyticsService.trackEvent('shopping_item_error', {
        action: 'add',
        error: error.message,
      });
      throw error;
    }
  },

  updateItem: async (itemId, updates) => {
    try {
      const itemRef = doc(db, ITEMS_COLLECTION, itemId);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      analyticsService.trackEvent('shopping_item_updated');
    } catch (error) {
      analyticsService.trackEvent('shopping_item_error', {
        action: 'update',
        error: error.message,
      });
      throw error;
    }
  },

  deleteItem: async (itemId) => {
    try {
      await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
      analyticsService.trackEvent('shopping_item_deleted');
    } catch (error) {
      analyticsService.trackEvent('shopping_item_error', {
        action: 'delete',
        error: error.message,
      });
      throw error;
    }
  },

  getListItems: async (listId) => {
    try {
      const q = query(collection(db, ITEMS_COLLECTION), where('listId', '==', listId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      analyticsService.trackEvent('shopping_item_error', {
        action: 'fetch',
        error: error.message,
      });
      throw error;
    }
  },

  // Real-time subscriptions
  subscribeToList: (listId, callback) => {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    return onSnapshot(listRef, (doc) => {
      callback({ id: doc.id, ...doc.data() });
    });
  },

  subscribeToListItems: (listId, callback) => {
    const q = query(collection(db, ITEMS_COLLECTION), where('listId', '==', listId));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(items);
    });
  },
};
