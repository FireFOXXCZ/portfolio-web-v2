import Link from 'next/link'
import { ArrowRight, ExternalLink, Star, Clock, CheckCircle2, Archive } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import type { Project } from '@/lib/supabase/type'

// ── Icons ─────────────────────────────────────────────────────────────────────
const GithubIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

// ── Tech badges ───────────────────────────────────────────────────────────────
const TECH_META: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  'Next.js':      { label: 'Next.js',     icon: 'N',  bg: 'bg-zinc-900',          text: 'text-white',       border: 'border-zinc-600/50' },
  'React':        { label: 'React',       icon: '⚛',  bg: 'bg-sky-500/15',        text: 'text-sky-300',     border: 'border-sky-500/30' },
  'TypeScript':   { label: 'TypeScript',  icon: 'TS', bg: 'bg-blue-600/15',       text: 'text-blue-300',    border: 'border-blue-500/30' },
  'JavaScript':   { label: 'JavaScript',  icon: 'JS', bg: 'bg-yellow-500/15',     text: 'text-yellow-300',  border: 'border-yellow-500/30' },
  'Tailwind':     { label: 'Tailwind',    icon: '~',  bg: 'bg-cyan-500/15',       text: 'text-cyan-300',    border: 'border-cyan-500/30' },
  'Tailwind CSS': { label: 'Tailwind',    icon: '~',  bg: 'bg-cyan-500/15',       text: 'text-cyan-300',    border: 'border-cyan-500/30' },
  'Supabase':     { label: 'Supabase',    icon: 'S',  bg: 'bg-emerald-500/15',    text: 'text-emerald-300', border: 'border-emerald-500/30' },
  'PostgreSQL':   { label: 'PostgreSQL',  icon: '🐘', bg: 'bg-indigo-500/15',     text: 'text-indigo-300',  border: 'border-indigo-500/30' },
  'Prisma':       { label: 'Prisma',      icon: '◆',  bg: 'bg-slate-500/15',      text: 'text-slate-300',   border: 'border-slate-500/30' },
  'Node.js':      { label: 'Node.js',     icon: '⬡',  bg: 'bg-green-500/15',      text: 'text-green-300',   border: 'border-green-500/30' },
  'Python':       { label: 'Python',      icon: '🐍', bg: 'bg-yellow-600/15',     text: 'text-yellow-400',  border: 'border-yellow-600/30' },
  'Docker':       { label: 'Docker',      icon: '🐳', bg: 'bg-blue-500/15',       text: 'text-blue-300',    border: 'border-blue-500/30' },
  'Redis':        { label: 'Redis',       icon: 'R',  bg: 'bg-red-500/15',        text: 'text-red-300',     border: 'border-red-500/30' },
  'Stripe':       { label: 'Stripe',      icon: 'S',  bg: 'bg-violet-500/15',     text: 'text-violet-300',  border: 'border-violet-500/30' },
  'Socket.io':    { label: 'Socket.io',   icon: '⚡', bg: 'bg-gray-500/15',       text: 'text-gray-300',    border: 'border-gray-500/30' },
  'GraphQL':      { label: 'GraphQL',     icon: '◈',  bg: 'bg-pink-500/15',       text: 'text-pink-300',    border: 'border-pink-500/30' },
  'Vercel':       { label: 'Vercel',      icon: '▲',  bg: 'bg-white/5',           text: 'text-gray-300',    border: 'border-white/10' },
  'MongoDB':      { label: 'MongoDB',     icon: '🍃', bg: 'bg-green-600/15',      text: 'text-green-300',   border: 'border-green-600/30' },
  'Drizzle':      { label: 'Drizzle',     icon: '💧', bg: 'bg-lime-500/15',       text: 'text-lime-300',    border: 'border-lime-500/30' },
}

