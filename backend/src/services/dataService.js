const { logger } = require('../config/init');
const { getFirestore } = require('../config/init');

class DataService {
  constructor() {
    this.db = getFirestore();
  }

  async create(collection, data) {
    try {
      const docRef = await this.db.collection(collection).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      logger.error('Error creating document:', error);
      throw error;
    }
  }

  async update(collection, id, data) {
    try {
      await this.db
        .collection(collection)
        .doc(id)
        .update({
          ...data,
          updatedAt: new Date(),
        });
      return { id, ...data };
    } catch (error) {
      logger.error('Error updating document:', error);
      throw error;
    }
  }

  async delete(collection, id) {
    try {
      await this.db.collection(collection).doc(id).delete();
      return { id };
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  async get(collection, id) {
    try {
      const doc = await this.db.collection(collection).doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error('Error getting document:', error);
      throw error;
    }
  }

  async query(collection, conditions = []) {
    try {
      let query = this.db.collection(collection);
      conditions.forEach(({ field, operator, value }) => {
        query = query.where(field, operator, value);
      });
      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error('Error querying documents:', error);
      throw error;
    }
  }
}

module.exports = new DataService();
