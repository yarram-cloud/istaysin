import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 're_your_api_key') {
      console.warn('⚠️ RESEND_API_KEY not configured — emails will be logged to console');
    }
    resend = new Resend(apiKey || 'dummy');
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@istays.in';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 're_your_api_key') {
      console.log(`📧 [EMAIL MOCK] To: ${options.to} | Subject: ${options.subject}`);
      console.log(`   Body preview: ${options.html.substring(0, 200)}...`);
      return true;
    }

    const r = getResend();
    await r.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error('[EMAIL ERROR]', err);
    return false;
  }
}

// ── Email Templates ──

export async function sendBookingConfirmation(
  to: string,
  data: { bookingNumber: string; guestName: string; propertyName: string; checkIn: string; checkOut: string; totalAmount: number },
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Booking Confirmed — ${data.bookingNumber} | ${data.propertyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Booking Confirmed ✓</h2>
        <p>Dear ${data.guestName},</p>
        <p>Your booking at <strong>${data.propertyName}</strong> has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Booking ID</strong></td><td>${data.bookingNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-in</strong></td><td>${data.checkIn}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-out</strong></td><td>${data.checkOut}</td></tr>
          <tr><td style="padding: 8px;"><strong>Total</strong></td><td>₹${data.totalAmount.toLocaleString('en-IN')}</td></tr>
        </table>
        <p style="color: #666;">We look forward to welcoming you!</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, fullName: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Welcome to iStays!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Welcome to iStays 🏨</h2>
        <p>Hi ${fullName},</p>
        <p>Your account has been created successfully. You can now register your property or book stays at thousands of hotels, lodges, and homestays across India.</p>
        <p style="color: #666;">— Team iStays</p>
      </div>
    `,
  });
}

export async function sendPropertyApprovalEmail(
  to: string,
  data: { propertyName: string; status: 'approved' | 'rejected'; reason?: string; subdomainUrl?: string },
): Promise<boolean> {
  const approved = data.status === 'approved';
  return sendEmail({
    to,
    subject: `Property ${approved ? 'Approved' : 'Review Required'} — ${data.propertyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${approved ? '#22543d' : '#c53030'};">${approved ? '✓ Property Approved' : '⚠ Review Required'}</h2>
        <p>Your property <strong>${data.propertyName}</strong> has been ${approved ? 'approved and is now live on iStays!' : 'reviewed and requires some changes.'}</p>
        ${approved && data.subdomainUrl ? `
          <div style="margin: 16px 0; padding: 16px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
            <p style="margin: 0; color: #166534; font-size: 14px;"><strong>Your property is live at:</strong></p>
            <p style="margin: 8px 0 0 0;"><a href="${data.subdomainUrl}" style="color: #15803d; font-size: 16px; font-weight: 600;">${data.subdomainUrl}</a></p>
          </div>
        ` : ''}
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
      </div>
    `,
  });
}
