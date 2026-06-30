// File: app/[locale]/(public)/layout.tsx
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { SiteChrome } from '@/components/ui/site-chrome'

async function getProfile() {
  try {
    const anon = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await anon
      .from('profile')
      .select('github, discord, discord_url, discord_server_name, email, cv_url')
      .single()

    if (error) return null

    // discord_display_name z auth session
    let discord_display_name: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const discordIdentity = user?.identities?.find(i => i.provider === 'discord')
      discord_display_name =
        discordIdentity?.identity_data?.custom_claims?.global_name
        ?? discordIdentity?.identity_data?.full_name
        ?? null
    } catch {
      // veřejná stránka bez session – nevadí
    }

    return { ...data, discord_display_name }
  } catch {
    return null
  }
}

async function getProjectCount() {
  try {
    const anon = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { count, error } = await anon
      .from('projects')
      .select('*', { count: 'exact', head: true })

    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [profile, projectCount] = await Promise.all([getProfile(), getProjectCount()])
  return <SiteChrome profile={profile} projectCount={projectCount}>{children}</SiteChrome>
}