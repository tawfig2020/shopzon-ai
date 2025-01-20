const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../config/init');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating backup directory:', error);
    }
  }

  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.gz`;
    const backupPath = path.join(this.backupDir, filename);

    try {
      await this._executeBackup(backupPath);
      logger.info(`Backup created successfully at ${backupPath}`);
      return { success: true, path: backupPath };
    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  async restore(backupPath) {
    try {
      const exists = await fs
        .access(backupPath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        throw new Error('Backup file not found');
      }

      await this._executeRestore(backupPath);
      logger.info(`Restore completed successfully from ${backupPath}`);
      return { success: true };
    } catch (error) {
      logger.error('Restore failed:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      return files.filter((file) => file.endsWith('.gz'));
    } catch (error) {
      logger.error('Error listing backups:', error);
      throw error;
    }
  }

  async deleteBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      await fs.unlink(backupPath);
      logger.info(`Backup deleted: ${filename}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting backup:', error);
      throw error;
    }
  }

  _executeBackup(backupPath) {
    return new Promise((resolve, reject) => {
      const command = `mongodump --uri="${process.env.MONGODB_URI}" --gzip --archive="${backupPath}"`;
      exec(command, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  _executeRestore(backupPath) {
    return new Promise((resolve, reject) => {
      const command = `mongorestore --uri="${process.env.MONGODB_URI}" --gzip --archive="${backupPath}"`;
      exec(command, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

module.exports = new BackupService();
