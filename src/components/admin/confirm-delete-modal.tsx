'use client'

import { useEffect } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel = 'Smazat',
  cancelLabel = 'Zrušit',
  isPending = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#13110f] p-6 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-4">
          <AlertTriangle size={20} className="text-rose-400" />
        </div>

        <h3 className="text-[15px] font-semibold text-white/90 mb-1.5">
          {title}
        </h3>
        <p className="text-[13px] text-white/45 leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white/55 hover:text-white/85 hover:bg-white/[0.05] transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-[13px] font-semibold transition-all disabled:opacity-60"
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}