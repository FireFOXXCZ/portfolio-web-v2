'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Pencil, Trash2, GripVertical, Star, Images, Check, Eye, EyeOff, Calendar, History } from 'lucide-react'
import type { Project } from '@/lib/supabase/type'
import { togglePublished, deleteProject } from '@/app/[locale]/admin/(protected)/projects/actions'
import { ConfirmDeleteModal } from '@/components/admin/confirm-delete-modal'

const STATUS_LABEL: Record<Project['status'], string> = {
  completed: 'Dokončeno',
  in_progress: 'Probíhá',
  archived: 'Archivováno',
}

const STATUS_STYLE: Record<Project['status'], string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  archived: 'bg-white/5 text-white/30 border-white/10',
}

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

// Stejná sada jako ve formuláři - jméno technologie -> Simple Icons slug + barva
const TECH_ICON_MAP: Record<string, { slug: string; color: string }> = {
  'Next.js': { slug: 'nextdotjs', color: '000000' },
  'React': { slug: 'react', color: '61DAFB' },
  'TypeScript': { slug: 'typescript', color: '3178C6' },
  'JavaScript': { slug: 'javascript', color: 'F7DF1E' },
  'Tailwind CSS': { slug: 'tailwindcss', color: '06B6D4' },
  'Supabase': { slug: 'supabase', color: '3FCF8E' },
  'Node.js': { slug: 'nodedotjs', color: '339933' },
  'PostgreSQL': { slug: 'postgresql', color: '4169E1' },
  'Vue.js': { slug: 'vuedotjs', color: '4FC08D' },
  'Python': { slug: 'python', color: '3776AB' },
  'Docker': { slug: 'docker', color: '2496ED' },
  'GraphQL': { slug: 'graphql', color: 'E10098' },
  'MongoDB': { slug: 'mongodb', color: '47A248' },
  'Figma': { slug: 'figma', color: 'F24E1E' },
  'Vite': { slug: 'vite', color: '646CFF' },
  'Git': { slug: 'git', color: 'F05032' },
  'Vercel': { slug: 'vercel', color: 'FFFFFF' },
  'Stripe': { slug: 'stripe', color: '635BFF' },
}

function TechBadge({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  const icon = TECH_ICON_MAP[name]

  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/45 bg-white/[0.04] border border-white/[0.07] rounded-md pl-1.5 pr-2 py-0.5">
      {icon && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://cdn.simpleicons.org/${icon.slug}/${icon.color}`}
          alt=""
          className="w-3 h-3 shrink-0 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
      )}
      {name}
    </span>
  )
}

function GithubIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15 0 1.56-.01 2.81-.01 3.19 0 .3.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

type Props = {
  project: Project
  onEdit: (project: Project) => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  selected?: boolean
  onToggleSelect?: (id: string) => void
}

