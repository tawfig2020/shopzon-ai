const { logger } = require('../config/init');
const { getRedisClient } = require('../config/init');
const List = require('../models/List');
const Household = require('../models/Household');

const getUserMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const lists = await List.find({ userId });
    const households = await Household.find({ members: userId });

    const metrics = {
      totalLists: lists.length,
      totalHouseholds: households.length,
      totalItems: lists.reduce((acc, list) => acc + list.items.length, 0),
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching user metrics:', error);
    res.status(500).json({ error: 'Failed to fetch user metrics' });
  }
};

const getHouseholdMetrics = async (req, res) => {
  try {
    const householdId = req.params.householdId;
    const household = await Household.findById(householdId);

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    const lists = await List.find({ householdId });
    const metrics = {
      totalMembers: household.members.length,
      totalLists: lists.length,
      totalItems: lists.reduce((acc, list) => acc + list.items.length, 0),
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching household metrics:', error);
    res.status(500).json({ error: 'Failed to fetch household metrics' });
  }
};

const getMetrics = async (req, res) => {
  try {
    const redisClient = getRedisClient();
    const metrics = await redisClient.hgetall('metrics');
    res.json(metrics || {});
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

const updateMetrics = async (req, res) => {
  try {
    const redisClient = getRedisClient();
    const { metric, value } = req.body;

    await redisClient.hset('metrics', metric, value);
    res.json({ message: 'Metrics updated successfully' });
  } catch (error) {
    logger.error('Error updating metrics:', error);
    res.status(500).json({ error: 'Failed to update metrics' });
  }
};

module.exports = {
  getUserMetrics,
  getHouseholdMetrics,
  getMetrics,
  updateMetrics,
};
