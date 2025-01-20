const backupService = require('../utils/backup');
const logger = require('../utils/logger');

async function runManualBackup() {
  try {
    logger.info('Starting manual backup...');

    // Backup MongoDB
    const mongoBackupPath = await backupService.createMongoBackup();
    logger.info(`MongoDB backup created at: ${mongoBackupPath}`);

    // Backup Redis
    const redisBackupPath = await backupService.createRedisBackup();
    logger.info(`Redis backup created at: ${redisBackupPath}`);

    logger.info('Manual backup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Manual backup failed:', error);
    process.exit(1);
  }
}

runManualBackup();
