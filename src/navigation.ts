// src/navigation.ts
import { createNavigation } from 'next-intl/navigation'

export const locales = ['cs', 'en'] as const
export const localePrefix = 'as-needed'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({ 
    locales, 
    localePrefix,
    defaultLocale: 'cs' // <--- TENTO ŘÁDEK CHYBĚL, PRÁVĚ TEN TO OPRAVÍ!
  })