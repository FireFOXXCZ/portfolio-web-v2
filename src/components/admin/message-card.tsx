'use client'

import { useState, useTransition } from 'react'
import {
  Check, RotateCcw, Trash2, Mail, ChevronDown, ChevronUp,
  Reply, X, AlertTriangle, Loader2, Archive, ArchiveRestore,
} from 'lucide-react'
import { CopyEmailButton } from '@/components/admin/copy-email-button'
import { toggleMessageRead, deleteMessage, toggleMessageArchived } from '@/app/[locale]/admin/(protected)/messages/actions'
import type { Message } from '@/lib/supabase/type'

/* ─── helpers ──────────────────────────────────────────────────────────── */

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('cs-CZ', {
    day: 'numeric', month: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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
  if (diffDay < 7) return `před ${diffDay} dny`
  return formatDate(dateStr)
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

const AVATAR_GRADIENTS = [
  'from-rose-400 to-orange-500',
  'from-violet-500 to-purple-600',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-400',
  'from-pink-400 to-rose-500',
  'from-indigo-400 to-violet-500',
  'from-cyan-400 to-sky-500',
]

function avatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

/* ─── Status badge ──────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Message['status'] }) {
  if (status === 'new') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 shrink-0">
        <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
        Nové
      </span>
    )
  }
  if (status === 'archived') {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/10 text-gray-500 dark:text-gray-500 shrink-0">
        Archiv
      </span>
    )
  }
  return null
}

/* ─── Locale badge ──────────────────────────────────────────────────────── */

const LOCALE_FLAG: Record<Message['locale'], string> = {
  cs: 'cz',
  en: 'gb',
}

function LocaleBadge({ locale }: { locale: Message['locale'] }) {
  return (
    <span
      title={locale === 'cs' ? 'Čeština' : 'English'}
      className={['fi', `fi-${LOCALE_FLAG[locale]}`, 'rounded-sm', 'shrink-0'].join(' ')}
      style={{ fontSize: '0.85rem', lineHeight: 1 }}
    />
  )
}

/* ─── Delete confirmation modal ────────────────────────────────────────── */

function DeleteModal({
  name,
  onConfirm,
  onCancel,
  isPending,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-[#111116] border border-gray-200 dark:border-gray-800 shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <div className="text-center space-y-1">
          <h2 id="delete-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
            Smazat zprávu?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Zpráva od <span className="font-semibold text-gray-700 dark:text-gray-300">{name}</span> bude
            trvale odstraněna a nelze ji obnovit.
          </p>
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <X size={13} />
            Zrušit
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-70 shadow-sm shadow-red-500/20"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {isPending ? 'Mazání…' : 'Smazat'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main card component ───────────────────────────────────────────────── */

export function MessageCard({ m }: { m: Message }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isPendingDelete, startDeleteTransition] = useTransition()
  const [isPendingRead, startReadTransition] = useTransition()
  const [isPendingArchive, startArchiveTransition] = useTransition()

  const isLong = m.message.length > 220
  const isArchived = m.status === 'archived'
  const isRead = m.status === 'read'

  function handleDelete() {
    startDeleteTransition(async () => {
      await deleteMessage(m.id)
      setShowDeleteModal(false)
    })
  }

  function handleToggleRead() {
    startReadTransition(async () => {
      await toggleMessageRead(m.id, m.status !== 'read')
    })
  }

  function handleToggleArchive() {
    startArchiveTransition(async () => {
      await toggleMessageArchived(m.id, !isArchived)
    })
  }

  const replyHref = `mailto:${m.email}?subject=${encodeURIComponent(
    m.subject ? `Re: ${m.subject}` : 'Re: Vaše zpráva'
  )}`

  const cardBorder = m.status === 'new'
    ? 'border-l-[3px] border-l-rose-400 border-y-rose-200/60 border-r-rose-200/60 dark:border-y-rose-500/20 dark:border-r-rose-500/20 shadow-sm shadow-rose-500/5'
    : m.status === 'archived'
    ? 'border-gray-100 dark:border-gray-800/60 opacity-70'
    : 'border-gray-200 dark:border-gray-800'

  return (
    <>
      <div className={`group bg-white dark:bg-[#0f0f14] rounded-2xl border p-4 transition-all duration-200 ${cardBorder}`}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(m.name)} flex items-center justify-center shrink-0 text-white text-[11px] font-bold shadow-sm`}>
              {initials(m.name) || <Mail size={13} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.name}</p>
                <StatusBadge status={m.status} />
                <LocaleBadge locale={m.locale} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5" title={formatDate(m.created_at)}>
                {m.email} · {timeAgo(m.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <CopyEmailButton email={m.email} />
            <a
              href={replyHref}
              title="Odpovědět e-mailem"
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-sky-400 dark:hover:border-sky-500 hover:text-sky-500 transition-all"
            >
              <Reply size={12} />
              <span className="hidden sm:inline">Odpovědět</span>
            </a>
          </div>
        </div>

        {/* ── Subject ── */}
        {m.subject && (
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5 pl-0.5">{m.subject}</p>
        )}

        {/* ── Message body ── */}
        <div className="relative">
          <p className={`text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed transition-all ${isLong && !expanded ? 'line-clamp-3' : ''}`}>
            {m.message}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors"
            >
              {expanded
                ? <><ChevronUp size={12} /> Skrýt</>
                : <><ChevronDown size={12} /> Zobrazit celou zprávu</>
              }
            </button>
          )}
        </div>

        {/* ── Action bar ── */}
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 flex-wrap">

          {/* Toggle read — hidden when archived */}
          {!isArchived && (
            <button
              onClick={handleToggleRead}
              disabled={isPendingRead}
              title={isRead ? 'Označit jako nepřečtené' : 'Označit jako přečtené'}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 transition-all disabled:opacity-50"
            >
              {isPendingRead
                ? <Loader2 size={11} className="animate-spin" />
                : isRead ? <RotateCcw size={11} /> : <Check size={11} />
              }
              <span className="hidden sm:inline">{isRead ? 'Nepřečtené' : 'Přečtené'}</span>
            </button>
          )}

          {/* Archive / unarchive */}
          <button
            onClick={handleToggleArchive}
            disabled={isPendingArchive}
            title={isArchived ? 'Obnovit z archivu' : 'Archivovat'}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-500 transition-all disabled:opacity-50"
          >
            {isPendingArchive
              ? <Loader2 size={11} className="animate-spin" />
              : isArchived ? <ArchiveRestore size={11} /> : <Archive size={11} />
            }
            <span className="hidden sm:inline">{isArchived ? 'Obnovit' : 'Archivovat'}</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-red-400 dark:hover:border-red-500 hover:text-red-500 transition-all"
          >
            <Trash2 size={11} />
            <span className="hidden sm:inline">Smazat</span>
          </button>

          {/* Timestamp */}
          <span className="ml-auto text-[10px] text-gray-300 dark:text-gray-700 hidden sm:block" title={formatDate(m.created_at)}>
            {formatDate(m.created_at)}
          </span>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          name={m.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isPending={isPendingDelete}
        />
      )}
    </>
  )
}