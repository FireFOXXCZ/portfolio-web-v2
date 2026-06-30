'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Mail, Download } from 'lucide-react'
import { useLocale } from 'next-intl'
import type { Profile } from '@/lib/supabase/type'

const GithubIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const TITLES_CS = [
  'Full-stack Developer',
  'Next.js Specialist',
  'UI/UX Enthusiast',
  'Open Source Contributor',
]
const TITLES_EN = [
  'Full-stack Developer',
  'Next.js Specialist',
  'UI/UX Enthusiast',
  'Open Source Contributor',
]

const TECH = [
  { label: 'Next.js',     color: 'from-white/10 to-white/5',           text: 'text-white' },
  { label: 'TypeScript',  color: 'from-blue-500/20 to-blue-600/10',     text: 'text-blue-400' },
  { label: 'Supabase',    color: 'from-emerald-500/20 to-emerald-600/10', text: 'text-emerald-400' },
  { label: 'Tailwind',    color: 'from-cyan-500/20 to-cyan-600/10',     text: 'text-cyan-400' },
  { label: 'React',       color: 'from-sky-500/20 to-sky-600/10',       text: 'text-sky-400' },
  { label: 'MySQL',  color: 'from-indigo-500/20 to-indigo-600/10', text: 'text-indigo-400' },
]

const STATUS_MAP = {
  available:   { label_cs: 'Dostupný pro projekty', label_en: 'Available for projects', dot: 'bg-emerald-400', ring: 'border-emerald-500/30 bg-emerald-500/10', text: 'text-emerald-400' },
  busy:        { label_cs: 'Zaneprázdněný',         label_en: 'Currently busy',         dot: 'bg-amber-400',  ring: 'border-amber-500/30 bg-amber-500/10',   text: 'text-amber-400' },
  unavailable: { label_cs: 'Nedostupný',            label_en: 'Unavailable',            dot: 'bg-red-400',    ring: 'border-red-500/30 bg-red-500/10',       text: 'text-red-400' },
}

// ── Discord icon ──────────────────────────────────────────────────────────────
const DiscordIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function useIsClient() {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => { setIsClient(true) }, [])
  return isClient
}

async function downloadCv(url: string, e: React.MouseEvent) {
  e.preventDefault()
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = 'CV.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    // Fallback, pokud fetch selže (např. CORS) - otevře v novém okně
    window.open(url, '_blank')
  }
}

function TypewriterTitle({ titles }: { titles: string[] }) {
  const [titleIdx, setTitleIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [pause, setPause] = useState(false)

  useEffect(() => {
    if (pause) {
      const t = setTimeout(() => { setPause(false); setDeleting(true) }, 1800)
      return () => clearTimeout(t)
    }
    const target = titles[titleIdx]
    if (!deleting) {
      if (displayed.length < target.length) {
        const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 60)
        return () => clearTimeout(t)
      } else { setPause(true) }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35)
        return () => clearTimeout(t)
      } else {
        setDeleting(false)
        setTitleIdx(i => (i + 1) % titles.length)
      }
    }
  }, [displayed, deleting, pause, titleIdx, titles])

  return (
    <span className="inline-flex items-center gap-1">
      <span className="bg-gradient-to-r from-orange-400 via-red-400 to-purple-500 bg-clip-text text-transparent">
        {displayed}
      </span>
      <span className="inline-block w-0.5 h-8 md:h-10 bg-orange-400 animate-pulse ml-0.5 rounded-full" />
    </span>
  )
}

function Orb({ className }: { className: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 dark:opacity-[0.12] animate-pulse pointer-events-none ${className}`} />
  )
}

type TechPosition = { label: string; color: string; text: string; x: number; y: number; delay: number }

// ── Avatar ────────────────────────────────────────────────────────────────────
function AvatarOrb({ avatarUrl, isClient, techPositions }: {
  avatarUrl: string | null
  isClient: boolean
  techPositions: TechPosition[]
}) {
  return (
    <div className="relative w-56 h-56 md:w-64 md:h-64">
      {/* Rotating rings */}
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-500/20 animate-spin" style={{ animationDuration: '20s' }} />
      <div className="absolute inset-4 rounded-full border border-orange-500/10 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />

      {/* Avatar or FX fallback */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-orange-500/30 overflow-hidden">
        {avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          : <span className="text-white font-black text-5xl tracking-tighter select-none">fx</span>
        }
      </div>

      {/* Orbiting tech badges */}
      {isClient && techPositions.map((tech) => (
        <div
          key={tech.label}
          className={`absolute flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-br ${tech.color} border border-white/10 backdrop-blur-sm text-xs font-bold ${tech.text} whitespace-nowrap shadow-lg`}
          style={{
            left: `calc(50% + ${tech.x}px)`,
            top: `calc(50% + ${tech.y}px)`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${tech.delay}s`,
          }}
        >
          {tech.label}
        </div>
      ))}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface HeroSectionProps {
  profile: Profile | null
  projectCount?: number
}

