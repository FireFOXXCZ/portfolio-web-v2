import { LoginForm } from '@/components/admin/login-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()
  const t = await getTranslations('admin') // Načtení překladů na serveru

  if (user) {
    redirect(locale === 'cs' ? '/admin/dashboard' : '/en/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070709] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-black/5 dark:shadow-black/40 p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/25 mb-4">
              <span className="text-white font-black text-lg leading-none">fx</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')} {/* Přeložený nadpis */}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              firefoxx.online
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          © {new Date().getFullYear()} firefoxx.online
        </p>
      </div>
    </div>
  )
}