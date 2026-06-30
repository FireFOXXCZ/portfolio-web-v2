'use client'

import { useEffect, useRef, useState } from 'react'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { Mail, ArrowUpRight, Heart, Coffee } from 'lucide-react'

// ── Typy (inline, nevyžaduje @/types/profile) ─────────────────────────────
type Profile = {
  github?: string | null
  discord?: string | null
  discord_url?: string | null
  discord_display_name?: string | null  // global_name z Discord OAuth (custom_claims.global_name)
  discord_server_name?: string | null   // název serveru – zadej ručně v DB
  email?: string | null
}

// ── GitHub SVG icon ────────────────────────────────────────────────────────
function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

// ── Discord SVG icon ───────────────────────────────────────────────────────
function DiscordIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}


const TECH_STACK = ['Next.js', 'TypeScript', 'Supabase', 'Tailwind', 'React', 'PostgreSQL']

// ── Roky zkušeností (od 17 let, narozen 23. 12. 2004) ──────────────────────
const EXPERIENCE_START_DATE = new Date(2021, 11, 23) // 23. 12. 2021

function getYearsSince(startDate: Date): number {
  const today = new Date()
  let years = today.getFullYear() - startDate.getFullYear()
  const hasHadAnniversaryThisYear =
    today.getMonth() > startDate.getMonth() ||
    (today.getMonth() === startDate.getMonth() && today.getDate() >= startDate.getDate())
  if (!hasHadAnniversaryThisYear) years--
  return years
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ── Helper: vytáhni username z GitHub URL ──────────────────────────────────
function githubUsername(url: string): string {
  try {
    const u = new URL(url)
    const parts = u.pathname.replace(/^\//, '').split('/')
    return parts[0] ? `@${parts[0]}` : url
  } catch {
    return url.startsWith('@') ? url : `@${url}`
  }
}

// ── Typy ────────────────────────────────────────────────────────────────────
type IconComponent = (props: { size?: number }) => React.ReactElement | null

type SocialLink = {
  label: string
  href: string
  icon: IconComponent
  desc: string
}

interface FooterProps {
  profile?: Profile | null
  projectCount?: number
}

export function Footer({ profile, projectCount = 0 }: FooterProps) {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const { ref, inView } = useInView()
  const year = new Date().getFullYear()

  const scrollToTop = (e: React.MouseEvent) => {
    if (window.location.hash || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/en')) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.history.pushState(null, '', window.location.pathname)
    }
  }

  const NAV_LINKS = [
    { label: tNav('about'), href: '/about' },
    { label: tNav('projects'), href: '/projects' },
    { label: tNav('skills'), href: '/skills' },
    { label: tNav('review'), href: '/review' },
    { label: tNav('blog'), href: '/blog' },
    { label: tNav('contact'), href: '/contact' },
  ]

  // ── Social links dynamicky z profilu ──────────────────────────────────────
  // Discord – uživatelský profil link
  const rawDiscord = profile?.discord_url ?? profile?.discord ?? null
  const discordHref = rawDiscord
    ? (rawDiscord.startsWith('http') ? rawDiscord : `https://discord.com/users/${rawDiscord}`)
    : null
  // Jméno: global_name z OAuth (discord_display_name), fallback na ID z URL
  const discordDesc = profile?.discord_display_name
    ?? (() => {
      if (!rawDiscord) return 'Discord'
      if (rawDiscord.includes('discord.com/users/')) return rawDiscord.split('discord.com/users/')[1] ?? 'Discord'
      return rawDiscord
    })()

  const SOCIAL_LINKS: SocialLink[] = ([] as SocialLink[]).concat(
    profile?.github ? [{ label: 'GitHub', href: profile.github, icon: GithubIcon as IconComponent, desc: githubUsername(profile.github) }] : [],
    // Discord server — zobrazí se jen pokud máš discord_server_name v DB
    profile?.discord_server_name ? [{ label: profile.discord_server_name, href: rawDiscord ?? 'https://discord.com', icon: DiscordIcon as IconComponent, desc: discordDesc }] : (
      // Fallback: zobrazí "Discord" s display name
      discordHref ? [{ label: 'Discord', href: discordHref, icon: DiscordIcon as IconComponent, desc: discordDesc }] : []
    ),
    profile?.email ? [{ label: 'Email', href: `mailto:${profile.email}`, icon: Mail as IconComponent, desc: profile.email }] : [],
  )

  // Fallback jen pokud profile vůbec není předán
  const socialLinksToRender = SOCIAL_LINKS.length > 0 ? SOCIAL_LINKS : [
    { label: 'GitHub', href: 'https://github.com', icon: GithubIcon, desc: '@username' },
    { label: 'Discord', href: 'https://discord.gg', icon: DiscordIcon, desc: 'Discord server' },
    { label: 'Email', href: 'mailto:hello@firefoxx.online', icon: Mail as IconComponent, desc: 'hello@firefoxx.online' },
  ]

  return (
    <footer className="relative border-t border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#0a0a0f] overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[250px] bg-orange-500/[0.04] dark:bg-orange-500/[0.06] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-purple-500/[0.03] dark:bg-purple-500/[0.05] rounded-full blur-3xl pointer-events-none" />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      <div ref={ref} className="relative max-w-6xl mx-auto px-6 pt-16 pb-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand column */}
          <div
            className={`lg:col-span-2 flex flex-col gap-5 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '0ms' }}
          >
            <div>
              <Link
                href="/"
                onClick={scrollToTop}
                className="flex items-baseline gap-0.5 select-none cursor-pointer w-fit group"
              >
                <span className="text-2xl font-extrabold bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  firefoxx
                </span>
                <span className="text-lg font-medium text-gray-400 dark:text-gray-500 group-hover:text-orange-500 transition-colors duration-200">.online</span>
              </Link>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
                {t('description')}
              </p>
            </div>

            {/* Availability badge */}
            <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-500">{t('available')}</span>
            </div>

            {/* Tech stack pills */}
            <div className="flex flex-wrap gap-1.5">
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:bg-orange-500/10 hover:text-orange-500 dark:hover:bg-orange-500/10 dark:hover:text-orange-400 transition-colors duration-200 cursor-default"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Mini stats row */}
            <div className="flex items-center gap-6 pt-1">
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-800 dark:text-gray-200">{getYearsSince(EXPERIENCE_START_DATE)}+</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-600">{t('yearsExp')}</span>
              </div>
              <div className="w-px h-8 bg-gray-100 dark:bg-white/[0.06]" />
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-800 dark:text-gray-200">{projectCount > 0 ? `${projectCount}+` : '—'}</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-600">{t('projects')}</span>
              </div>
              <div className="w-px h-8 bg-gray-100 dark:bg-white/[0.06]" />
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-800 dark:text-gray-200">∞</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-600">{t('coffees')}</span>
              </div>
            </div>
          </div>

          {/* Navigation column */}
          <div
            className={`flex flex-col gap-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '100ms' }}
          >
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {t('navTitle')}
            </p>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors duration-200"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-orange-500 transition-all duration-300 rounded-full" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social / contact column */}
          <div
            className={`flex flex-col gap-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {t('contactTitle')}
            </p>
            <ul className="flex flex-col gap-3">
              {socialLinksToRender.map(({ label, href, icon: Icon, desc }) => (
                <li key={label}>
                  <a
                    href={href}
                    target={href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    className="group flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200/70 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] text-gray-400 group-hover:border-orange-500/40 group-hover:text-orange-500 group-hover:bg-orange-500/5 transition-all duration-200">
                      <Icon size={13} />
                    </span>
                    <span className="flex flex-col">
                      <span className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-orange-500 transition-colors duration-200">
                        {label}
                        {!href.startsWith('mailto:') && (
                          <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        )}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-600 truncate max-w-[140px]">{desc}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/contact"
              className="mt-1 group inline-flex items-center gap-2 w-fit px-4 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-200"
            >
              <span className="text-xs font-semibold text-orange-500">{t('getInTouch')}</span>
              <ArrowUpRight size={12} className="text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/[0.06] to-transparent mb-8" />

        {/* Bottom bar */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '300ms' }}
        >
          <p className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1.5">
            © {year} firefoxx.online. {t('madeWith')}
            <Heart size={11} className="text-red-400 fill-red-400" />
            {t('andLots')}
            <Coffee size={11} className="text-amber-500" />
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="group flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600 hover:text-orange-500 transition-colors duration-200"
              aria-label="Scroll to top"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded border border-gray-200 dark:border-white/[0.08] group-hover:border-orange-500/40 transition-colors duration-200 text-[10px] leading-none">
                ↑
              </span>
              {t('backToTop')}
            </button>

            <span className="text-gray-200 dark:text-white/10">·</span>

            <p className="text-xs text-gray-400 dark:text-gray-600">
              {t('builtWith')}{' '}
              <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Next.js</a>
              {' · '}
              <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Tailwind</a>
              {' · '}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Supabase</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}