'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, SearchX, Zap, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Skill } from '@/lib/supabase/type'
import { SkillCard } from '@/components/admin/skill-card'
import { SkillForm } from '@/components/admin/skill-form'
import { reorderSkills } from '@/app/[locale]/admin/(protected)/skills/actions'
import { CategoryIcon } from '@/lib/skill-visual'

type Filter = 'all' | 'visible' | 'hidden'

type Props = { initialSkills: Skill[] }

const PAGE_SIZE = 8

// Builds a compact page list with ellipsis gaps, e.g. [1, '…', 4, 5, 6, '…', 12]
function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = Array.from(pages).filter(p => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) result.push('…')
    result.push(p)
  })
  return result
}

export function SkillsList({ initialSkills }: Props) {
  const [skills, setSkills] = useState(() => {
    // Seřadit a normalizovat order_index hned při prvním renderu
    return [...initialSkills].sort((a, b) => a.order_index - b.order_index)
  })

  useEffect(() => {
    // Při každé změně dat ze serveru znovu seřadit a opravit případné
    // duplicity nebo mezery v order_index (0,0,2,5 → 0,1,2,3)
    const sorted = [...initialSkills].sort((a, b) => a.order_index - b.order_index)
    const needsFix = sorted.some((s, i) => s.order_index !== i)
    if (needsFix) {
      const fixed = sorted.map((s, i) => ({ ...s, order_index: i }))
      setSkills(fixed)
      // Uložit opravu do DB tiše na pozadí (startTransition je stabilní ref, deps warning je false positive)
       
      reorderSkills(fixed.map((s, i) => ({ id: s.id, order_index: i })))
    } else {
      setSkills(sorted)
    }
   
  }, [initialSkills])

  const [filter, setFilter] = useState<Filter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [editSkill, setEditSkill] = useState<Skill | null | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const categories = ['all', ...Array.from(new Set(skills.map(s => s.category).filter(Boolean) as string[]))]

  const filtered = skills.filter(s => {
    if (filter === 'visible' && !s.is_visible) return false
    if (filter === 'hidden' && s.is_visible) return false
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
    if (q) {
      const ql = q.toLowerCase()
      return (
        s.name.toLowerCase().includes(ql) ||
        (s.category?.toLowerCase().includes(ql) ?? false) ||
        (s.description_cs?.toLowerCase().includes(ql) ?? false) ||
        (s.description_en?.toLowerCase().includes(ql) ?? false)
      )
    }
    return true
  })

  const hasActiveFilter = filter !== 'all' || categoryFilter !== 'all' || q.length > 0

  // Reset to page 1 whenever the visible set changes shape
  useEffect(() => {
    setPage(1)
  }, [filter, categoryFilter, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Drag & drop je povolen pokud nejsou aktivní filtry.
  // Při více stránkách drag stále funguje — operuje nad celým skills polem,
  // takže přesun na aktuální stránce správně přeskládá globální pořadí.
  const canReorder = !hasActiveFilter

  // Drag & drop reorder
  const handleDragStart = (index: number) => {
    if (!canReorder) return
    setDragIndex(index)
  }
  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canReorder) return
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const reordered = [...skills]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, moved)
    const withIndex = reordered.map((s, i) => ({ ...s, order_index: i }))
    setSkills(withIndex)
    setDragIndex(index)
  }
  const handleDragEnd = () => {
    if (dragIndex === null) return
    setDragIndex(null)
    startTransition(() =>
      reorderSkills(skills.map((s, i) => ({ id: s.id, order_index: i })))
    )
  }

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Vše', count: skills.length },
    { key: 'visible', label: 'Viditelné', count: skills.filter(s => s.is_visible).length },
    { key: 'hidden', label: 'Skryté', count: skills.filter(s => !s.is_visible).length },
  ]

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
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
              placeholder="Hledat skilly…"
              className="w-full h-9 pl-3 pr-3 rounded-xl border border-white/[0.07] bg-white/[0.03] text-[13px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 transition-colors"
            />
          </div>

          <div className="flex-1" />

          {/* New skill button */}
          <button
            onClick={() => setEditSkill(null)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-[13px] font-semibold transition-all shrink-0"
          >
            <Plus size={15} />
            Nový skill
          </button>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-lg border transition-all ${
                categoryFilter === cat
                  ? 'border-orange-500/40 text-orange-400 bg-orange-500/[0.06]'
                  : 'border-white/[0.07] text-white/30 hover:text-white/55 hover:border-white/[0.12]'
              }`}
            >
              {cat !== 'all' && <CategoryIcon category={cat} size={11} />}
              {cat === 'all' ? 'Všechny kategorie' : cat}
            </button>
          ))}
          {isPending && <Loader2 size={13} className="text-white/30 animate-spin ml-1" />}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 mt-2">
        {paginated.length ? (
          paginated.map(skill => {
            const globalIndex = skills.findIndex(s => s.id === skill.id)
            return (
              <div
                key={skill.id}
                draggable={canReorder}
                onDragStart={() => handleDragStart(globalIndex)}
                onDragOver={e => handleDragOver(e, globalIndex)}
                onDragEnd={handleDragEnd}
                className={`transition-opacity ${dragIndex === globalIndex ? 'opacity-50' : 'opacity-100'}`}
              >
                <SkillCard
                  skill={skill}
                  onEdit={s => setEditSkill(s)}
                  dragHandleProps={{}}
                  reorderDisabled={!canReorder}
                />
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              {hasActiveFilter
                ? <SearchX size={22} className="text-orange-400 opacity-50" />
                : <Zap size={22} className="text-orange-400 opacity-50" />
              }
            </div>
            {hasActiveFilter ? (
              <>
                <p className="text-sm text-gray-400 dark:text-gray-600">Nic nenalezeno</p>
                <button
                  onClick={() => { setFilter('all'); setCategoryFilter('all'); setQ('') }}
                  className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                >
                  Zrušit filtr
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 dark:text-gray-600">Zatím žádné skilly</p>
                <button
                  onClick={() => setEditSkill(null)}
                  className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                >
                  Přidat první skill
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-[11px] text-white/30">
            Zobrazeno {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} z {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/[0.14] disabled:opacity-30 disabled:hover:text-white/40 disabled:hover:border-white/[0.07] transition-all"
              aria-label="Předchozí strana"
            >
              <ChevronLeft size={14} />
            </button>
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-[11px] text-white/20 select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[2rem] h-8 px-2 rounded-lg text-[12px] font-semibold transition-all ${
                    p === page
                      ? 'bg-orange-500 text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/[0.14] disabled:opacity-30 disabled:hover:text-white/40 disabled:hover:border-white/[0.07] transition-all"
              aria-label="Další strana"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Form modal */}
      {editSkill !== undefined && (
        <SkillForm
          skill={editSkill}
          onClose={() => setEditSkill(undefined)}
        />
      )}
    </>
  )
}