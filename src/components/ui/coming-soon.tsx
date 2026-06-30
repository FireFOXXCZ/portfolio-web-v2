'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useRef } from 'react'
import { ArrowLeft, Mail, Sparkles } from 'lucide-react'

// ─── Animated grid background ─────────────────────────────────────────────────
function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Soft radial vignette to fade grid at edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_40%,white_100%)] dark:bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_40%,#090910_100%)]" />
    </div>
  )
}

// ─── Floating orbs ────────────────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-500/[0.07] dark:bg-orange-500/[0.04] blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-amber-400/[0.06] dark:bg-amber-400/[0.03] blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-orange-400/[0.04] dark:bg-orange-400/[0.02] blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
    </div>
  )
}

// ─── Animated code lines (decorative) ────────────────────────────────────────
function CodeLines() {
  const lines = [
    { w: 'w-32', delay: 0 },
    { w: 'w-20', delay: 0.15 },
    { w: 'w-28', delay: 0.3 },
    { w: 'w-16', delay: 0.45 },
    { w: 'w-24', delay: 0.6 },
  ]

  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {lines.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-3 h-[2px] rounded-full bg-orange-500/40" />
          <div
            className={`${l.w} h-[2px] rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden relative`}
          >
            <div
              className="absolute inset-y-0 left-0 bg-orange-400/60 rounded-full animate-shimmer"
              style={{
                width: '40%',
                animationDelay: `${l.delay}s`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Pulsing ring ─────────────────────────────────────────────────────────────
function PulsingIcon() {
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      {/* Outer pulse rings */}
      <div className="absolute inset-0 rounded-full border border-orange-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
      <div className="absolute inset-2 rounded-full border border-orange-500/15 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.4s' }} />
      {/* Icon container */}
      <div className="relative w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-orange-500" />
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
type ComingSoonProps = {
  /** Override the default title from i18n */
  title?: string
  /** Override the default subtitle from i18n */
  subtitle?: string
  /** Show the contact CTA button (default: true) */
  showCta?: boolean
  /** Contact href (default: '/contact') */
  ctaHref?: string
  /** Show back home link (default: true) */
  showBack?: boolean
  /** Custom class on the outer wrapper */
  className?: string
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ComingSoon({
  title,
  subtitle,
  showCta = true,
  ctaHref = '/contact',
  showBack = true,
  className = '',
}: ComingSoonProps) {
  const t = useTranslations('comingSoon')
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Tiny delay so the entrance animation is visible
    const id = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(id)
  }, [])

  return (
    <div
      ref={ref}
      className={`relative min-h-[70vh] flex flex-col items-center justify-center px-6 overflow-hidden ${className}`}
    >
      <GridBackground />
      <FloatingOrbs />

      <div
        className={`relative z-10 flex flex-col items-center text-center max-w-lg transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Badge */}
        <div
          className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/25 bg-orange-500/[0.06] text-orange-500 text-xs font-bold uppercase tracking-widest"
          style={{ transitionDelay: '100ms' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          {t('badge')}
        </div>

        {/* Pulsing icon */}
        <div
          className={`mb-6 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          <PulsingIcon />
        </div>

        {/* Eyebrow */}
        <p
          className={`text-xs font-semibold text-orange-500 uppercase tracking-widest mb-3 transition-all duration-500 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {t('eyebrow')}
        </p>

        {/* Title */}
        <h1
          className={`text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-4 transition-all duration-500 delay-[250ms] ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {title ?? t('title')}
        </h1>

        {/* Subtitle */}
        <p
          className={`text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-3 transition-all duration-500 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {subtitle ?? t('subtitle')}
        </p>

        {/* ETA tag */}
        <p
          className={`text-xs text-gray-400 dark:text-gray-500 mb-10 font-medium transition-all duration-500 delay-[330ms] ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          ✦ {t('eta')} ✦
        </p>

        {/* Decorative code lines */}
        <div
          className={`mb-10 transition-all duration-500 delay-[360ms] ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <CodeLines />
        </div>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row items-center gap-3 transition-all duration-500 delay-[400ms] ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {showCta && (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/25"
            >
              <Mail size={14} />
              {t('cta')}
            </Link>
          )}
          {showBack && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 text-sm font-semibold hover:border-gray-300 dark:hover:border-white/[0.15] hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 group"
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
              {t('backHome')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}