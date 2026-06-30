'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, X, ChevronDown, LogIn, FileDown, Globe, LayoutDashboard, LogOut } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Link, usePathname } from '@/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/type'

const languages = [
  { code: 'cs', label: 'Čeština', countryCode: 'cz' },
  { code: 'en', label: 'English', countryCode: 'gb' },
]

interface NavbarProps {
  profile?: { cv_url?: string | null } | null
}

export function Navbar({ profile }: NavbarProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    const supabase = createClient()

    async function fetchProfile(userId: string) {
      const { data } = await supabase
        .from('profile')
        .select('name, avatar_url')
        .eq('id', userId)
        .single()
      const profile = data as Pick<Profile, 'name' | 'avatar_url'> | null
      setProfileName(profile?.name ?? null)
      setAvatarUrl(profile?.avatar_url ?? null)
    }

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else { setProfileName(null); setAvatarUrl(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUserOpen(false)
  }

  // Stáhne CV jako blob, aby fungovalo i u cross-origin URL (Supabase Storage apod.)
  async function downloadCv(url: string, e: React.MouseEvent) {
    e.preventDefault()
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'CV.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  // Funkce pro plynulé odrolování nahoru (smooth scroll) bez teleportace
  const scrollToTop = (e: React.MouseEvent) => {
    if (window.location.hash || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/en')) {
      e.preventDefault()
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      window.history.pushState(null, '', window.location.pathname)
    }
  }

  const navLinks = [
    { href: 'about', label: t('about') },
    { href: 'projects', label: t('projects') },
    { href: 'skills', label: t('skills') },
    { href: 'review', label: t('review') },
    { href: 'blog', label: t('blog') },
    { href: 'contact', label: t('contact') },
  ]

  const currentLang = languages.find(l => l.code === locale) ?? languages[0]

  const displayName = profileName ?? user?.email ?? ''
  const userInitials = profileName
    ? profileName.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
    : (user?.email?.slice(0, 2).toUpperCase() ?? '??')

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-3 px-4">
      <nav className="mx-auto flex items-center gap-4 max-w-6xl h-[72px] px-6 rounded-2xl border border-gray-200/50 dark:border-white/[0.08] bg-white/90 dark:bg-[#0d0d14]/90 backdrop-blur-xl shadow-xl shadow-black/[0.08] dark:shadow-black/40">
        
        {/* PŘIDÁNO: onClick={scrollToTop} pro plynulé vyrolování nahoru při zachování správného odkazu */}
        <Link 
          href="/" 
          onClick={scrollToTop}
          className="flex items-center gap-2.5 shrink-0 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
            <span className="text-white font-black text-sm tracking-tighter leading-none select-none">fx</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[18px] font-extrabold bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
              firefoxx
            </span>
            <span className="text-[15px] font-medium text-gray-400 dark:text-gray-500 group-hover:text-orange-500 transition-colors">.online</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden lg:flex items-center gap-0.5 p-1 rounded-xl bg-gray-500/[0.03] dark:bg-white/[0.02]">
          {navLinks.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="relative px-3 py-1.5 text-[13px] font-medium transition-all duration-200 rounded-lg hover:bg-orange-500/[0.06] dark:hover:bg-orange-500/[0.08] group block whitespace-nowrap text-gray-700 dark:text-gray-200 hover:text-orange-500 dark:hover:text-orange-400"
              >
                {link.label}
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex-1" />

        {/* Pravé ovládací prvky */}
        <div className="flex items-center gap-1.5">

          {/* Jazykový dropdown */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl transition-all duration-300 text-[12px] font-bold tracking-wide ${
                langOpen
                  ? 'bg-orange-500/5 text-orange-500'
                  : 'bg-gray-50 dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.08]'
              }`}
            >
              <Globe size={13} className={langOpen ? 'text-orange-500' : 'text-gray-500 dark:text-gray-300'} />
              <span className="uppercase">{currentLang.code}</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-300 ${langOpen ? 'rotate-180 text-orange-500' : 'text-gray-400'}`}
              />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c0c14]/95 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                <div className="p-1.5 flex flex-col gap-0.5">
                  {languages.map(lang => (
                    <Link
                      key={lang.code}
                      href={pathname}
                      locale={lang.code as 'cs' | 'en'}
                      onClick={() => setLangOpen(false)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                        lang.code === locale
                          ? 'bg-gradient-to-r from-orange-500/10 to-transparent text-orange-600 dark:text-orange-400 font-semibold'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className={`fi fi-${lang.countryCode} rounded-md shadow-sm border border-black/[0.04] dark:border-white/[0.06]`} style={{ fontSize: '1.1rem' }} />
                      <span>{lang.label}</span>
                      {lang.code === locale && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Přepínač témat */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-300 group bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08]"
              aria-label="Toggle theme"
            >
              <div className="transition-transform duration-500 group-hover:rotate-45">
                {theme === 'dark'
                  ? <Sun size={15} className="text-amber-400" />
                  : <Moon size={15} className="text-gray-700" />
                }
              </div>
            </button>
          )}

          {/* Uživatelský profil (Desktop) */}
          {mounted && (
            user ? (
              <div ref={userRef} className="relative hidden md:block">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className={`flex items-center gap-2 h-9 px-2 pr-3 rounded-xl transition-all duration-300 ${
                    userOpen
                      ? 'bg-orange-500/5 text-orange-500'
                      : 'bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shrink-0 overflow-hidden">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-[9px] font-black leading-none">{userInitials}</span>
                    )}
                  </div>
                  <span className="text-[12px] font-medium max-w-[120px] truncate text-gray-700 dark:text-gray-200">
                    {displayName}
                  </span>
                  <ChevronDown
                    size={11}
                    className={`transition-transform duration-300 shrink-0 ${userOpen ? 'rotate-180 text-orange-500' : 'text-gray-400'}`}
                  />
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c0c14]/95 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Přihlášen jako</p>
                      {profileName && <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{profileName}</p>}
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-1.5 flex flex-col gap-0.5">
                      <Link
                        href="/admin"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all duration-200 font-medium"
                      >
                        <LayoutDashboard size={14} className="text-orange-500" />
                        Admin panel
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/[0.06] hover:text-red-500 transition-all duration-200 font-medium"
                      >
                        <LogOut size={14} />
                        Odhlásit se
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 h-9 px-3.5 rounded-xl transition-all duration-300 text-[13px] font-medium hover:text-orange-500 dark:hover:text-orange-400 bg-gray-50 dark:bg-white/[0.04] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.08]"
              >
                <LogIn size={13} />
                <span>Login</span>
              </Link>
            )
          )}

          {/* Tlačítko CV */}
          {profile?.cv_url && (
          <a
            href={profile.cv_url}
            onClick={(e) => downloadCv(profile.cv_url!, e)}
            className="hidden md:flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white text-[13px] font-semibold whitespace-nowrap transition-all duration-300 shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <FileDown size={14} className="shrink-0" />
            <span>{t('downloadCv')}</span>
          </a>
           )}

          {/* Mobilní menu - Hamburger */}
          <button
            className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/[0.04] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={17} className="text-orange-500" /> : <Menu size={17} className="text-gray-500 dark:text-gray-400" />}
          </button>
        </div>
      </nav>

      {/* Mobilní rozbalené menu */}
      {menuOpen && (
        <div className="lg:hidden mt-2 mx-auto max-w-6xl border border-gray-200/60 dark:border-white/[0.08] bg-white/98 dark:bg-[#0c0c14]/98 backdrop-blur-xl px-4 pb-5 pt-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Uživatelský Info Panel na Mobilu */}
          {mounted && user && (
            <div className="mb-3 mx-1 p-3 rounded-xl bg-gray-500/[0.04] dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/10 overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-black leading-none">{userInitials}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">
                    {profileName || 'Uživatel'}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigační odkazy */}
          <div className="flex flex-col gap-1 mb-4">
            {navLinks.map((link, idx) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-500/[0.03] transition-all duration-200"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {link.label}
              </a>
            ))}
          </div>
              
          <div className="h-px bg-gray-100 dark:bg-white/[0.06] mx-2 mb-4" />

          {/* Akce spodní části mobilního menu */}
          <div className="flex flex-col gap-2.5 px-1">
            {mounted && (
              user ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 dark:border-white/[0.06] text-[13.5px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-white dark:bg-transparent"
                  >
                    <LayoutDashboard size={14} className="text-orange-500" />
                    Admin panel
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setMenuOpen(false) }}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl border border-red-200 dark:border-red-500/20 text-[13.5px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/[0.06] transition-colors"
                  >
                    <LogOut size={14} />
                    Odhlásit se
                  </button>
                </>
              ) : (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 dark:border-white/[0.06] text-[13.5px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-white dark:bg-transparent"
                >
                  <LogIn size={14} />
                  Login
                </Link>
              )
            )}
            <a
              href="/cv.pdf"
              download
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white text-[13.5px] font-semibold whitespace-nowrap shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-transform"
            >
              <FileDown size={15} className="shrink-0" />
              {t('downloadCv')}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}