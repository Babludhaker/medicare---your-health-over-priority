'use strict';

const { prisma } = require('../../config/prisma');
const {
  APPOINTMENT_STATUS,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
} = require('../../utils/constants');
const { startOfDay, endOfDay } = require('../../utils/datetime');

/**
 * Reporting & analytics.
 *
 *  - getClinicDashboard:   per-tenant operational metrics (CLINIC_ADMIN)
 *  - getPlatformDashboard: cross-tenant SaaS metrics      (SUPER_ADMIN)
 *  - exportClinicReport:   CSV / PDF appointment report
 */

/**
 * Resolve a date range, defaulting to the last 30 days.
 */
function resolveRange(query) {
  const to = query.to ? endOfDay(query.to) : endOfDay(new Date());
  const from = query.from
    ? startOfDay(query.from)
    : startOfDay(new Date(Date.now() - 30 * 86400000));
  return { from, to };
}

/**
 * Operational dashboard for a single clinic.
 */
async function getClinicDashboard(clinicId, query) {
  const { from, to } = resolveRange(query);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    appointmentsToday,
    statusBreakdown,
    paymentsAgg,
    totalPatients,
    totalDoctors,
    topDoctorsRaw,
  ] = await Promise.all([
    // Appointments scheduled for today.
    prisma.appointment.count({
      where: { clinicId, startTime: { gte: todayStart, lte: todayEnd } },
    }),
    // Status breakdown over the range.
    prisma.appointment.groupBy({
      by: ['status'],
      where: { clinicId, startTime: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    // Revenue: sum of PAID payments over the range.
    prisma.payment.aggregate({
      where: {
        status: PAYMENT_STATUS.PAID,
        paidAt: { gte: from, lte: to },
        appointment: { clinicId },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.patientProfile.count({ where: { clinicId } }),
    prisma.doctorProfile.count({ where: { clinicId } }),
    // Busiest doctors over the range.
    prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { clinicId, startTime: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { doctorId: 'desc' } },
      take: 5,
    }),
  ]);

  // Turn the status breakdown into a keyed object + derive no-show rate.
  const byStatus = {};
  let totalInRange = 0;
  for (const row of statusBreakdown) {
    byStatus[row.status] = row._count._all;
    totalInRange += row._count._all;
  }
  const noShow = byStatus[APPOINTMENT_STATUS.NO_SHOW] || 0;
  const completed = byStatus[APPOINTMENT_STATUS.COMPLETED] || 0;
  const noShowRate = totalInRange > 0 ? +((noShow / totalInRange) * 100).toFixed(1) : 0;

  // Hydrate top-doctor names.
  const topDoctors = await Promise.all(
    topDoctorsRaw.map(async (d) => {
      const doc = await prisma.doctorProfile.findUnique({
        where: { id: d.doctorId },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      return {
        doctorId: d.doctorId,
        name: doc ? `${doc.user.firstName} ${doc.user.lastName}` : 'Unknown',
        specialization: doc?.specialization || null,
        appointments: d._count._all,
      };
    })
  );

  return {
    range: { from, to },
    appointments: {
      today: appointmentsToday,
      inRange: totalInRange,
      completed,
      noShow,
      noShowRate,
      byStatus,
    },
    revenue: {
      total: Number(paymentsAgg._sum.amount || 0),
      transactions: paymentsAgg._count._all,
    },
    totals: { patients: totalPatients, doctors: totalDoctors },
    topDoctors,
  };
}

/**
 * Platform-wide dashboard for the super admin.
 */
async function getPlatformDashboard(query) {
  const { from, to } = resolveRange(query);

  const [
    totalClinics,
    activeClinics,
    subStatusBreakdown,
    activeSubs,
    totalUsers,
    totalAppointments,
    newClinicsInRange,
  ] = await Promise.all([
    prisma.clinic.count(),
    prisma.clinic.count({ where: { isActive: true } }),
    prisma.clinicSubscription.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    // Active subscriptions with their plan price -> MRR.
    prisma.clinicSubscription.findMany({
      where: {
        status: { in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING] },
      },
      include: { plan: { select: { priceMonthly: true, tier: true } } },
    }),
    prisma.user.count(),
    prisma.appointment.count(),
    prisma.clinic.count({ where: { createdAt: { gte: from, lte: to } } }),
  ]);

  // Monthly recurring revenue from active (non-trial) subscriptions.
  const mrr = activeSubs
    .filter((s) => s.status === SUBSCRIPTION_STATUS.ACTIVE)
    .reduce((sum, s) => sum + Number(s.plan.priceMonthly), 0);

  const subByStatus = {};
  for (const row of subStatusBreakdown) {
    subByStatus[row.status] = row._count._all;
  }
  const cancelled = subByStatus[SUBSCRIPTION_STATUS.CANCELLED] || 0;
  const totalSubs = subStatusBreakdown.reduce((s, r) => s + r._count._all, 0);
  const churnRate = totalSubs > 0 ? +((cancelled / totalSubs) * 100).toFixed(1) : 0;

  // Plan-tier distribution among active subscriptions.
  const tierMix = {};
  for (const s of activeSubs) {
    tierMix[s.plan.tier] = (tierMix[s.plan.tier] || 0) + 1;
  }

  return {
    range: { from, to },
    clinics: {
      total: totalClinics,
      active: activeClinics,
      inactive: totalClinics - activeClinics,
      newInRange: newClinicsInRange,
    },
    subscriptions: {
      byStatus: subByStatus,
      mrr,
      churnRate,
      tierMix,
    },
    totals: { users: totalUsers, appointments: totalAppointments },
  };
}

/**
 * Build an appointment report for a clinic and serialise it as CSV or
 * a PDF buffer.
 */
async function exportClinicReport(clinicId, query) {
  const { from, to } = resolveRange(query);
  const format = query.format || 'csv';

  const appointments = await prisma.appointment.findMany({
    where: { clinicId, startTime: { gte: from, lte: to } },
    orderBy: { startTime: 'asc' },
    include: {
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      patient: { include: { user: { select: { firstName: true, lastName: true } } } },
      payment: { select: { status: true, amount: true } },
    },
  });

  const rows = appointments.map((a) => ({
    date: a.startTime.toISOString(),
    doctor: `${a.doctor.user.firstName} ${a.doctor.user.lastName}`,
    patient: `${a.patient.user.firstName} ${a.patient.user.lastName}`,
    status: a.status,
    paymentStatus: a.payment?.status || 'NONE',
    amount: a.payment ? Number(a.payment.amount) : 0,
  }));

  if (format === 'csv') {
    const header = 'Date,Doctor,Patient,Status,Payment Status,Amount';
    const body = rows
      .map((r) => {
        // Quote fields so commas in names do not break the CSV.
        const cells = [r.date, r.doctor, r.patient, r.status, r.paymentStatus, r.amount];
        return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
      })
      .join('\n');
    return {
      format: 'csv',
      filename: `appointments-${Date.now()}.csv`,
      contentType: 'text/csv',
      content: `${header}\n${body}`,
    };
  }

  // PDF export.
  const pdfService = require('../../services/pdf.service');
  const buffer = await pdfService.generateReportPdf({
    title: 'Appointment Report',
    range: { from, to },
    columns: ['Date', 'Doctor', 'Patient', 'Status', 'Payment', 'Amount'],
    rows: rows.map((r) => [
      new Date(r.date).toLocaleString(),
      r.doctor,
      r.patient,
      r.status,
      r.paymentStatus,
      String(r.amount),
    ]),
  });
  return {
    format: 'pdf',
    filename: `appointments-${Date.now()}.pdf`,
    contentType: 'application/pdf',
    content: buffer,
  };
}

module.exports = {
  getClinicDashboard,
  getPlatformDashboard,
  exportClinicReport,
};
