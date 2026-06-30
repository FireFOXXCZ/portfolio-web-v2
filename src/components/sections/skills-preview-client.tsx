'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import type { Skill } from '@/lib/supabase/type'
import { getIconBgClass, getCategoryPalette, CategoryIcon } from '@/lib/skill-visual'

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

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
  const bgClass = showIcon ? getIconBgClass(skill.icon_color) : 'bg-white/[0.05] border-white/[0.08]'
  const iconSrc = skill.icon
    ? useLocal
      ? `/icons/${skill.icon}.png`
      : `https://cdn.simpleicons.org/${skill.icon}/${(skill.icon_color ?? 'ffffff').replace('#', '')}`
    : ''

  return (
    <div className={`relative w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 transition-colors ${bgClass}`}>
      {showIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc}
          alt=""
          className="w-7 h-7 object-contain"
          onError={() => useLocal ? setLocalFailed(true) : setFailed(true)}
        />
      ) : (
        <span className="text-2xl opacity-30">⚡</span>
      )}
    </div>
  )
}

type Props = { skills: Skill[] }

export function SkillsPreviewClient({ skills }: Props) {
  const { ref, inView } = useInView()
  const t = useTranslations('sections.skillsPreview')
  const locale = useLocale()

  // Defensive: the server component already limits this to 3, but a stray
  // extra item shouldn't break the "only 3 main skills" intent of this section.
  const featured = skills.slice(0, 3)

  return (
    <section className="py-24 px-6 bg-gray-50/50 dark:bg-white/[0.01]" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className={`flex items-end justify-between mb-12 transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-2">{t('eyebrow')}</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{t('title')}</h2>
          </div>
          <Link
            href="/skills"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors group"
          >
            {t('allSkills')}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((skill, i) => {
            const palette = getCategoryPalette(skill.category)
            const description = locale === 'en'
              ? (skill.description_en ?? skill.description_cs)
              : (skill.description_cs ?? skill.description_en)

            return (
              <div
                key={skill.id}
                className={`relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-white/[0.07] bg-white dark:bg-[#0f0f14] p-6 flex flex-col gap-5 transition-all duration-500 hover:border-gray-300 dark:hover:border-white/[0.16] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Ambient glow tinted to the skill's category — the one
                    "signature" flourish, everything else stays quiet */}
                <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-50 pointer-events-none ${palette.glow}`} />

                <div className="relative flex items-center gap-4">
                  <SkillIcon skill={skill} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{skill.name}</h3>
                    {skill.category && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-1.5 ${palette.badgeBg} ${palette.badgeText}`}>
                        <CategoryIcon category={skill.category} size={10} />
                        {skill.category}
                      </span>
                    )}
                  </div>
                </div>

                {description && (
                  <p className="relative text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {description}
                  </p>
                )}

                <div className="relative mt-auto flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                    <span>{t('level')}</span>
                    <span className={`font-semibold ${palette.badgeText}`}>
                      {t(`levelLabels.${Math.min(5, Math.max(1, skill.level))}`)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, si) => (
                      <div key={si} className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full origin-left transition-transform duration-500 ${si < skill.level ? palette.fill : ''}`}
                          style={{
                            transform: inView && si < skill.level ? 'scaleX(1)' : 'scaleX(0)',
                            transitionDelay: `${i * 120 + si * 70 + 300}ms`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {skill.years_experience != null && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {t('yearsExperience', { count: skill.years_experience })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/skills" className="flex items-center gap-1.5 text-sm font-semibold text-orange-500">
            {t('allSkills')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}