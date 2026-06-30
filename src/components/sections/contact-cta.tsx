'use client'

import Link from 'next/link'
import { Send, Mail, ArrowRight } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

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

export function ContactCta() {
  const { ref, inView } = useInView()
  const t = useTranslations('sections.contactCta')

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div
          className={`relative overflow-hidden rounded-3xl p-10 md:p-16 transition-all duration-700 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            background: 'linear-gradient(135deg, #0f0f14 0%, #1a1025 50%, #0f0f14 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Glow orbs */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Orange accent line top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

          <div className="relative text-center max-w-2xl mx-auto">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/[0.06] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-widest">{t('eyebrow')}</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-6xl font-black text-white mb-5 leading-[1.05] tracking-tight">
              {t('titleLine1')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                {t('titleLine2')}
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-white/45 text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed">
              {t('subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/contact"
                className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-400 hover:to-orange-600 text-white font-bold text-sm transition-all shadow-[0_4px_20px_-2px_rgba(249,115,22,0.45)] hover:shadow-[0_4px_28px_-2px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Send size={14} />
                {t('ctaPrimary')}
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="mailto:hello@firefoxx.online"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.07] hover:border-white/[0.14] font-semibold text-sm transition-all"
              >
                <Mail size={14} />
                {t('ctaSecondary')}
              </a>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
    </section>
  )
}