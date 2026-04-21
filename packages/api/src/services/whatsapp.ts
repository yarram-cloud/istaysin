import axios from 'axios';

const META_ACCESS_TOKEN = process.env.META_WHATSAPP_TOKEN;
const META_PHONE_ID = process.env.META_WHATSAPP_PHONE_ID;
const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${META_PHONE_ID}/messages`;

/**
 * Supported WhatsApp template languages for India.
 * Each must have a corresponding approved template in Meta Business Manager.
 */
export type WhatsAppLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn' | 'gu';

const DEFAULT_LANGUAGE: WhatsAppLanguage = 'en';

/**
 * Resolve the preferred language for a guest.
 * Falls back to 'en' if the provided language is not in our supported set.
 */
function resolveLanguage(preferredLanguage?: string | null): WhatsAppLanguage {
  if (!preferredLanguage) return DEFAULT_LANGUAGE;
  const code = preferredLanguage.toLowerCase().substring(0, 2);
  const supported: WhatsAppLanguage[] = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu'];
  return supported.includes(code as WhatsAppLanguage) ? (code as WhatsAppLanguage) : DEFAULT_LANGUAGE;
}

/**
 * Standard phone normalization for India.
 */
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s+\-()]/g, '');
  if (normalized.startsWith('0')) normalized = normalized.substring(1);
  if (!normalized.startsWith('91')) normalized = `91${normalized}`;
  return normalized;
}

/**
 * Send a raw WhatsApp API call via Meta Graph API.
 */
async function sendMetaApi(payload: object) {
  if (!META_ACCESS_TOKEN || process.env.NODE_ENV === 'test') {
    console.log(`[WHATSAPP MOCK]`, JSON.stringify(payload, null, 2));
    return { success: true, mock: true };
  }

  try {
    const response = await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('[WHATSAPP API ERROR]', error?.response?.data || error.message);
    // Don't throw — WhatsApp failures shouldn't block hotel operations
    return { success: false, error: error?.response?.data || error.message };
  }
}

/**
 * Dispatch an OTP Authentication message via WhatsApp.
 */
export async function dispatchOtpMessage(phone: string, code: string, language?: string) {
  const lang = resolveLanguage(language);

  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhone(phone),
    type: 'template',
    template: {
      name: 'auth_otp_code',
      language: { code: lang },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }]
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: code }]
        }
      ]
    }
  };

  return sendMetaApi(payload);
}

/**
 * Dispatch a Booking Confirmation message via WhatsApp.
 */
export async function dispatchBookingConfirmation(
  phone: string,
  data: { name: string; hotel: string; bookingRef: string; checkInDate: string },
  language?: string
) {
  const lang = resolveLanguage(language);

  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhone(phone),
    type: 'template',
    template: {
      name: 'booking_confirmation_v2',
      language: { code: lang },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: data.name },
            { type: 'text', text: data.hotel },
            { type: 'text', text: data.bookingRef },
            { type: 'text', text: data.checkInDate }
          ]
        }
      ]
    }
  };

  return sendMetaApi(payload);
}

/**
 * Dispatch a Check-In Confirmation via WhatsApp.
 */
export async function dispatchCheckInConfirmation(
  phone: string,
  data: { name: string; hotel: string; roomNumber: string; checkOutDate: string },
  language?: string
) {
  const lang = resolveLanguage(language);

  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhone(phone),
    type: 'template',
    template: {
      name: 'checkin_confirmation_v1',
      language: { code: lang },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: data.name },
            { type: 'text', text: data.hotel },
            { type: 'text', text: data.roomNumber },
            { type: 'text', text: data.checkOutDate }
          ]
        }
      ]
    }
  };

  return sendMetaApi(payload);
}

/**
 * Dispatch a Check-Out & Invoice notification via WhatsApp.
 */
export async function dispatchCheckOutNotification(
  phone: string,
  data: { name: string; hotel: string; totalAmount: string; invoiceUrl?: string },
  language?: string
) {
  const lang = resolveLanguage(language);

  const components: any[] = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: data.name },
        { type: 'text', text: data.hotel },
        { type: 'text', text: data.totalAmount }
      ]
    }
  ];

  // If invoice URL is available, add it as a button
  if (data.invoiceUrl) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: data.invoiceUrl }]
    });
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhone(phone),
    type: 'template',
    template: {
      name: 'checkout_receipt_v1',
      language: { code: lang },
      components
    }
  };

  return sendMetaApi(payload);
}

// Backward-compatible alias
export const sendWhatsAppMessage = dispatchBookingConfirmation;
