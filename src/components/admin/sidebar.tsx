// File: components/admin/sidebar.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, FolderOpen, Zap,
  Briefcase, FileText, User, LogOut, ChevronRight, Inbox
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin/dashboard', label: 'Přehled', icon: LayoutDashboard, exact: true },
  { href: '/admin/messages', label: 'Zprávy', icon: Inbox },
  { href: '/admin/profile', label: 'Profil', icon: User },
  { href: '/admin/projects', label: 'Projekty', icon: FolderOpen },
  { href: '/admin/skills', label: 'Dovednosti', icon: Zap },
  { href: '/admin/experience', label: 'Zkušenosti', icon: Briefcase },
  { href: '/admin/posts', label: 'Blog', icon: FileText },
]

export function AdminSidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin')
    router.refresh()
  }

  const isActive = (item: typeof navItems[0]) =>
    item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href)

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0f]">

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-md shadow-orange-500/20">
            <span className="text-white font-black text-xs leading-none">fx</span>
          </div>
          <div className="leading-none">
            <span className="text-sm font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">firefoxx</span>
            <span className="text-sm text-gray-400 dark:text-gray-600">.online</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-700 uppercase tracking-widest px-3 py-2">
          Správa
        </p>
        {navItems.map(item => {
          const active = isActive(item)
          const isMessages = item.href === '/admin/messages'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                  : 'text-gray-600 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <item.icon size={15} className={active ? 'text-orange-500' : ''} />
              <span className="flex-1">{item.label}</span>
              {isMessages && unreadCount > 0 ? (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                active && <ChevronRight size={12} className="opacity-40" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <LogOut size={15} />
          Odhlásit se
        </button>
      </div>
    </aside>
  )
}