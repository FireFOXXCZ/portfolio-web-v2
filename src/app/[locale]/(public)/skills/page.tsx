import { createClient } from '@/lib/supabase/server'
import type { Skill } from '@/lib/supabase/type'
import { SkillsPageClient } from '@/components/sections/skills-page-client'

async function getAllSkills(): Promise<Skill[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('is_visible', true)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Failed to load skills:', error.message)
    return []
  }
  return data ?? []
}

export default async function SkillsPage() {
  const skills = await getAllSkills()

  return <SkillsPageClient skills={skills} />
}