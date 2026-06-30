import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

const locales = ['cs', 'en']

const messageImports = {
  cs: () => import('./messages/cs.json'),
  en: () => import('./messages/en.json'),
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale

  if (!locale || !locales.includes(locale)) notFound()

  const messages = (await messageImports[locale as keyof typeof messageImports]()).default

  return {
    locale,
    messages,
  }
})