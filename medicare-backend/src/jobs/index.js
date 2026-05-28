'use strict';

const { registerHoldExpiryJob } = require('./holdExpiry.job');
const { registerReminderJob } = require('./reminders.job');
const { registerAnalyticsJob } = require('./analytics.job');
const logger = require('../config/logger');

/**
 * Register every scheduled job. Called once at server startup.
 */
function startJobs() {
  registerHoldExpiryJob();
  registerReminderJob();
  registerAnalyticsJob();
  logger.info('All cron jobs registered');
}

module.exports = { startJobs };
