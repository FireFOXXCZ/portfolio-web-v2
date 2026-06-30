import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/supabase/type'
import { ProjectsList } from '@/components/admin/projects-list'
import { FolderOpen } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('order_index', { ascending: true })
    .returns<Project[]>()

  const projects = data ?? []
  const publishedCount = projects.filter(p => p.published).length
  const featuredCount = projects.filter(p => p.featured).length

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FolderOpen size={18} className="text-orange-400" />
          Projekty
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
          {projects.length > 0
            ? `${projects.length} projektů · ${publishedCount} publikovaných · ${featuredCount} featured`
            : 'Zatím žádné projekty'}
        </p>
      </div>

      <ProjectsList initialProjects={projects} />
    </div>
  )
}