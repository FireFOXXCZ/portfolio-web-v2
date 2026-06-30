'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { ArrowLeft, Search, X, Sparkles } from 'lucide-react'
import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import type { Skill } from '@/lib/supabase/type'
import { getIconBgClass, getCategoryPalette, CategoryIcon } from '@/lib/skill-visual'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// Each card gets its own observer so bars animate on scroll into view
function useCardInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

// ─── Skill icon ───────────────────────────────────────────────────────────────

const LOCAL_ICON_SLUGS = new Set([
  'adobephotoshop',
  'adobeillustrator',
  'adobexd',
  'openjdk',
  'csharp',
  'amazonaws',
  'sveltekit',
  'visualstudiocode',
  'playwright',
  'zustand',
  'css3',
])

function SkillIcon({ skill }: { skill: Skill }) {
  const [failed, setFailed] = useState(false)
  const [localFailed, setLocalFailed] = useState(false)
  const useLocal = skill.icon ? LOCAL_ICON_SLUGS.has(skill.icon) || failed : false
  const showIcon = Boolean(skill.icon) && !(failed && localFailed)
  const bgClass = showIcon
    ? getIconBgClass(skill.icon_color)
    : 'bg-white/[0.05] border-white/[0.08]'
  const iconSrc = skill.icon
    ? useLocal
      ? `/icons/${skill.icon}.png`
      : `https://cdn.simpleicons.org/${skill.icon}/${(skill.icon_color ?? 'ffffff').replace('#', '')}`
    : ''

  return (
    <div className={`relative w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${bgClass}`}>
      {showIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc}
          alt=""
          className="w-5 h-5 object-contain"
          onError={() => useLocal ? setLocalFailed(true) : setFailed(true)}
        />
      ) : (
        <span className="text-lg opacity-30">⚡</span>
      )}
    </div>
  )
}

// ─── Skill card ───────────────────────────────────────────────────────────────

