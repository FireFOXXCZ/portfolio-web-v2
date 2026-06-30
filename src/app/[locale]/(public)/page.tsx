import { HeroSection } from '@/components/sections/hero-section'
import { ProjectsPreview } from '@/components/sections/projects-preview'
import { SkillsPreview } from '@/components/sections/skills-preview'
import { BlogPreview } from '@/components/sections/blog-preview'
import { ContactCta } from '@/components/sections/contact-cta'
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

async function getProjectCount(): Promise<number> {
  try {
    const anon = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { count } = await anon
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('published', true)
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function Home() {
  const [profile, projectCount] = await Promise.all([
    getProfile(),
    getProjectCount(),
  ])

  return (
    <main className="overflow-x-hidden">
      <HeroSection profile={profile} projectCount={projectCount} />
      <ProjectsPreview />
      <SkillsPreview />
      <BlogPreview />
      <ContactCta />
    </main>
  )
}