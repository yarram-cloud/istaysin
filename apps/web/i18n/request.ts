import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'gu', 'ml', 'ar', 'fr', 'de'];

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v4: requestLocale is a Promise that resolves to the locale
  const requested = await requestLocale;
  const locale = locales.includes(requested as string) ? (requested as string) : 'en';

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    // If the locale file doesn't exist, fallback to English
    messages = (await import(`../messages/en.json`)).default;
  }

  return {
    locale,
    messages
  };
});
