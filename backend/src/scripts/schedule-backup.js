const cron = require('node-cron');
const backupService = require('../utils/backup');
const logger = require('../utils/logger');

// Schedule daily backup at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('Starting scheduled backup...');

    // Backup MongoDB
    await backupService.createMongoBackup();

    // Backup Redis
    await backupService.createRedisBackup();

    // Clean up old backups (keep last 7 days)
    await backupService.cleanupOldBackups(7);

    logger.info('Scheduled backup completed successfully');
  } catch (error) {
    logger.error('Scheduled backup failed:', error);
  }
});