function SkillCard({ skill, index, locale }: { skill: Skill; index: number; locale: string }) {
  const t = useTranslations('sections.skillsPreview')
  const palette = getCategoryPalette(skill.category)
  const { ref, inView } = useCardInView()

  const description =
    locale === 'en'
      ? (skill.description_en ?? skill.description_cs)
      : (skill.description_cs ?? skill.description_en)

  const delay = Math.min(index % 4, 3) * 80

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-white/[0.07] bg-white dark:bg-[#0f0f14] p-5 flex flex-col gap-4 transition-all duration-500 hover:border-gray-300 dark:hover:border-white/[0.18] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/[0.08] dark:hover:shadow-black/40 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Ambient glow — brightens on hover */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none transition-opacity duration-500 group-hover:opacity-60 ${palette.glow}`}
      />
      {/* Subtle bottom-left counter-glow */}
      <div
        className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl opacity-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-20 ${palette.glow}`}
      />

      {/* Header row */}
      <div className="relative flex items-center gap-3">
        <SkillIcon skill={skill} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
            {skill.name}
          </h3>
          {skill.category && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${palette.badgeBg} ${palette.badgeText}`}
            >
              <CategoryIcon category={skill.category} size={9} />
              {skill.category}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="relative text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 flex-1">
          {description}
        </p>
      )}

      {/* Level */}
      <div className="relative flex flex-col gap-1.5 mt-auto">
        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
          <span className="uppercase tracking-wider font-medium">{t('level')}</span>
          <span className={`font-bold ${palette.badgeText}`}>
            {t(`levelLabels.${Math.min(5, Math.max(1, skill.level))}`)}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, si) => (
            <div
              key={si}
              className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden"
            >
              <div
                className={`h-full rounded-full origin-left transition-transform duration-700 ease-out ${si < skill.level ? palette.fill : ''}`}
                style={{
                  transform: inView && si < skill.level ? 'scaleX(1)' : 'scaleX(0)',
                  transitionDelay: `${delay + si * 80 + 150}ms`,
                }}
              />
            </div>
          ))}
        </div>
        {skill.years_experience != null && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            {t('yearsExperience', { count: skill.years_experience })}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Category section (used when no filter/search active) ────────────────────

function CategorySection({
  category,
  skills,
  locale,
}: {
  category: string
  skills: Skill[]
  locale: string
}) {
  const { ref, inView } = useInView(0.05)
  const palette = getCategoryPalette(category)

  return (
    <section ref={ref} className="mb-14">
      {/* Section header */}
      <div
        className={`flex items-center gap-3 mb-5 transition-all duration-500 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${palette.badgeBg}`}>
          <CategoryIcon category={category} size={13} className={palette.badgeText} />
        </div>
        <h2 className={`text-sm font-black uppercase tracking-widest ${palette.badgeText}`}>
          {category}
        </h2>
        <div className="flex-1 h-px bg-gray-200/60 dark:bg-white/[0.06]" />
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
          {skills.length}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {skills.map((skill, i) => (
          <SkillCard key={skill.id} skill={skill} index={i} locale={locale} />
        ))}
      </div>
    </section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Props = { skills: Skill[] }

export function SkillsPageClient({ skills }: Props) {
  const { ref: heroRef, inView: heroInView } = useInView(0.05)
  const t = useTranslations('sections.skillsPage')
  const tPreview = useTranslations('sections.skillsPreview')
  const locale = useLocale()

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const categories = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const s of skills) {
      if (s.category && !seen.has(s.category)) {
        seen.add(s.category)
        result.push(s.category)
      }
    }
    return result
  }, [skills])

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of skills) {
      if (s.category) map[s.category] = (map[s.category] ?? 0) + 1
    }
    return map
  }, [skills])

  const filtered = useMemo(() => {
    let list = activeCategory
      ? skills.filter((s) => s.category === activeCategory)
      : skills
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description_cs?.toLowerCase().includes(q) ||
          s.description_en?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q)
      )
    }
    return list
  }, [skills, activeCategory, search])

  // Group by category for the default grouped view
  const grouped = useMemo(() => {
    const map: Record<string, Skill[]> = {}
    for (const s of filtered) {
      const cat = s.category ?? '—'
      if (!map[cat]) map[cat] = []
      map[cat].push(s)
    }
    // Preserve original category order
    return categories
      .filter((c) => map[c])
      .map((c) => ({ category: c, skills: map[c] }))
  }, [filtered, categories])

  const isFiltering = Boolean(activeCategory || search.trim())

  const reset = useCallback(() => {
    setSearch('')
    setActiveCategory(null)
  }, [])

  return (
    <main className="min-h-screen bg-gray-50/50 dark:bg-[#090910]">

      {/* ── Decorative top gradient strip */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* ── Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors mb-12 group"
        >
          <ArrowLeft
            size={12}
            className="group-hover:-translate-x-0.5 transition-transform duration-200"
          />
          {t('backHome')}
        </Link>

        {/* ── Hero header */}
        <div
          ref={heroRef}
          className={`mb-12 transition-all duration-600 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">
              {tPreview('eyebrow')}
            </p>
            <Sparkles size={11} className="text-orange-400 opacity-70" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            {tPreview('title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* ── Controls */}
        <div
          className={`mb-10 flex flex-col gap-4 transition-all duration-500 delay-150 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          {/* Search + count row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={13}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-400/60 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums sm:ml-auto">
              {t('countLabel', { filtered: filtered.length, total: skills.length })}
            </p>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                activeCategory === null
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              {t('filterAll')}
              <span
                className={`text-[10px] px-1.5 py-px rounded-full font-semibold tabular-nums ${
                  activeCategory === null
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-200 dark:bg-white/[0.08] text-gray-500'
                }`}
              >
                {skills.length}
              </span>
            </button>

            {categories.map((cat) => {
              const palette = getCategoryPalette(cat)
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 capitalize ${
                    isActive
                      ? `${palette.fill} text-white shadow-lg scale-[1.02]`
                      : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                  }`}
                >
                  <CategoryIcon category={cat} size={10} />
                  {cat}
                  <span
                    className={`text-[10px] px-1.5 py-px rounded-full font-semibold tabular-nums ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-200 dark:bg-white/[0.08] text-gray-500'
                    }`}
                  >
                    {countByCategory[cat] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content */}
        {filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mb-4 text-2xl opacity-40">
              🔍
            </div>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('emptyTitle')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
              {t('emptyDesc')}
            </p>
            <button
              onClick={reset}
              className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
            >
              {t('resetFilters')}
            </button>
          </div>
        ) : isFiltering ? (
          /* Flat grid when filtering/searching */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((skill, i) => (
              <SkillCard key={skill.id} skill={skill} index={i} locale={locale} />
            ))}
          </div>
        ) : (
          /* Grouped by category — the default view */
          grouped.map(({ category, skills: catSkills }) => (
            <CategorySection
              key={category}
              category={category}
              skills={catSkills}
              locale={locale}
            />
          ))
        )}
      </div>
    </main>
  )
}