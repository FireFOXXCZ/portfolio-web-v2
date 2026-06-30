'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, SearchX, FolderOpen, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { Project } from '@/lib/supabase/type'
import { ProjectCard } from '@/components/admin/project-card'
import { ProjectForm } from '@/components/admin/project-form'
import { BulkActionsBar } from '@/components/admin/bulk-actions-bar'
import { reorderProjects } from '@/app/[locale]/admin/(protected)/projects/actions'

const PAGE_SIZE = 5

type Filter = 'all' | 'published' | 'draft' | 'featured'
type StatusFilter = 'all' | Project['status']

type Props = { initialProjects: Project[] }

export function ProjectsList({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects)

  // Synchronizace s novými daty po router.refresh() (po create/update/delete/toggle)
  useEffect(() => {
    setProjects(initialProjects)
  }, [initialProjects])
  const [filter, setFilter] = useState<Filter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [editProject, setEditProject] = useState<Project | null | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  // Hromadný výběr
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
  if (searchParams.get('new') === '1') {
    setEditProject(null)
    router.replace('/admin/projects')
    return
  }

  const editId = searchParams.get('edit')
  if (editId) {
    const project = projects.find(p => p.id === editId)
    if (project) setEditProject(project)
    router.replace('/admin/projects')
  }
}, [searchParams, router, projects])

  // Reset stránky při změně filtru/vyhledávání
  useEffect(() => {
    setPage(1)
  }, [filter, statusFilter, q])

  const filtered = projects.filter(p => {
    if (filter === 'published' && !p.published) return false
    if (filter === 'draft' && p.published) return false
    if (filter === 'featured' && !p.featured) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (q) {
      const ql = q.toLowerCase()
      return (
        p.name.toLowerCase().includes(ql) ||
        (p.description_cs?.toLowerCase().includes(ql) ?? false) ||
        p.tags.some(t => t.includes(ql)) ||
        p.tech_stack.some(t => t.toLowerCase().includes(ql)) ||
        (p.category?.toLowerCase().includes(ql) ?? false)
      )
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const allPaginatedSelected = paginated.length > 0 && paginated.every(p => selectedIds.has(p.id))

  const toggleSelectAllOnPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allPaginatedSelected) {
        paginated.forEach(p => next.delete(p.id))
      } else {
        paginated.forEach(p => next.add(p.id))
      }
      return next
    })
  }

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Vše', count: projects.length },
    { key: 'published', label: 'Publikované', count: projects.filter(p => p.published).length },
    { key: 'draft', label: 'Skryté', count: projects.filter(p => !p.published).length },
    { key: 'featured', label: 'Featured', count: projects.filter(p => p.featured).length },
  ]

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Všechny stavy' },
    { key: 'completed', label: 'Dokončeno' },
    { key: 'in_progress', label: 'Probíhá' },
    { key: 'archived', label: 'Archivováno' },
  ]

  // Jednoduchý drag & drop reorder (bez externí lib)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => setDragIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const reordered = [...projects]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, moved)
    const withIndex = reordered.map((p, i) => ({ ...p, order_index: i }))
    setProjects(withIndex)
    setDragIndex(index)
  }
  const handleDragEnd = () => {
    if (dragIndex === null) return
    setDragIndex(null)
    startTransition(() =>
      reorderProjects(projects.map((p, i) => ({ id: p.id, order_index: i })))
    )
  }

  const hasActiveFilter = filter !== 'all' || statusFilter !== 'all' || q.length > 0

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Publish tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 w-fit shrink-0">
            {tabs.map(tab => {
              const active = tab.key === filter
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    active
                      ? 'bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-orange-500/10 text-orange-500'
                      : 'bg-gray-200/70 dark:bg-white/5 text-gray-400 dark:text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Hledat projekty…"
              className="w-full h-9 pl-3 pr-3 rounded-xl border border-white/[0.07] bg-white/[0.03] text-[13px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 transition-colors"
            />
          </div>

          <div className="flex-1" />

          {/* New project button */}
          <button
            onClick={() => setEditProject(null)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-[13px] font-semibold transition-all shrink-0"
          >
            <Plus size={15} />
            Nový projekt
          </button>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-lg border transition-all ${
                statusFilter === t.key
                  ? 'border-orange-500/40 text-orange-400 bg-orange-500/[0.06]'
                  : 'border-white/[0.07] text-white/30 hover:text-white/55 hover:border-white/[0.12]'
              }`}
            >
              {t.label}
            </button>
          ))}
          {isPending && <Loader2 size={13} className="text-white/30 animate-spin ml-1" />}
        </div>
      </div>

      {/* Hromadný výběr */}
      <BulkActionsBar selectedIds={[...selectedIds]} onClear={clearSelection} />

      {/* List */}
      <div className="space-y-3">
        {paginated.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAllOnPage}
            className="flex items-center gap-2 px-1 py-1 group/selectall"
          >
            <span
              className={`flex items-center justify-center w-4 h-4 rounded border transition-all ${
                allPaginatedSelected
                  ? 'bg-orange-500 border-orange-500'
                  : 'bg-white/[0.03] border-white/15 group-hover/selectall:border-white/30'
              }`}
            >
              {allPaginatedSelected && <Check size={10} className="text-white" strokeWidth={3} />}
            </span>
            <span className="text-[11px] text-white/30 group-hover/selectall:text-white/50 transition-colors">
              Vybrat vše na stránce ({paginated.length})
            </span>
          </button>
        )}

        {paginated.length ? (
          paginated.map((project) => {
            const globalIndex = projects.findIndex(p => p.id === project.id)
            return (
              <div
                key={project.id}
                draggable
                onDragStart={() => handleDragStart(globalIndex)}
                onDragOver={e => handleDragOver(e, globalIndex)}
                onDragEnd={handleDragEnd}
                className={`transition-opacity ${dragIndex === globalIndex ? 'opacity-50' : 'opacity-100'}`}
              >
                <ProjectCard
                  project={project}
                  onEdit={p => setEditProject(p)}
                  dragHandleProps={{}}
                  selected={selectedIds.has(project.id)}
                  onToggleSelect={toggleSelect}
                />
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              {hasActiveFilter
                ? <SearchX size={22} className="text-orange-400 opacity-50" />
                : <FolderOpen size={22} className="text-orange-400 opacity-50" />
              }
            </div>
            {hasActiveFilter ? (
              <>
                <p className="text-sm text-gray-400 dark:text-gray-600">Nic nenalezeno</p>
                <button
                  onClick={() => { setFilter('all'); setStatusFilter('all'); setQ('') }}
                  className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                >
                  Zrušit filtr
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 dark:text-gray-600">Zatím žádné projekty</p>
                <button
                  onClick={() => setEditProject(null)}
                  className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                >
                  Přidat první projekt
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        {/* Info */}
        <p className="text-[11px] tabular-nums text-white/30">
          {filtered.length === 0
            ? 'Žádné projekty'
            : `${filtered.length} ${filtered.length === 1 ? 'projekt' : filtered.length < 5 ? 'projekty' : 'projektů'} · stránka ${currentPage} z ${totalPages}`}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {/* Prev */}
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-7 h-7 rounded-lg border text-[13px] transition-all ${
              currentPage === 1
                ? 'border-white/[0.05] bg-transparent text-white/15 cursor-not-allowed'
                : 'border-white/[0.12] bg-white/[0.04] text-white/50 hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/[0.06]'
            }`}
          >
            <ChevronLeft size={13} />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-semibold tabular-nums transition-all ${
                  num === currentPage
                    ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.35)] border border-orange-500'
                    : 'border border-white/[0.10] bg-white/[0.03] text-white/40 hover:border-orange-500/30 hover:text-orange-400 hover:bg-orange-500/[0.05]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Next */}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center w-7 h-7 rounded-lg border text-[13px] transition-all ${
              currentPage === totalPages
                ? 'border-white/[0.05] bg-transparent text-white/15 cursor-not-allowed'
                : 'border-white/[0.12] bg-white/[0.04] text-white/50 hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/[0.06]'
            }`}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Modal */}
      {editProject !== undefined && (
        <ProjectForm
          project={editProject}
          onClose={() => setEditProject(undefined)}
        />
      )}
    </>
  )
}