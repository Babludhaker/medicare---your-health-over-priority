'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * AWS S3 wrapper for lab reports and document storage.
 *
 * The pattern: the client asks the API for a presigned upload URL,
 * uploads the file directly to S3, then stores the resulting object
 * key on the MedicalRecord. Reads use presigned download URLs.
 */
const enabled = Boolean(
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET
);

const s3 = enabled
  ? new AWS.S3({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      signatureVersion: 'v4',
    })
  : null;

/**
 * Build a unique, namespaced object key.
 */
function buildKey(clinicId, folder, filename) {
  const safe = String(filename || 'file').replace(/[^\w.\-]/g, '_');
  const stamp = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  return `clinics/${clinicId}/${folder}/${stamp}_${safe}`;
}

/**
 * Presigned PUT URL the client uses to upload a file directly to S3.
 */
function getUploadUrl({ clinicId, folder = 'documents', filename, contentType }) {
  const key = buildKey(clinicId, folder, filename);

  if (!enabled) {
    logger.info({ key }, '[s3:mock] presigned upload URL generated');
    return {
      uploadUrl: `https://mock-s3.local/upload/${key}`,
      key,
      mocked: true,
    };
  }

  const uploadUrl = s3.getSignedUrl('putObject', {
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
    Expires: 300, // 5 minutes
  });

  return { uploadUrl, key };
}

/**
 * Presigned GET URL to download / view a stored object.
 */
function getDownloadUrl(key, expiresSeconds = 300) {
  if (!enabled) {
    return `https://mock-s3.local/download/${key}`;
  }
  return s3.getSignedUrl('getObject', {
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Expires: expiresSeconds,
  });
}

/**
 * Direct server-side upload (used for generated invoice PDFs).
 */
async function uploadBuffer({ clinicId, folder = 'invoices', filename, buffer, contentType }) {
  const key = buildKey(clinicId, folder, filename);

  if (!enabled) {
    logger.info({ key }, '[s3:mock] buffer "uploaded"');
    return { key, url: `https://mock-s3.local/download/${key}`, mocked: true };
  }

  await s3
    .putObject({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    })
    .promise();

  return { key, url: getDownloadUrl(key, 3600) };
}

/**
 * Delete an object.
 */
async function deleteObject(key) {
  if (!enabled) {
    logger.info({ key }, '[s3:mock] object deleted');
    return { mocked: true };
  }
  await s3.deleteObject({ Bucket: env.AWS_S3_BUCKET, Key: key }).promise();
  return { deleted: true };
}

module.exports = {
  getUploadUrl,
  getDownloadUrl,
  uploadBuffer,
  deleteObject,
  isEnabled: enabled,
};
