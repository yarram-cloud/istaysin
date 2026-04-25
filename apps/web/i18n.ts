import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'kn', 'ml', 'gu', 'pa'];

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v4: requestLocale is a Promise that resolves to the locale
  const requested = await requestLocale;
  const locale = locales.includes(requested as string) ? (requested as string) : 'en';

  let messages;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    // Fallback to english if translation missing
    messages = (await import(`./messages/en.json`)).default;
  }

  return {
    locale,
    messages,
    timeZone: 'Asia/Kolkata'
  };
});
