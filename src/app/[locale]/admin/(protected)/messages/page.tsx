// File: app/[locale]/admin/(protected)/messages/page.tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Inbox, SearchX } from 'lucide-react'
import type { Message } from '@/lib/supabase/type'
import { MessagesSearch } from '@/components/admin/messages-search'
import { MessageCard } from '@/components/admin/message-card'
import Link from 'next/link'

type Status = 'all' | 'unread' | 'read' | 'archived'

const STATUS_ORDER: Record<string, number> = { new: 0, read: 1, archived: 2 }

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const params = await searchParams
  const q = (params.q ?? '').trim()
  const status: Status =
    params.status === 'unread' || params.status === 'read' || params.status === 'archived' ? params.status : 'all'

  const supabase = await createClient()
  const { data: allMessages } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Message[]>()

  const messages = (allMessages ?? []).sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const unreadCount = messages.filter((m) => m.status === 'new').length
  const readCount = messages.filter((m) => m.status === 'read').length
  const archivedCount = messages.filter((m) => m.status === 'archived').length

  const qLower = q.toLowerCase()
  const filtered = messages.filter((m) => {
    if (status === 'unread' && m.status !== 'new') return false
    if (status === 'read' && m.status !== 'read') return false
    if (status === 'archived' && m.status !== 'archived') return false
    if (!qLower) return true
    return (
      m.name.toLowerCase().includes(qLower) ||
      m.email.toLowerCase().includes(qLower) ||
      (m.subject?.toLowerCase().includes(qLower) ?? false) ||
      m.message.toLowerCase().includes(qLower)
    )
  })

  const tabs: { key: Status; label: string; count: number }[] = [
    { key: 'all', label: 'Vše', count: messages.length },
    { key: 'unread', label: 'Nepřečtené', count: unreadCount },
    { key: 'read', label: 'Přečtené', count: readCount },
    { key: 'archived', label: 'Archiv', count: archivedCount },
  ]

  const queryFor = (s: Status) => {
    const sp = new URLSearchParams()
    if (s !== 'all') sp.set('status', s)
    if (q) sp.set('q', q)
    const qs = sp.toString()
    return qs ? `?${qs}` : '?'
  }

  const hasActiveFilter = status !== 'all' || q.length > 0

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Inbox size={18} className="text-rose-400" />
          Zprávy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
          {unreadCount > 0
            ? `${unreadCount} nepřečtených z ${messages.length}`
            : `${messages.length} celkem, vše přečteno`}
        </p>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 w-fit shrink-0">
          {tabs.map((tab) => {
            const active = tab.key === status
            return (
              <Link
                key={tab.key}
                href={queryFor(tab.key)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  active
                    ? 'bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-gray-200/70 dark:bg-white/5 text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            )
          })}
        </div>

        <Suspense
          fallback={
            <div className="h-9 sm:max-w-xs flex-1 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          }
        >
          <MessagesSearch initialQuery={q} />
        </Suspense>
      </div>

      {/* Message list */}
      <div className="space-y-3">
        {filtered.length ? (
          filtered.map((m) => <MessageCard key={m.id} m={m} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
              {hasActiveFilter ? (
                <SearchX size={22} className="text-rose-400 opacity-50" />
              ) : (
                <Inbox size={22} className="text-rose-400 opacity-50" />
              )}
            </div>
            {hasActiveFilter ? (
              <>
                <p className="text-sm text-gray-400 dark:text-gray-600">Nic nenalezeno</p>
                <Link
                  href="?"
                  className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                >
                  Zrušit filtr
                </Link>
              </>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600">Žádné zprávy</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}