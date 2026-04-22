import PDFDocument from 'pdfkit';
import { formatIstDateOnly, formatCurrency } from '@istays/shared';
// We use any types temporarily for simplicity during generation to support DB types generically
export async function buildInvoicePdf(
  invoice: any,
  charges: any[],
  tenant: any
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('TAX INVOICE', { align: 'right' });
      doc.moveDown();

      // Tenant Details (Left)
      doc.fontSize(14).text(tenant.name || 'Hotel Property');
      doc.fontSize(10).font('Helvetica');
      doc.text(tenant.address || 'Address');
      doc.text(`${tenant.city || ''}, ${tenant.state || ''} ${tenant.pincode || ''}`);
      if (tenant.gstNumber) doc.font('Helvetica-Bold').text(`GSTIN: ${tenant.gstNumber}`);
      doc.moveDown();

      // Invoice Details (Right)
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 350, 100);
      doc.text(`Date: ${formatIstDateOnly(invoice.createdAt)}`, 350, 115);
      doc.text(`Place of Supply: ${invoice.placeOfSupply || 'NA'}`, 350, 130);
      
      // Guest Details (Left)
      doc.font('Helvetica-Bold').text('Bill To:', 50, 160);
      doc.font('Helvetica').text(invoice.guestName, 50, 175);
      if (invoice.guestGstin) doc.font('Helvetica-Bold').text(`Guest GSTIN: ${invoice.guestGstin}`, 50, 190);
      
      doc.moveDown(2);

      // Table Header
      const tableTop = 230;
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, tableTop);
      doc.text('SAC', 200, tableTop);
      doc.text('Qty', 280, tableTop);
      doc.text('Rate', 320, tableTop);
      doc.text('Total', 450, tableTop, { align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Rows
      let y = tableTop + 25;
      doc.font('Helvetica');
      charges.forEach((charge) => {
        doc.text(charge.description || charge.category, 50, y, { width: 140 });
        doc.text(charge.sacCode || 'NA', 200, y);
        doc.text(charge.quantity.toString(), 280, y);
        doc.text(formatCurrency(charge.unitPrice).replace('₹', 'Rs '), 320, y);
        doc.text(formatCurrency(charge.totalPrice).replace('₹', 'Rs '), 450, y, { align: 'right' });
        y += 20;
      });

      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;

      // Totals
      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', 350, y);
      doc.text(formatCurrency(invoice.subtotal).replace('₹', 'Rs '), 450, y, { align: 'right' });
      y += 15;

      if (invoice.totalCgst > 0) {
        doc.font('Helvetica').text('CGST:', 350, y);
        doc.text(formatCurrency(invoice.totalCgst).replace('₹', 'Rs '), 450, y, { align: 'right' });
        y += 15;
      }
      if (invoice.totalSgst > 0) {
        doc.font('Helvetica').text('SGST:', 350, y);
        doc.text(formatCurrency(invoice.totalSgst).replace('₹', 'Rs '), 450, y, { align: 'right' });
        y += 15;
      }
      if (invoice.totalIgst > 0) {
        doc.font('Helvetica').text('IGST:', 350, y);
        doc.text(formatCurrency(invoice.totalIgst).replace('₹', 'Rs '), 450, y, { align: 'right' });
        y += 15;
      }

      doc.moveTo(350, y).lineTo(550, y).stroke();
      y += 10;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Grand Total:', 350, y);
      doc.text(formatCurrency(invoice.grandTotal).replace('₹', 'Rs '), 450, y, { align: 'right' });

      // Footer
      doc.fontSize(10).font('Helvetica-Oblique').text('System generated document. No signature required.', 50, 750, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
