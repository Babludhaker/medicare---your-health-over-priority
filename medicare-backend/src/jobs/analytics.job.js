'use strict';

const cron = require('node-cron');
const { prisma } = require('../config/prisma');
const logger = require('../config/logger');
const { APPOINTMENT_STATUS, PAYMENT_STATUS } = require('../utils/constants');
const { startOfDay, endOfDay, addDays } = require('../utils/datetime');

/**
 * Analytics rollup job.
 *
 * Runs nightly and computes per-clinic metrics for the previous day:
 * appointment counts, no-show rate and revenue. The result is logged;
 * in a production build it would be persisted into a DailyMetric table
 * for fast dashboard reads (kept out of scope of the provided schema).
 */
async function rollupForDate(date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const results = [];

  for (const clinic of clinics) {
    const where = {
      clinicId: clinic.id,
      startTime: { gte: dayStart, lte: dayEnd },
    };

    const [total, completed, noShow, cancelled, revenueAgg] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({
        where: { ...where, status: APPOINTMENT_STATUS.COMPLETED },
      }),
      prisma.appointment.count({
        where: { ...where, status: APPOINTMENT_STATUS.NO_SHOW },
      }),
      prisma.appointment.count({
        where: { ...where, status: APPOINTMENT_STATUS.CANCELLED },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PAYMENT_STATUS.PAID,
          paidAt: { gte: dayStart, lte: dayEnd },
          appointment: { clinicId: clinic.id },
        },
      }),
    ]);

    const metric = {
      clinicId: clinic.id,
      clinicName: clinic.name,
      date: dayStart.toISOString().slice(0, 10),
      totalAppointments: total,
      completed,
      noShow,
      cancelled,
      noShowRate: total ? Number(((noShow / total) * 100).toFixed(1)) : 0,
      revenue: Number(revenueAgg._sum.amount || 0),
    };
    results.push(metric);
  }

  logger.info({ clinics: results.length }, 'Analytics rollup completed');
  return results;
}

/**
 * Register the cron. Runs daily at 00:30.
 */
function registerAnalyticsJob() {
  cron.schedule('30 0 * * *', async () => {
    try {
      const yesterday = addDays(new Date(), -1);
      await rollupForDate(yesterday);
    } catch (err) {
      logger.error({ err }, 'analytics job failed');
    }
  });
  logger.info('Job registered: analytics rollup (daily 00:30)');
}

module.exports = { registerAnalyticsJob, rollupForDate };