export function ProjectCard({ project, onEdit, dragHandleProps, selected = false, onToggleSelect }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleToggle = () => {
    startTransition(async () => {
      await togglePublished(project.id, !project.published)
      router.refresh()
    })
  }

  const handleConfirmDelete = () => {
    startTransition(async () => {
      await deleteProject(project.id)
      router.refresh()
      setShowDeleteModal(false)
    })
  }

  const imageCount = (project.image_url ? 1 : 0) + (project.gallery?.length ?? 0)

  const wasEdited = project.updated_at && project.created_at &&
    new Date(project.updated_at).getTime() - new Date(project.created_at).getTime() > 60_000

  return (
    <div className={`group relative flex gap-4 p-4 rounded-2xl border transition-all duration-200 ${
      selected
        ? 'bg-orange-500/[0.05] border-orange-500/30 ring-1 ring-orange-500/30'
        : project.published
          ? 'bg-white/[0.025] border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.035]'
          : 'bg-white/[0.015] border-white/[0.05] border-dashed hover:border-white/[0.1]'
    }`}>

      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="hidden sm:flex items-center self-stretch cursor-grab active:cursor-grabbing text-white/15 hover:text-white/40 transition-colors shrink-0"
      >
        <GripVertical size={16} />
      </div>

      {/* Thumbnail */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
        {project.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image_url}
            alt={project.name}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
              !project.published ? 'grayscale-[0.5] brightness-[0.85]' : ''
            }`}
          />
        ) : (
          <span className="text-2xl opacity-20">📁</span>
        )}
        {imageCount > 1 && (
          <span className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[9px] font-semibold text-white/80 bg-black/65 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <Images size={8} />
            {imageCount}
          </span>
        )}

        {/* Checkbox pro hromadný výběr */}
        {onToggleSelect && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleSelect(project.id) }}
            className={`absolute top-1.5 left-1.5 flex items-center justify-center w-5 h-5 rounded-md border backdrop-blur-sm transition-all ${
              selected
                ? 'bg-orange-500 border-orange-500'
                : 'bg-black/45 border-white/40 hover:border-white/70'
            }`}
            aria-pressed={selected}
            aria-label={selected ? 'Odznačit projekt' : 'Vybrat projekt'}
          >
            {selected && <Check size={12} className="text-white" strokeWidth={3} />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-semibold text-white/90 truncate">
              {project.name}
            </h3>
            {project.featured && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                <Star size={8} className="fill-amber-400" />
                Featured
              </span>
            )}
            <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${STATUS_STYLE[project.status]}`}>
              {STATUS_LABEL[project.status]}
            </span>
            {!project.published && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-white/55 bg-white/[0.05] border border-white/15 rounded-full px-2 py-0.5">
                <EyeOff size={9} />
                Skryto
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-7 h-7 rounded-md text-white/35 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                title="Demo"
              >
                <ExternalLink size={13} />
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-7 h-7 rounded-md text-white/35 hover:text-white/80 hover:bg-white/[0.06] transition-all"
                title="GitHub"
              >
                <GithubIcon size={13} />
              </a>
            )}
            <span className="w-px h-4 bg-white/[0.08] mx-0.5" />
            <button
              onClick={() => onEdit(project)}
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
        {project.description_cs && (
          <p className="text-[12px] text-white/40 line-clamp-2 leading-relaxed">
            {project.description_cs}
          </p>
        )}

        {/* Tech stack + tags */}
        <div className="flex flex-wrap gap-1.5">
          {project.tech_stack.slice(0, 6).map(t => (
            <TechBadge key={t} name={t} />
          ))}
          {project.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[11px] font-medium text-orange-400/70 bg-orange-500/[0.06] border border-orange-500/[0.12] rounded-md px-2 py-0.5">
              #{tag}
            </span>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-auto pt-1 gap-3">
          <div className="flex items-center gap-3 text-[11px] text-white/25 min-w-0 flex-wrap">
            <span className="truncate">{project.category ?? '—'}</span>
            <span
              className="flex items-center gap-1 shrink-0"
              title={new Date(project.created_at).toLocaleString('cs-CZ')}
            >
              <Calendar size={10} />
              {formatDate(project.created_at)}
            </span>
            {wasEdited && (
              <span
                className="flex items-center gap-1 shrink-0 text-white/20"
                title={new Date(project.updated_at).toLocaleString('cs-CZ')}
              >
                <History size={10} />
                upraveno {timeAgo(project.updated_at)}
              </span>
            )}
          </div>

          {/* Publish toggle */}
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-lg border transition-all disabled:opacity-50 shrink-0 ${
              project.published
                ? 'text-emerald-400 bg-emerald-500/[0.06] border-emerald-500/20 hover:bg-emerald-500/10'
                : 'text-white/60 bg-white/[0.05] border-white/15 hover:border-white/25 hover:bg-white/[0.08] hover:text-white/80'
            }`}
          >
            {project.published ? <Eye size={11} /> : <EyeOff size={11} />}
            {project.published ? 'Publikováno' : 'Skrytý'}
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Smazat projekt?"
        description={`Opravdu chceš smazat projekt „${project.name}“? Tuto akci nelze vrátit zpět.`}
        isPending={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}