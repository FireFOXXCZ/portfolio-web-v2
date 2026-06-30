import { createClient } from '@/lib/supabase/server'
import { SkillsList } from '@/components/admin/skills-list'

export default async function SkillsPage() {
  const supabase = await createClient()
  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .order('order_index')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white/90">Dovednosti</h1>
          <p className="text-sm text-white/40 mt-0.5">Správa technologií a skillů</p>
        </div>
      </div>
      <SkillsList initialSkills={skills ?? []} />
    </div>
  )
}