// ── Main component ────────────────────────────────────────────────────────────
export function HeroSection({ profile, projectCount = 0 }: HeroSectionProps) {
  const locale = useLocale()
  const isCz = locale === 'cs'
  const [visible, setVisible] = useState(false)
  const isClient = useIsClient()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const titles = isCz ? TITLES_CS : TITLES_EN
  const status = STATUS_MAP[profile?.status ?? 'available']

  const bio = isCz ? profile?.bio_cs : profile?.bio_en
  const title = isCz ? profile?.title_cs : profile?.title_en

  const techPositions = useMemo(() =>
    TECH.map((tech, i) => {
      const angle = (i / TECH.length) * 360
      const rad = (angle * Math.PI) / 180
      const r = 130
      return { ...tech, x: Math.cos(rad) * r, y: Math.sin(rad) * r, delay: i * 0.15 }
    }), []
  )

  // Social links built from profile
  const socials = [
    profile?.github && {
      href: profile.github,
      label: 'GitHub',
      customIcon: <GithubIcon size={15} />,
    },
    profile?.discord_url && {
      href: profile.discord_url,
      label: profile.discord_server_name ?? 'Discord',
      customIcon: <DiscordIcon size={15} />,
    },
    profile?.email && {
      href: `mailto:${profile.email}`,
      label: 'Email',
      customIcon: <Mail size={15} />,
    },
  ].filter(Boolean) as { href: string; label: string; customIcon: React.ReactNode }[]

  const stats = [
    { value: projectCount > 0 ? `${projectCount}+` : '10+', label: isCz ? 'Projektů' : 'Projects' },
    { value: '3+', label: isCz ? 'Roky zkušeností' : 'Years exp.' },
    { value: '100%', label: isCz ? 'Vášeň pro kód' : 'Passion for code' },
  ]

  return (
    <section className="relative min-h-[100svh] flex items-center pt-24 pb-16 px-6 overflow-hidden">
      {/* Ambient orbs */}
      <Orb className="w-[600px] h-[600px] bg-orange-500 -top-32 -left-32" />
      <Orb className="w-[400px] h-[400px] bg-purple-600 top-1/3 -right-20" />
      <Orb className="w-[300px] h-[300px] bg-red-500 bottom-0 left-1/3" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

        {/* ── Left: Text ─────────────────────────────────────────── */}
        <div className={`flex flex-col gap-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* Status badge */}
          <div className="flex items-center gap-2 w-fit">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${status.ring} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
              {isCz ? status.label_cs : status.label_en}
            </span>
          </div>

          {/* Name */}
          <div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase">
              {isCz ? 'Ahoj, jsem' : 'Hi, I\'m'}
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
              {profile?.name ?? 'FireFOXX'}
            </h1>
          </div>

          {/* Typewriter — title from DB or animated fallback */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-700 dark:text-gray-300 h-10 md:h-12 flex items-center">
            {title
              ? (
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-purple-500 bg-clip-text text-transparent">
                  {title}
                </span>
              )
              : <TypewriterTitle titles={titles} />
            }
          </h2>

          {/* Bio */}
          {bio && (
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
              {bio}
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={isCz ? '/projekty' : '/en/projects'}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              {isCz ? 'Moje projekty' : 'My projects'}
              <ArrowRight size={15} />
            </Link>
            {profile?.cv_url && (
              <a
                href={profile.cv_url}
                onClick={(e) => downloadCv(profile.cv_url!, e)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 font-semibold text-sm hover:border-orange-500/40 hover:text-orange-500 transition-all duration-300"
              >
                <Download size={15} />
                {isCz ? 'Stáhnout CV' : 'Download CV'}
              </a>
            )}
          </div>

          {/* Social links */}
          {socials.length > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider font-medium">
                {isCz ? 'Najdi mě' : 'Find me'}
              </span>
              <div className="h-px w-8 bg-gray-200 dark:bg-white/10" />
              <div className="flex items-center gap-2">
                {socials.map(({ href, label, customIcon }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="group relative w-9 h-9 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-orange-500/40 hover:text-orange-500 transition-all duration-200"
                  >
                    {customIcon}
                    {/* Tooltip */}
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-gray-900 dark:bg-gray-800 text-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Tech orb ────────────────────────────────────── */}
        <div className={`relative flex items-center justify-center transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <AvatarOrb
            avatarUrl={profile?.avatar_url ?? null}
            isClient={isClient}
            techPositions={techPositions}
          />

          {/* Stats */}
          <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{value}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-gray-400 to-transparent animate-pulse" />
      </div>
    </section>
  )
}