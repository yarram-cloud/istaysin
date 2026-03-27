/**
 * SMS Service — MSG91 integration (stub for Phase 1)
 * Will be implemented in Phase 2 with actual MSG91 API integration.
 */

interface SmsOptions {
  to: string;
  message: string;
}

export async function sendSms(options: SmsOptions): Promise<boolean> {
  console.log(`📱 [SMS MOCK] To: ${options.to} | Message: ${options.message}`);
  return true;
}

export async function sendBookingConfirmationSms(
  to: string,
  data: { bookingNumber: string; propertyName: string; checkIn: string },
): Promise<boolean> {
  return sendSms({
    to,
    message: `Booking ${data.bookingNumber} confirmed at ${data.propertyName}. Check-in: ${data.checkIn}. — iStays`,
  });
}

export async function sendOtpSms(to: string, otp: string): Promise<boolean> {
  return sendSms({
    to,
    message: `Your iStays verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,
  });
}
