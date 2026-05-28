'use strict';

const PDFDocument = require('pdfkit');

/**
 * PDF generation for invoices and e-prescriptions.
 * Each function resolves to a Buffer that can be emailed or
 * uploaded to S3.
 */

/**
 * Render a PDFDocument to a Buffer.
 */
function renderToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

/**
 * Generate an invoice PDF.
 *
 * @param {object} data
 * @param {string} data.invoiceNo
 * @param {string} data.clinicName
 * @param {string} data.patientName
 * @param {string} data.doctorName
 * @param {string} data.appointmentWhen
 * @param {number} data.amount
 * @param {string} data.currency
 * @param {Date}   data.issuedAt
 */
async function generateInvoicePdf(data) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.fontSize(20).text('MediCare Connect', { align: 'left' });
  doc.fontSize(10).fillColor('#666').text(data.clinicName || '');
  doc.moveDown();

  doc.fillColor('#000').fontSize(16).text('INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#666')
    .text(`Invoice No: ${data.invoiceNo}`, { align: 'right' })
    .text(`Date: ${new Date(data.issuedAt || Date.now()).toLocaleDateString()}`, {
      align: 'right',
    });
  doc.moveDown(2);

  doc.fillColor('#000').fontSize(11);
  doc.text(`Billed to: ${data.patientName}`);
  doc.text(`Doctor: Dr. ${data.doctorName}`);
  doc.text(`Appointment: ${data.appointmentWhen}`);
  doc.moveDown(1.5);

  // Line item table
  const tableTop = doc.y;
  doc.font('Helvetica-Bold');
  doc.text('Description', 50, tableTop);
  doc.text('Amount', 400, tableTop, { width: 100, align: 'right' });
  doc.font('Helvetica');
  doc.moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).stroke();

  const rowY = tableTop + 28;
  doc.text('Consultation fee', 50, rowY);
  doc.text(`${data.currency || 'INR'} ${Number(data.amount).toFixed(2)}`, 400, rowY, {
    width: 100,
    align: 'right',
  });

  doc.moveTo(50, rowY + 22).lineTo(545, rowY + 22).stroke();
  doc.font('Helvetica-Bold');
  doc.text('Total', 50, rowY + 32);
  doc.text(`${data.currency || 'INR'} ${Number(data.amount).toFixed(2)}`, 400, rowY + 32, {
    width: 100,
    align: 'right',
  });

  doc.font('Helvetica').fontSize(9).fillColor('#999');
  doc.text('Thank you for choosing MediCare Connect.', 50, 720, { align: 'center' });

  return renderToBuffer(doc);
}

/**
 * Generate an e-prescription PDF.
 *
 * @param {object} data
 * @param {string} data.clinicName
 * @param {string} data.doctorName
 * @param {string} data.doctorSpecialization
 * @param {string} data.patientName
 * @param {Date}   data.date
 * @param {string} [data.advice]
 * @param {Date}   [data.followUpDate]
 * @param {Array}  data.items - { drugName, dosage, frequency, durationDays, instructions }
 */
async function generatePrescriptionPdf(data) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.fontSize(18).text(`Dr. ${data.doctorName}`, { continued: false });
  doc.fontSize(10).fillColor('#666').text(data.doctorSpecialization || '');
  doc.text(data.clinicName || '');
  doc.moveDown();

  doc.fillColor('#000').fontSize(10);
  doc.text(`Patient: ${data.patientName}`);
  doc.text(`Date: ${new Date(data.date || Date.now()).toLocaleDateString()}`);
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(14).text('Rx', 50);
  doc.moveDown(0.5);
  doc.fontSize(10);

  (data.items || []).forEach((item, idx) => {
    doc.font('Helvetica-Bold').text(`${idx + 1}. ${item.drugName}  (${item.dosage})`);
    doc.font('Helvetica').fillColor('#444')
      .text(
        `   ${item.frequency}  ·  ${item.durationDays} day(s)` +
          (item.instructions ? `  ·  ${item.instructions}` : '')
      );
    doc.fillColor('#000').moveDown(0.5);
  });

  if (data.advice) {
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Advice:');
    doc.font('Helvetica').fillColor('#444').text(data.advice);
    doc.fillColor('#000');
  }

  if (data.followUpDate) {
    doc.moveDown();
    doc.font('Helvetica-Bold')
      .text(`Follow-up: ${new Date(data.followUpDate).toLocaleDateString()}`);
  }

  doc.font('Helvetica').fontSize(9).fillColor('#999');
  doc.text('This is a digitally generated prescription.', 50, 730, { align: 'center' });

  return renderToBuffer(doc);
}

/**
 * Generate a generic tabular report PDF (used by the analytics module).
 *
 * @param {object} data
 * @param {string} data.title
 * @param {object} [data.range] - { from, to }
 * @param {string[]} data.columns
 * @param {string[][]} data.rows
 */
async function generateReportPdf(data) {
  const doc = new PDFDocument({ size: 'A4', margin: 50, layout: 'landscape' });
  const pageWidth = doc.page.width - 100; // usable width inside margins
  const columns = data.columns || [];
  const colWidth = columns.length ? pageWidth / columns.length : pageWidth;

  doc.fontSize(18).fillColor('#000').text('MediCare Connect', 50, 50);
  doc.fontSize(13).text(data.title || 'Report');
  if (data.range) {
    doc.fontSize(9).fillColor('#666').text(
      `Period: ${new Date(data.range.from).toLocaleDateString()} - ` +
        `${new Date(data.range.to).toLocaleDateString()}`
    );
  }
  doc.moveDown();

  // Header row.
  let y = doc.y + 6;
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(9);
  columns.forEach((col, i) => {
    doc.text(String(col), 50 + i * colWidth, y, { width: colWidth - 4 });
  });
  doc.moveTo(50, y + 14).lineTo(50 + pageWidth, y + 14).stroke();
  y += 22;

  // Data rows — paginate when the page fills.
  doc.font('Helvetica').fontSize(8).fillColor('#222');
  for (const row of data.rows || []) {
    if (y > doc.page.height - 60) {
      doc.addPage({ size: 'A4', margin: 50, layout: 'landscape' });
      y = 50;
    }
    row.forEach((cell, i) => {
      doc.text(String(cell ?? ''), 50 + i * colWidth, y, { width: colWidth - 4 });
    });
    y += 18;
  }

  if (!data.rows || data.rows.length === 0) {
    doc.fillColor('#999').text('No data for the selected period.', 50, y);
  }

  return renderToBuffer(doc);
}

module.exports = { generateInvoicePdf, generatePrescriptionPdf, generateReportPdf };
