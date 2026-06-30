'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Pencil, Trash2, GripVertical, Eye, EyeOff, History, Calendar, Clock } from 'lucide-react'
import type { Skill } from '@/lib/supabase/type'
import { toggleSkillVisible, deleteSkill } from '@/app/[locale]/admin/(protected)/skills/actions'
import { ConfirmDeleteModal } from '@/components/admin/confirm-delete-modal'
import { getIconBgClass, getCategoryPalette, getLevelLabel, CategoryIcon, type CategoryPalette } from '@/lib/skill-visual'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function timeAgo(dateStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diffMin < 1) return 'právě teď'
  if (diffMin < 60) return `před ${diffMin} min`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `před ${diffHour} h`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return 'včera'
  if (diffDay < 30) return `před ${diffDay} dny`
  return formatDate(dateStr)
}

function LevelBar({ level, palette }: { level: number; palette: CategoryPalette | null }) {
  const fillClass = palette?.fill ?? 'bg-orange-500'
  const shadowClass = palette?.shadow ?? 'shadow-[0_0_6px_rgba(249,115,22,0.55)]'
  const labelClass = palette?.badgeText ?? 'text-white/40'
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`w-5 h-1.5 rounded-full transition-colors ${
              i < level
                ? `${fillClass} ${shadowClass}`
                : 'bg-white/[0.08]'
            }`}
          />
        ))}
      </div>
      <span className={`text-[11px] font-semibold ${labelClass}`}>{getLevelLabel(level)}</span>
    </div>
  )
}

type Props = {
  skill: Skill
  onEdit: (skill: Skill) => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  reorderDisabled?: boolean
}

export function SkillCard({ skill, onEdit, dragHandleProps, reorderDisabled }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [iconFailed, setIconFailed] = useState(false)

  const handleToggle = () => {
    startTransition(async () => {
      await toggleSkillVisible(skill.id, !skill.is_visible)
      router.refresh()
    })
  }

  const handleConfirmDelete = () => {
    startTransition(async () => {
      await deleteSkill(skill.id)
      router.refresh()
      setShowDeleteModal(false)
    })
  }

  const wasEdited = skill.updated_at && skill.created_at &&
    new Date(skill.updated_at).getTime() - new Date(skill.created_at).getTime() > 60_000

  const categoryPalette = skill.category ? getCategoryPalette(skill.category) : null

  // Locale comes from the /[locale]/... route segment. Falls back to the
  // other language if the current locale's description wasn't filled in.
  const locale = pathname?.split('/')[1] === 'en' ? 'en' : 'cs'
  const description = locale === 'en'
    ? (skill.description_en ?? skill.description_cs)
    : (skill.description_cs ?? skill.description_en)

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

  const showIcon = Boolean(skill.icon) && !iconFailed
  const iconBgClass = showIcon ? getIconBgClass(skill.icon_color) : 'bg-white/[0.04] border-white/[0.07]'
  const iconSrc = skill.icon
    ? LOCAL_ICON_SLUGS.has(skill.icon)
      ? `/icons/${skill.icon}.png`
      : `https://cdn.simpleicons.org/${skill.icon}/${(skill.icon_color ?? 'ffffff').replace('#', '')}`
    : ''

  return (
    <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
      skill.is_visible
        ? `bg-white/[0.025] border-white/[0.07] ${categoryPalette?.hoverBorder ?? 'hover:border-white/[0.16]'} hover:bg-white/[0.04] hover:shadow-xl hover:shadow-black/20`
        : 'bg-white/[0.015] border-white/[0.05] border-dashed hover:border-white/[0.1]'
    }`}>

      {/* Subtle category-tinted wash across the whole card */}
      {categoryPalette && skill.is_visible && (
        <div className={`absolute inset-0 pointer-events-none ${categoryPalette.cardWash}`} />
      )}

      <div className="relative z-10 flex gap-4 p-4 sm:p-5">

      {/* Drag handle */}
      <div
        {...dragHandleProps}
        title={reorderDisabled ? 'Pro řazení vypněte filtry a stránkování' : 'Přetáhnout pro změnu pořadí'}
        className={`hidden sm:flex items-center self-stretch shrink-0 transition-colors ${
          reorderDisabled
            ? 'cursor-not-allowed text-white/10'
            : 'cursor-grab active:cursor-grabbing text-white/15 hover:text-white/40'
        }`}
      >
        <GripVertical size={16} />
      </div>

      {/* Icon */}
      <div className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center self-center transition-colors ${iconBgClass} ${!skill.is_visible ? 'opacity-50' : ''}`}>
        {showIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconSrc}
            alt=""
            className={`w-6 h-6 object-contain transition-all ${!skill.is_visible ? 'grayscale' : ''}`}
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span className="text-xl opacity-30">⚡</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-semibold text-white/90 tracking-tight">
              {skill.name}
            </h3>
            {skill.category && categoryPalette && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border border-white/[0.08] rounded-full px-2 py-0.5 ${categoryPalette.badgeBg} ${categoryPalette.badgeText}`}>
                <CategoryIcon category={skill.category} size={9} />
                {skill.category}
              </span>
            )}
            {!skill.is_visible && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-white/55 bg-white/[0.05] border border-white/15 rounded-full px-2 py-0.5">
                <EyeOff size={9} />
                Skryto
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(skill)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-white/35 hover:text-orange-400 hover:bg-orange-500/[0.1] transition-all"
              title="Upravit"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isPending}
              className="flex items-center justify-center w-7 h-7 rounded-md text-white/35 hover:text-rose-400 hover:bg-rose-500/[0.1] transition-all disabled:opacity-50"
              title="Smazat"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-[12px] text-white/40 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Level */}
        <LevelBar level={skill.level} palette={categoryPalette} />

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-auto pt-1 gap-3">
          <div className="flex items-center gap-3 text-[11px] text-white/25 flex-wrap">
            {skill.years_experience != null && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {skill.years_experience} {skill.years_experience === 1 ? 'rok' : skill.years_experience < 5 ? 'roky' : 'let'} zkušeností
              </span>
            )}
            <span
              className="flex items-center gap-1 shrink-0"
              title={new Date(skill.created_at).toLocaleString('cs-CZ')}
            >
              <Calendar size={10} />
              {formatDate(skill.created_at)}
            </span>
            {wasEdited && (
              <span
                className="flex items-center gap-1 shrink-0 text-white/20"
                title={new Date(skill.updated_at).toLocaleString('cs-CZ')}
              >
                <History size={10} />
                upraveno {timeAgo(skill.updated_at)}
              </span>
            )}
          </div>

          {/* Visible toggle */}
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-lg border transition-all disabled:opacity-50 shrink-0 ${
              skill.is_visible
                ? 'text-emerald-400 bg-emerald-500/[0.06] border-emerald-500/20 hover:bg-emerald-500/10'
                : 'text-white/60 bg-white/[0.05] border-white/15 hover:border-white/25 hover:bg-white/[0.08] hover:text-white/80'
            }`}
          >
            {skill.is_visible ? <Eye size={11} /> : <EyeOff size={11} />}
            {skill.is_visible ? 'Viditelné' : 'Skryté'}
          </button>
        </div>
      </div>

      </div>

      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Smazat skill?"
        description={`Opravdu chceš smazat skill „${skill.name}"? Tuto akci nelze vrátit zpět.`}
        isPending={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}