function TechBadge({ tag }: { tag: string }) {
  const meta = TECH_META[tag]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg border
      ${meta ? `${meta.bg} ${meta.text} ${meta.border}` : 'bg-white/5 text-gray-400 border-white/10'}`}
    >
      <span className="text-[10px] leading-none font-black opacity-80">
        {meta?.icon ?? tag.slice(0, 2).toUpperCase()}
      </span>
      {meta?.label ?? tag}
    </span>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, isCz }: { status: Project['status']; isCz: boolean }) {
  if (status === 'completed') return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 backdrop-blur-sm">
      <CheckCircle2 size={9} />
      {isCz ? 'Hotovo' : 'Done'}
    </span>
  )
  if (status === 'in_progress') return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 backdrop-blur-sm">
      <Clock size={9} />
      {isCz ? 'Probíhá' : 'In progress'}
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/25 backdrop-blur-sm">
      <Archive size={9} />
      {isCz ? 'Archiv' : 'Archived'}
    </span>
  )
}

// ── Card accent palette ───────────────────────────────────────────────────────
const ACCENTS = [
  { border: 'border-orange-500/25', glow: 'hover:shadow-orange-500/10', grad: 'from-orange-500/25 via-red-500/10 to-transparent' },
  { border: 'border-blue-500/20',   glow: 'hover:shadow-blue-500/10',   grad: 'from-blue-500/25 via-indigo-500/10 to-transparent' },
  { border: 'border-emerald-500/20',glow: 'hover:shadow-emerald-500/10',grad: 'from-emerald-500/25 via-teal-500/10 to-transparent' },
  { border: 'border-purple-500/20', glow: 'hover:shadow-purple-500/10', grad: 'from-purple-500/25 via-pink-500/10 to-transparent' },
  { border: 'border-cyan-500/20',   glow: 'hover:shadow-cyan-500/10',   grad: 'from-cyan-500/25 via-sky-500/10 to-transparent' },
  { border: 'border-rose-500/20',   glow: 'hover:shadow-rose-500/10',   grad: 'from-rose-500/25 via-orange-500/10 to-transparent' },
]

// ── Data ──────────────────────────────────────────────────────────────────────
async function getRecentProjects(): Promise<Project[]> {
  try {
    const anon = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await anon
      .from('projects')
      .select('*')
      .eq('published', true)
      .order('updated_at', { ascending: false })
      .limit(3)
    return (data as Project[]) ?? []
  } catch {
    return []
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export async function ProjectsPreview() {
  const [projects, t, locale] = await Promise.all([
    getRecentProjects(),
    getTranslations('sections'),
    getLocale(),
  ])

  const isCz = locale === 'cs'
  const allProjectsHref = isCz ? '/projekty' : '/en/projects'

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-2">{t('work')}</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{t('projects')}</h2>
          </div>
          <Link href={allProjectsHref} className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors group">
            {t('allProjects')}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Cards */}
        {projects.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600 text-sm">{t('noProjects')}</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {projects.map((p, i) => {
              const { border, glow, grad } = ACCENTS[i % ACCENTS.length]
              const description = isCz ? p.description_cs : p.description_en
              const tags = (p.tech_stack?.length ? p.tech_stack : p.tags) ?? []
              const visibleTags = tags.slice(0, 4)
              const hiddenTags = tags.slice(4)

              return (
                <div key={p.id} className={`group relative flex flex-col rounded-2xl border ${border} bg-[#0c0c10] overflow-hidden hover:scale-[1.015] hover:shadow-2xl ${glow} transition-all duration-300`}>

                  {/* Image */}
                  <div className="relative h-44 overflow-hidden bg-[#111116]">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
                        <span className="text-5xl font-black text-white/10 select-none">{p.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10] via-[#0c0c10]/20 to-transparent" />

                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {p.featured && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/80 backdrop-blur-sm text-white border border-orange-400/30">
                          <Star size={8} fill="currentColor" /> Featured
                        </span>
                      )}
                      <StatusBadge status={p.status} isCz={isCz} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-3 p-5 flex-1">
                    <h3 className="text-[15px] font-bold text-white leading-snug">{p.name}</h3>

                    {description && (
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">{description}</p>
                    )}

                    {/* Tech tags — all visible, wrap */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {visibleTags.map(tag => <TechBadge key={tag} tag={tag} />)}
                        {hiddenTags.length > 0 && (
                          <div className="relative group/more">
                            <span className="inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10 cursor-default">
                              +{hiddenTags.length}
                            </span>
                            {/* Tooltip with remaining tags */}
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/more:flex flex-wrap gap-1 p-2 rounded-xl bg-gray-900 border border-white/10 shadow-xl z-10 min-w-max max-w-[200px]">
                              {hiddenTags.map(tag => <TechBadge key={tag} tag={tag} />)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-3 pt-2 mt-auto border-t border-white/[0.06]">
                      {p.demo_url && (
                        <a href={p.demo_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-400 transition-colors">
                          <ExternalLink size={12} /> Demo
                        </a>
                      )}
                      {p.github_url && (
                        <a href={p.github_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-400 transition-colors">
                          <GithubIcon size={12} /> GitHub
                        </a>
                      )}
                      {!p.demo_url && !p.github_url && (
                        <span className="text-[11px] text-gray-700 italic">{t('comingSoon')}</span>
                      )}
                      <Link href={isCz ? `/projekty/${p.id}` : `/en/projects/${p.id}`}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-orange-400 transition-colors">
                        {isCz ? 'Detail' : 'View'} <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Mobile link */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link href={allProjectsHref} className="flex items-center gap-1.5 text-sm font-semibold text-orange-500">
            {t('allProjects')} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}