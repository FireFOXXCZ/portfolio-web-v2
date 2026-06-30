// File: src/app/[locale]/admin/(protected)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import {
  FolderOpen, Zap, Briefcase, FileText, User,
  ArrowRight, Plus, Mail, ExternalLink,
  TrendingUp, Eye, 
  Inbox, Star, Sparkles, MailOpen,
} from 'lucide-react'
import Link from 'next/link'
import type { Profile, Project, Post, Message } from '@/lib/supabase/type'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Dobrou noc'
  if (hour < 12) return 'Dobré ráno'
  if (hour < 18) return 'Dobré odpoledne'
  return 'Dobrý večer'
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
  return new Date(dateStr).toLocaleDateString('cs-CZ')
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: projectsTotal },
    { count: projectsPublished },
    { count: skillsTotal },
    { count: experienceTotal },
    { count: postsTotal },
    { count: postsPublished },
    { count: messagesUnread },
    { count: reviewsPending },
    { data: profile },
    { data: recentProjects },
    { data: recentPosts },
    { data: recentMessages },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('skills').select('*', { count: 'exact', head: true }),
    supabase.from('experience').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('published', false),
    supabase.from('profile').select('*').single<Profile>(),
    supabase.from('projects').select('id, name, published, created_at').order('created_at', { ascending: false }).limit(5).returns<Project[]>(),
    supabase.from('posts').select('id, slug, title_cs, published, created_at').order('created_at', { ascending: false }).limit(5).returns<Post[]>(),
    supabase.from('messages').select('id, name, email, message, status, created_at').order('created_at', { ascending: false }).limit(5).returns<Message[]>(),
  ])

  const statusConfig = {
    available: {
      label: 'Dostupný',
      dot: 'bg-green-400',
      badge: 'bg-green-500/10 text-green-400 border-green-500/20',
    },
    busy: {
      label: 'Zaneprázdněný',
      dot: 'bg-yellow-400',
      badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    },
    unavailable: {
      label: 'Nedostupný',
      dot: 'bg-red-400',
      badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  }
  const status = statusConfig[profile?.status as keyof typeof statusConfig] ?? statusConfig.unavailable

  const stats = [
    {
      label: 'Projekty',
      total: projectsTotal ?? 0,
      published: projectsPublished ?? 0,
      icon: FolderOpen,
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      href: '/admin/projects',
      suffix: 'živých',
    },
    {
      label: 'Dovednosti',
      total: skillsTotal ?? 0,
      published: null,
      icon: Zap,
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      href: '/admin/skills',
      suffix: 'technologií',
    },
    {
      label: 'Zkušenosti',
      total: experienceTotal ?? 0,
      published: null,
      icon: Briefcase,
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      href: '/admin/experience',
      suffix: 'pozic',
    },
    {
      label: 'Blog',
      total: postsTotal ?? 0,
      published: postsPublished ?? 0,
      icon: FileText,
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      href: '/admin/posts',
      suffix: 'živých',
    },
  ]

  const inboxStats = [
    {
      label: 'Zprávy',
      count: messagesUnread ?? 0,
      icon: Inbox,
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      ring: 'bg-rose-400',
      href: '/admin/messages',
      noun: 'nepřečtených',
      empty: 'Žádné nové zprávy',
    },
    {
      label: 'Recenze',
      count: reviewsPending ?? 0,
      icon: Star,
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      ring: 'bg-amber-400',
      href: '/admin/reviews',
      noun: 'ke schválení',
      empty: 'Žádné čekající recenze',
    },
  ]

  const quickActions = [
     { label: 'Nový projekt', href: '/admin/projects?new=1', icon: FolderOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/40' },
    { label: 'Nový příspěvek', href: '/admin/posts/new', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/40' },
    { label: 'Přidat Dovednost', href: '/admin/skills/new', icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'hover:border-violet-500/40' },
    { label: 'Upravit profil', href: '/admin/profile', icon: User, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/40' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Nadpis */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Přehled</h1>
          <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-500 mt-0.5">
            <Sparkles size={13} className="text-orange-400" />
            {getGreeting()}
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700/80 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 transition-all"
        >
          <Eye size={12} />
          Zobrazit web
          <ExternalLink size={10} className="opacity-60" />
        </a>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.text} strokeWidth={2} />
              </div>
              <ArrowRight size={14} className={`${stat.text} opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0`} />
            </div>
            <div className={`text-3xl font-black ${stat.text} leading-none mb-1`}>
              {stat.total}
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{stat.label}</div>
            <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
              {stat.published !== null ? `${stat.published} ${stat.suffix}` : stat.suffix}
            </div>
          </Link>
        ))}
      </div>

      {/* Schránka */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Inbox size={13} className="text-orange-500" />
          <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Schránka</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {inboxStats.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative flex items-center gap-4 bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
            >
              <div className={`relative w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon size={18} className={item.text} strokeWidth={2} />
                {item.count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.ring} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${item.ring}`} />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black ${item.text} leading-none`}>{item.count}</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{item.noun}</p>
              </div>
              <ArrowRight size={14} className={`${item.text} opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0 shrink-0`} />
            </Link>
          ))}
        </div>
      </div>

      {/* Poslední zprávy */}
      <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <Inbox size={12} className="text-rose-400" />
            </div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Poslední zprávy</p>
          </div>
          <Link
            href="/admin/messages"
            className="text-xs text-orange-500 hover:text-orange-400 font-medium flex items-center gap-1 transition-colors"
          >
            Všechny <ArrowRight size={11} />
          </Link>
        </div>
        <div className="space-y-1">
          {recentMessages?.length ? recentMessages.map((m) => (
            <Link
              key={m.id}
              href="/admin/messages"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all group"
            >
              {/* Ikona přečteno/nepřečteno/archiv */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                m.status === 'new'
                  ? 'bg-rose-500/10'
                  : 'bg-gray-100 dark:bg-white/5'
              }`}>
                {m.status === 'new'
                  ? <Mail size={12} className="text-rose-400" />
                  : <MailOpen size={12} className="text-gray-400 dark:text-gray-600" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors ${
                    m.status === 'new'
                      ? 'text-gray-800 dark:text-gray-200'
                      : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {m.name}
                    <span className="text-gray-400 dark:text-gray-600 font-normal"> · {m.email}</span>
                  </p>
                  {m.status === 'new' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  )}
                </div>
                <p className="text-[12px] text-gray-400 dark:text-gray-600 truncate">{m.message}</p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] text-gray-400 dark:text-gray-600">{timeAgo(m.created_at)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  m.status === 'new'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600'
                }`}>
                  {m.status === 'new' ? 'Nové' : m.status === 'archived' ? 'Archiv' : 'Přečteno'}
                </span>
              </div>
            </Link>
          )) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Inbox size={18} className="text-rose-400 opacity-50" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-600">Žádné zprávy</p>
            </div>
          )}
        </div>
      </div>

      {/* Profil + Rychlé akce */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Profil card */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-orange-500/20 via-red-500/10 to-purple-500/20 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 dark:to-[#0f0f14]/80" />
          </div>

          <div className="px-6 pb-6 -mt-8 relative">
            <div className="flex items-end justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-xl shadow-orange-500/30 ring-4 ring-white dark:ring-[#0f0f14] shrink-0">
                {profile?.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  : <User size={24} className="text-white" />
                }
              </div>
              <Link
                href="/admin/profile"
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 transition-all"
              >
                Upravit profil
                <ArrowRight size={11} />
              </Link>
            </div>

            <div className="flex items-start gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {profile?.name ?? 'Nenastaveno'}
                  </h2>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status.badge}`}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.dot} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.dot}`} />
                    </span>
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile?.title_cs ?? '—'}</p>
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              {[
                {
                  key: 'github',
                  label: 'GitHub',
                  icon: () => (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  ),
                  color: null,
                },
                {
                  key: 'spotify',
                  label: 'Spotify',
                  icon: () => (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#1DB954">
                      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.52 17.3c-.21.35-.66.46-1.01.25-2.76-1.69-6.24-2.07-10.33-1.13-.4.09-.8-.16-.89-.56-.09-.4.16-.8.56-.89 4.48-1.02 8.33-.58 11.42 1.32.35.21.46.66.25 1.01zm1.47-3.27c-.27.44-.83.57-1.27.31-3.16-1.94-7.97-2.5-11.7-1.37-.47.14-.97-.13-1.11-.6-.14-.47.13-.97.6-1.11 4.26-1.29 9.56-.67 13.17 1.51.44.27.57.83.31 1.26zm.13-3.4C15.73 8.43 9.86 8.24 6.37 9.3a1 1 0 0 1-.56-1.92c4.04-1.18 10.76-.95 15.01 1.57a1 1 0 0 1-1.7 1.68z"/>
                    </svg>
                  ),
                  color: '#1DB954',
                },
                {
                  key: 'discord',
                  label: 'Discord',
                  icon: () => (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#5865F2">
                      <path d="M20.32 4.37A19.8 19.8 0 0 0 15.38 3c-.22.4-.48.93-.65 1.35a18.3 18.3 0 0 0-5.46 0C9.1 3.93 8.83 3.4 8.61 3A19.74 19.74 0 0 0 3.66 4.37C.53 9.14-.32 13.8.1 18.4a19.93 19.93 0 0 0 6.07 3.07c.49-.66.93-1.37 1.3-2.1a12.96 12.96 0 0 1-2.05-1 11.1 11.1 0 0 0 .51-.4 14.2 14.2 0 0 0 12.14 0c.17.14.34.27.51.4-.65.38-1.34.71-2.06 1 .37.73.81 1.44 1.3 2.1a19.87 19.87 0 0 0 6.08-3.07c.5-5.26-.85-9.87-3.58-14.03zM8.02 15.68c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.2 0 2.17 1.09 2.15 2.42 0 1.33-.95 2.41-2.15 2.41zm7.96 0c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.2 0 2.17 1.09 2.15 2.42 0 1.33-.94 2.41-2.15 2.41z"/>
                    </svg>
                  ),
                  color: '#5865F2',
                },
                {
                  key: 'email',
                  label: 'Email',
                  icon: () => (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-10 7L2 7"/>
                    </svg>
                  ),
                  color: null,
                },
              ].map(s => {
                const value = profile?.[s.key as keyof Profile]
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                      value
                        ? 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                        : 'bg-gray-50 dark:bg-white/[0.02] text-gray-300 dark:text-gray-700'
                    }`}
                  >
                    <s.icon />
                    {s.label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Rychlé akce */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={13} className="text-orange-500" />
            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Rychlé akce</p>
          </div>
          <div className="flex flex-col gap-2">
            {quickActions.map(action => (
              <Link
                key={action.label}
                href={action.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-100 dark:border-gray-800 ${action.border} hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all duration-150 group`}
              >
                <div className={`w-8 h-8 rounded-xl ${action.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-150`}>
                  <action.icon size={14} className={action.color} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                  {action.label}
                </span>
                <Plus size={14} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Poslední projekty + příspěvky */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Projekty */}
        <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FolderOpen size={12} className="text-blue-400" />
              </div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Poslední projekty</p>
            </div>
            <Link
              href="/admin/projects"
              className="text-xs text-orange-500 hover:text-orange-400 font-medium flex items-center gap-1 transition-colors"
            >
              Všechny <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-1">
            {recentProjects?.length ? recentProjects.map((p) => (
              <Link
                key={p.id}
                href={`/admin/projects?edit=${p.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <FolderOpen size={12} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-600">
                    {new Date(p.created_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.published
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600'
                }`}>
                  {p.published ? 'Živý' : 'Skrytý'}
                </span>
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FolderOpen size={18} className="text-blue-400 opacity-50" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-600">Žádné projekty</p>
                <Link
                  href="/admin/projects?new=1"
                  className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                >
                  + Přidat první projekt
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Blog */}
        <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FileText size={12} className="text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Poslední příspěvky</p>
            </div>
            <Link
              href="/admin/posts"
              className="text-xs text-orange-500 hover:text-orange-400 font-medium flex items-center gap-1 transition-colors"
            >
              Všechny <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-1">
            {recentPosts?.length ? recentPosts.map((p) => (
              <Link
                key={p.id}
                href={`/admin/posts/${p.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <FileText size={12} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {p.title_cs ?? p.slug}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-600">
                    {new Date(p.created_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.published
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600'
                }`}>
                  {p.published ? 'Živý' : 'Skrytý'}
                </span>
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <FileText size={18} className="text-emerald-400 opacity-50" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-600">Žádné příspěvky</p>
                <Link
                  href="/admin/posts/new"
                  className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                >
                  + Napsat první příspěvek
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}