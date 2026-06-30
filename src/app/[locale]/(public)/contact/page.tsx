import { getTranslations } from 'next-intl/server'
import { ContactForm } from '@/components/sections/contact-form'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/type'

async function getProfile(): Promise<Profile | null> {
  try {
    const anon = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await anon.from('profile').select('*').single()
    if (error) return null
    return data as Profile
  } catch {
    return null
  }
}

export default async function ContactPage() {
  const t = await getTranslations('sections.contactPage')
  const profile = await getProfile()

  return (
    <main className="relative min-h-screen pt-24 pb-20 px-4 overflow-hidden">

      {/* Dekorativní pozadí */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Oranžový glow vlevo nahoře */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)' }}
        />
        {/* Fialový glow vpravo dole */}
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }}
        />
        {/* Jemná mřížka */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Diagonální accent linka */}
        <div
          className="absolute top-0 left-1/2 w-px h-full opacity-[0.04]"
          style={{ background: 'linear-gradient(to bottom, transparent, #f97316 40%, #a855f7 70%, transparent)' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <p className="text-xs font-semibold text-orange-400/80 uppercase tracking-widest">
              {t('eyebrow')}
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <ContactForm profile={profile} />
      </div>
    </main>
  )
}