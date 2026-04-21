import QRCode from 'qrcode';

/**
 * Generates a UPI Deep Link and its corresponding Base64 QR Code image.
 * Matches the format: upi://pay?pa=[UPI_ID]&pn=[PAYEE_NAME]&am=[AMOUNT]&tr=[TRANSACTION_ID]&cu=INR
 */
export async function generateUpiQrCode(
  upiId: string,
  payeeName: string,
  amount: number,
  transactionId: string
): Promise<{ deepLink: string; qrCodeBase64: string }> {
  // Construct standard UPI deep link format
  const deepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&tr=${encodeURIComponent(transactionId)}&cu=INR`;

  try {
    const qrCodeBase64 = await QRCode.toDataURL(deepLink, {
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    
    return { deepLink, qrCodeBase64 };
  } catch (err) {
    console.error('Failed to generate QR code', err);
    throw new Error('Failed to generate UPI QR code');
  }
}
