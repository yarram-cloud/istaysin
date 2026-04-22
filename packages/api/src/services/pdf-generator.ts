import PDFDocument from 'pdfkit';
import { formatIstDateOnly } from '@istays/shared';

// Typed interfaces matching the Prisma models used in invoice generation
interface InvoiceData {
  invoiceNumber: string;
  guestName: string;
  guestGstin?: string | null;
  placeOfSupply?: string | null;
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  grandTotal: number;
  isProforma?: boolean;
  createdAt: Date | string;
  booking?: {
    checkInDate?: Date | string | null;
    checkOutDate?: Date | string | null;
  } | null;
}

interface ChargeData {
  description?: string | null;
  category: string;
  sacCode?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
}

interface TenantData {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstNumber?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

/**
 * Formats currency for PDF rendering.
 * PDFKit's default fonts (Helvetica) do NOT support the ₹ symbol,
 * so we substitute with "Rs." for safe rendering.
 */
function pdfCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function buildInvoicePdf(
  invoice: InvoiceData,
  charges: ChargeData[],
  tenant: TenantData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ─── Header ───────────────────────────────────────────
      const headerLabel = invoice.isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE';
      doc.fontSize(20).font('Helvetica-Bold').text(headerLabel, { align: 'right' });
      doc.moveDown(0.5);

      // ─── Tenant Details (Seller — Left) ───────────────────
      doc.fontSize(14).text(tenant.name || 'Hotel Property');
      doc.fontSize(10).font('Helvetica');
      if (tenant.address) doc.text(tenant.address);
      const cityLine = [tenant.city, tenant.state, tenant.pincode].filter(Boolean).join(', ');
      if (cityLine) doc.text(cityLine);
      if (tenant.contactPhone) doc.text(`Phone: ${tenant.contactPhone}`);
      if (tenant.contactEmail) doc.text(`Email: ${tenant.contactEmail}`);
      if (tenant.gstNumber) {
        doc.font('Helvetica-Bold').text(`GSTIN: ${tenant.gstNumber}`);
      }
      doc.moveDown();

      // ─── Invoice Metadata (Right Column) ──────────────────
      const metaX = 350;
      let metaY = 100;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, metaX, metaY);
      metaY += 15;
      doc.font('Helvetica').text(`Date: ${formatIstDateOnly(invoice.createdAt)}`, metaX, metaY);
      metaY += 15;
      doc.text(`Place of Supply: ${invoice.placeOfSupply || 'N/A'}`, metaX, metaY);

      if (invoice.booking?.checkInDate) {
        metaY += 15;
        doc.text(`Check-in: ${formatIstDateOnly(invoice.booking.checkInDate)}`, metaX, metaY);
      }
      if (invoice.booking?.checkOutDate) {
        metaY += 15;
        doc.text(`Check-out: ${formatIstDateOnly(invoice.booking.checkOutDate)}`, metaX, metaY);
      }

      // ─── Guest Details (Buyer — Left) ─────────────────────
      const guestY = 175;
      doc.font('Helvetica-Bold').text('Bill To:', 50, guestY);
      doc.font('Helvetica').text(invoice.guestName, 50, guestY + 15);
      if (invoice.guestGstin) {
        doc.font('Helvetica-Bold').text(`Guest GSTIN: ${invoice.guestGstin}`, 50, guestY + 30);
      }

      doc.moveDown(2);

      // ─── Itemized Charges Table ───────────────────────────
      const tableTop = Math.max(240, guestY + 60);
      const colX = { item: 50, sac: 200, qty: 260, rate: 300, gst: 370, total: 450 };

      // Table Header
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Description', colX.item, tableTop, { width: 140 });
      doc.text('SAC', colX.sac, tableTop);
      doc.text('Qty', colX.qty, tableTop);
      doc.text('Rate', colX.rate, tableTop);
      doc.text('GST%', colX.gst, tableTop);
      doc.text('Amount', colX.total, tableTop, { align: 'right', width: 100 });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Rows
      let y = tableTop + 25;
      doc.font('Helvetica').fontSize(9);
      for (const charge of charges) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(charge.description || charge.category, colX.item, y, { width: 140 });
        doc.text(charge.sacCode || 'N/A', colX.sac, y);
        doc.text(String(charge.quantity), colX.qty, y);
        doc.text(pdfCurrency(charge.unitPrice), colX.rate, y, { width: 65 });
        doc.text(`${charge.gstRate}%`, colX.gst, y);
        const lineTotal = charge.totalPrice + charge.cgst + charge.sgst + charge.igst;
        doc.text(pdfCurrency(lineTotal), colX.total, y, { align: 'right', width: 100 });
        y += 18;
      }

      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;

      // ─── Totals Section ───────────────────────────────────
      const totalX = 350;
      doc.font('Helvetica');

      doc.text('Subtotal:', totalX, y);
      doc.text(pdfCurrency(invoice.subtotal), 450, y, { align: 'right', width: 100 });
      y += 15;

      if (invoice.totalCgst > 0) {
        doc.text('CGST:', totalX, y);
        doc.text(pdfCurrency(invoice.totalCgst), 450, y, { align: 'right', width: 100 });
        y += 15;
      }
      if (invoice.totalSgst > 0) {
        doc.text('SGST:', totalX, y);
        doc.text(pdfCurrency(invoice.totalSgst), 450, y, { align: 'right', width: 100 });
        y += 15;
      }
      if (invoice.totalIgst > 0) {
        doc.text('IGST:', totalX, y);
        doc.text(pdfCurrency(invoice.totalIgst), 450, y, { align: 'right', width: 100 });
        y += 15;
      }

      doc.moveTo(totalX, y).lineTo(550, y).stroke();
      y += 10;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Grand Total:', totalX, y);
      doc.text(pdfCurrency(invoice.grandTotal), 450, y, { align: 'right', width: 100 });

      // ─── Footer ───────────────────────────────────────────
      doc.fontSize(8).font('Helvetica-Oblique');
      doc.text(
        'This is a computer-generated invoice. No signature is required.',
        50, 750,
        { align: 'center', width: 500 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
