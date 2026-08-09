import { en, type Messages } from '@/i18n/en'
import { ar } from '@/i18n/ar'
import type { Locale } from '@/types/ar'

const catalogs: Record<Locale, Messages> = {
  en: en as Messages,
  ar: ar as unknown as Messages,
}

let currentLocale: Locale = 'en'

export function setLocale(locale: Locale): void {
  currentLocale = locale
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(): Messages {
  return catalogs[currentLocale] ?? en
}

export { en, ar }
