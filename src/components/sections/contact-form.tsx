'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Send, CheckCircle2, AlertCircle, User, Mail, MessageSquare, Hash, ArrowRight, Clock, MapPin, CircleCheck, Hourglass, Moon } from 'lucide-react'
import type { Profile } from '@/lib/supabase/type'

const AVAILABILITY_STYLES = {
  available:   { icon: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400', text: 'text-emerald-400', Icon: CircleCheck },
  busy:        { icon: 'bg-amber-500/10 border-amber-500/20',     dot: 'bg-amber-400',   text: 'text-amber-400',  Icon: Hourglass },
  unavailable: { icon: 'bg-red-500/10 border-red-500/20',         dot: 'bg-red-400',     text: 'text-red-400',   Icon: Moon },
} as const

/* ─── Mouse spotlight wrapper ────────────────────────────────────────────── */

function SpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0, opacity: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setPos((p) => ({ ...p, opacity: 0 }))
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: pos.opacity,
          background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(249,115,22,0.06), transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* ─── Animated entrance wrapper ──────────────────────────────────────────── */

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={`animate-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  )
}

/* ─── Main form ──────────────────────────────────────────────────────────── */

interface ContactFormProps {
  profile?: Profile | null
}

export function ContactForm({ profile }: ContactFormProps) {
  const t = useTranslations('sections.contactPage')
  const locale = useLocale()

  const availabilityStatus = profile?.status ?? 'available'
  const statusStyles = AVAILABILITY_STYLES[availabilityStatus]

  const [fields, setFields] = useState({ name: '', email: '', subject: '', message: '', _honeypot: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  function validate() {
    const e: Record<string, string> = {}
    if (!fields.name.trim()) e.name = t('errors.nameRequired')
    if (!fields.email.trim()) e.email = t('errors.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email = t('errors.emailInvalid')
    if (!fields.message.trim()) e.message = t('errors.messageRequired')
    else if (fields.message.trim().length < 10) e.message = t('errors.messageTooShort')
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, locale }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  /* ── Success state ── */
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="relative flex items-center justify-center w-32 h-32">
          <span className="absolute inset-0 rounded-full border border-orange-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <span className="absolute inset-3 rounded-full border border-orange-500/15" />
          <div className="absolute inset-6 rounded-2xl bg-orange-500/20 blur-xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/25 to-orange-600/10 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/10">
            <CheckCircle2 size={28} className="text-orange-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('success.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">{t('success.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {t('success.delivered')}
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fade-up { animation: fade-up 0.5s ease both; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Honeypot */}
      <input type="text" name="_honeypot" value={fields._honeypot} onChange={handleChange}
        tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="absolute opacity-0 pointer-events-none h-0 w-0" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">

        {/* ── Left panel ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Availability card */}
          <FadeUp delay={0}>
            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`relative w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${statusStyles.icon}`}>
                  <statusStyles.Icon size={16} className={statusStyles.text} />
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#0a0a0f] ${statusStyles.dot}`} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest">{t('availability.label')}</p>
                  <p className={`text-sm font-semibold ${statusStyles.text}`}>{t(`availability.statusLabels.${availabilityStatus}`)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{t(`availability.descriptions.${availabilityStatus}`)}</p>
            </div>
          </FadeUp>

          {/* Info items */}
          <FadeUp delay={60}>
            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5 space-y-4">
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-widest">{t('info.title')}</p>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/15 flex items-center justify-center shrink-0">
                  <Clock size={13} className="text-orange-500 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-white/80">{t('info.responseTime')}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-600">{t('info.responseTimeValue')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                  <MapPin size={13} className="text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-white/80">{t('info.location')}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-600">{t('info.locationValue')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center shrink-0">
                  <Mail size={13} className="text-purple-500 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-white/80">Email</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-600">hello@firefoxx.online</p>
                </div>
              </div>
            </div>
          </FadeUp>

        </div>

        {/* ── Right panel — Form ── */}
        <div className="lg:col-span-3">
          <SpotlightCard className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6 sm:p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              <FadeUp delay={0} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label={t('fields.name')} name="name" value={fields.name}
                  placeholder={t('fields.namePlaceholder')} onChange={handleChange}
                  error={errors.name} icon={<User size={13} />} />
                <InputField label={t('fields.email')} name="email" type="email" value={fields.email}
                  placeholder={t('fields.emailPlaceholder')} onChange={handleChange}
                  error={errors.email} icon={<Mail size={13} />} />
              </FadeUp>

              <FadeUp delay={60}>
                <InputField label={t('fields.subject')} name="subject" value={fields.subject}
                  placeholder={t('fields.subjectPlaceholder')} onChange={handleChange}
                  icon={<Hash size={13} />} />
              </FadeUp>

              <FadeUp delay={120}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare size={11} className="text-orange-500" />
                    {t('fields.message')}
                  </label>
                  <div className={`rounded-xl border transition-all duration-200 ${
                    errors.message
                      ? 'border-red-500/40 bg-red-500/[0.03] shadow-[0_0_0_3px_rgba(239,68,68,0.07)]'
                      : 'border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/15 focus-within:border-orange-500/40 focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.07)]'
                  }`}>
                    <textarea name="message" value={fields.message} onChange={handleChange}
                      placeholder={t('fields.messagePlaceholder')} rows={6}
                      className="w-full bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 resize-none outline-none leading-relaxed" />
                  </div>
                  {errors.message && (
                    <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
                      <AlertCircle size={11} /> {errors.message}
                    </p>
                  )}
                </div>
              </FadeUp>

              {status === 'error' && (
                <FadeUp delay={0}>
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm text-red-500 dark:text-red-400">
                    <AlertCircle size={14} className="shrink-0" />
                    {t('errors.submitFailed')}
                  </div>
                </FadeUp>
              )}

              <FadeUp delay={180}>
                <div className="flex items-center justify-between pt-1 gap-4">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="group relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="absolute inset-0 bg-orange-500 transition-all duration-200 group-hover:bg-orange-400" />
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,180,100,0.3), transparent 70%)' }} />
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="relative flex items-center gap-2">
                      {status === 'submitting' ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          {t('fields.submitting')}
                        </>
                      ) : (
                        <>
                          <Send size={13} className="transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          {t('fields.submit')}
                          <ArrowRight size={13} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </FadeUp>
            </form>
          </SpotlightCard>
        </div>
      </div>
    </>
  )
}

/* ─── Input field ────────────────────────────────────────────────────────── */

type InputFieldProps = {
  label: string; name: string; value: string
  placeholder?: string; type?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string; icon?: React.ReactNode
}

function InputField({ label, name, value, placeholder, type = 'text', onChange, error, icon }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
        <span className="text-orange-500">{icon}</span>
        {label}
      </label>
      <div className={`rounded-xl border transition-all duration-200 ${
        error
          ? 'border-red-500/40 bg-red-500/[0.03] shadow-[0_0_0_3px_rgba(239,68,68,0.07)]'
          : 'border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/15 focus-within:border-orange-500/40 focus-within:shadow-[0_0_0_3px_rgba(249,115,22,0.07)]'
      }`}>
        <input type={type} name={name} value={value} placeholder={placeholder} onChange={onChange}
          className="w-full bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 outline-none" />
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}