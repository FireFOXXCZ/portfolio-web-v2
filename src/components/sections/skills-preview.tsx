import { createClient } from '@/lib/supabase/server'
import type { Skill } from '@/lib/supabase/type'
import { SkillsPreviewClient } from '@/components/sections/skills-preview-client'

// Shows the 3 skills the admin has placed first in /admin/skills (by
// order_index) — i.e. exactly the curation already set up there, not "all
// skills" and not necessarily the highest level. Only visible skills qualify.
//
// NOTE: this assumes a Supabase server client at '@/lib/supabase/server'
// exporting `createClient()` (the standard Next.js + Supabase SSR setup) and
// a `skills` table matching the `Skill` type. Adjust the import path / table
// name below if your project's setup differs.
async function getFeaturedSkills(): Promise<Skill[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('is_visible', true)
    .order('order_index', { ascending: true })
    .limit(3)

  if (error) {
    console.error('Failed to load featured skills:', error.message)
    return []
  }
  return data ?? []
}

export async function SkillsPreview() {
  const skills = await getFeaturedSkills()
  if (!skills.length) return null

  return <SkillsPreviewClient skills={skills} />
}