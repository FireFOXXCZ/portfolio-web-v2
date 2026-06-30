'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Trash2, X } from 'lucide-react'
import { bulkSetPublished, bulkDeleteProjects } from '@/app/[locale]/admin/(protected)/projects/actions'
import { ConfirmDeleteModal } from '@/components/admin/confirm-delete-modal'

type Props = {
  selectedIds: string[]
  onClear: () => void
}

export function BulkActionsBar({ selectedIds, onClear }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  if (selectedIds.length === 0) return null

  const run = (action: () => Promise<void>) => {
    startTransition(async () => {
      await action()
      router.refresh()
      onClear()
    })
  }

  const handleConfirmDelete = () => {
    startTransition(async () => {
      await bulkDeleteProjects(selectedIds)
      router.refresh()
      setShowDeleteModal(false)
      onClear()
    })
  }

  return (
    <>
      <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border border-orange-500/25 bg-[#171310]/95 backdrop-blur-md shadow-lg shadow-black/40">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/15 text-orange-400 text-[11px] font-bold">
            {selectedIds.length}
          </span>
          <span className="text-[13px] text-white/70">
            {selectedIds.length === 1 ? 'vybraný projekt' : 'vybraných projektů'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => run(() => bulkSetPublished(selectedIds, true))}
            disabled={isPending}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg px-3 py-1.5 hover:bg-emerald-500/15 transition-all disabled:opacity-50"
          >
            <Eye size={13} /> Zveřejnit
          </button>
          <button
            onClick={() => run(() => bulkSetPublished(selectedIds, false))}
            disabled={isPending}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-white/60 bg-white/[0.05] border border-white/15 rounded-lg px-3 py-1.5 hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            <EyeOff size={13} /> Skrýt
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-rose-400/80 bg-rose-500/[0.06] border border-rose-500/20 rounded-lg px-3 py-1.5 hover:bg-rose-500/10 transition-all disabled:opacity-50"
          >
            <Trash2 size={13} />
            Smazat
          </button>

          <span className="w-px h-5 bg-white/[0.08] mx-1" />

          <button
            onClick={onClear}
            className="flex items-center justify-center w-7 h-7 rounded-md text-white/35 hover:text-white/70 hover:bg-white/[0.06] transition-all"
            title="Zrušit výběr"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Smazat vybrané projekty?"
        description={`Chystáš se smazat ${selectedIds.length} ${selectedIds.length === 1 ? 'projekt' : 'projektů'}. Tuto akci nelze vrátit zpět.`}
        isPending={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  )
}