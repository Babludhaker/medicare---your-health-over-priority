'use strict';

const { prisma } = require('../config/prisma');
const logger = require('../config/logger');

/**
 * Write an immutable audit log entry. Audit logging must never break
 * the main request, so failures here are logged and swallowed.
 *
 * @param {object} params
 * @param {string} [params.clinicId]
 * @param {string} [params.userId]
 * @param {string} params.action      - one of AUDIT_ACTIONS
 * @param {string} params.entityType  - e.g. "Appointment"
 * @param {string} [params.entityId]
 * @param {object} [params.metadata]
 * @param {string} [params.ipAddress]
 */
async function audit({
  clinicId = null,
  userId = null,
  action,
  entityType,
  entityId = null,
  metadata = null,
  ipAddress = null,
}) {
  try {
    await prisma.auditLog.create({
      data: { clinicId, userId, action, entityType, entityId, metadata, ipAddress },
    });
  } catch (err) {
    logger.error({ err, action }, 'Failed to write audit log');
  }
}

/**
 * Convenience: build the audit fields straight from an Express request.
 */
function auditFromReq(req, { action, entityType, entityId, metadata }) {
  return audit({
    clinicId: req.user?.clinicId || null,
    userId: req.user?.id || null,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress: req.ip,
  });
}

module.exports = { audit, auditFromReq };
