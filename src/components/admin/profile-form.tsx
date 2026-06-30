'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/type'
import type { UserIdentity } from '@supabase/supabase-js'
import { Upload, Loader2, Check, X, User, Mail, Unlink, Camera, Key, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = { profile: Profile | null }

const statusOptions = [
  { value: 'available', label: 'Dostupný', color: 'bg-emerald-500', ring: 'ring-emerald-500/30', glow: 'shadow-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  { value: 'busy', label: 'Zaneprázdněný', color: 'bg-amber-500', ring: 'ring-amber-500/30', glow: 'shadow-amber-500/20', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { value: 'unavailable', label: 'Nedostupný', color: 'bg-red-500', ring: 'ring-red-500/30', glow: 'shadow-red-500/20', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
]

const GitHubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const SpotifyIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
)

const DiscordIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.032.06a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

const socialProviders = [
  {
    key: 'github' as const,
    label: 'GitHub',
    placeholder: 'https://github.com/...',
    provider: 'github' as const,
    Icon: GitHubIcon,
    iconColor: 'text-gray-900 dark:text-white',
    iconBg: 'bg-gray-100 dark:bg-white/10',
    connectCls: 'bg-gray-900 hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/20 text-white',
    connectedBorder: 'border-gray-300 dark:border-gray-700',
    accentBg: 'bg-gray-500/5',
  },
  {
    key: 'spotify' as const,
    label: 'Spotify',
    placeholder: 'https://open.spotify.com/user/...',
    provider: 'spotify' as const,
    Icon: SpotifyIcon,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    connectCls: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    connectedBorder: 'border-emerald-300 dark:border-emerald-800',
    accentBg: 'bg-emerald-500/5',
  },
  {
    key: 'discord' as const,
    label: 'Discord',
    placeholder: 'https://discord.com/users/...',
    provider: 'discord' as const,
    Icon: DiscordIcon,
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    connectCls: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    connectedBorder: 'border-indigo-300 dark:border-indigo-800',
    accentBg: 'bg-indigo-500/5',
  },
]

export function ProfileForm({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const cvRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: profile?.name ?? '',
    title_cs: profile?.title_cs ?? '',
    title_en: profile?.title_en ?? '',
    bio_cs: profile?.bio_cs ?? '',
    bio_en: profile?.bio_en ?? '',
    status: profile?.status ?? 'available',
    github: profile?.github ?? '',
    spotify: profile?.spotify ?? '',
    discord: profile?.discord ?? '',
    email: profile?.email ?? '',
    cv_url: profile?.cv_url ?? '',
    avatar_url: profile?.avatar_url ?? '',
    github_token: profile?.github_token ?? '',
    discord_url: profile?.discord_url ?? '',
    discord_server_name: profile?.discord_server_name ?? '',
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [identities, setIdentities] = useState<UserIdentity[]>([])
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null)
  const [identityNames, setIdentityNames] = useState<Record<string, string>>({})
  const [identitySubNames, setIdentitySubNames] = useState<Record<string, string>>({})
  const [showToken, setShowToken] = useState(false)

  const fetchUserIdentities = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.identities) return

    setIdentities(user.identities)
    const names: Record<string, string> = {}
    const subs: Record<string, string> = {}

    const githubIdentity = user.identities.find(i => i.provider === 'github')
    if (githubIdentity) {
      const username = user.user_metadata?.user_name || githubIdentity.identity_data?.user_name
      if (username) {
        names['github'] = username
        setForm(f => ({ ...f, github: f.github || `https://github.com/${username}` }))
      }
    }

    const discordIdentity = user.identities.find(i => i.provider === 'discord')
    if (discordIdentity) {
      const discordDisplay = discordIdentity.identity_data?.custom_claims?.global_name
      const discordUsername = discordIdentity.identity_data?.full_name
      if (discordDisplay) {
        names['discord'] = discordDisplay
        if (discordUsername && discordUsername !== discordDisplay) subs['discord'] = `@${discordUsername}`
      } else if (discordUsername) {
        names['discord'] = discordUsername
      }
      const discordId = discordIdentity.identity_data?.sub || discordIdentity.identity_data?.provider_id
      if (discordId) setForm(f => ({ ...f, discord: f.discord || `https://discord.com/users/${discordId}` }))
    }

    const spotifyIdentity = user.identities.find(i => i.provider === 'spotify')
    if (spotifyIdentity) {
      const spotifyName =
        spotifyIdentity.identity_data?.full_name ||
        spotifyIdentity.identity_data?.name ||
        spotifyIdentity.identity_data?.user_name
      if (spotifyName) names['spotify'] = spotifyName
      const spotifyId = spotifyIdentity.identity_data?.sub || spotifyIdentity.identity_data?.id
      if (spotifyId) setForm(f => ({ ...f, spotify: f.spotify || `https://open.spotify.com/user/${spotifyId}` }))
    }

    setIdentityNames(names)
    setIdentitySubNames(subs)
  }, [supabase])

  useEffect(() => { fetchUserIdentities() }, [fetchUserIdentities])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'USER_UPDATED') {
        await fetchUserIdentities()
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, fetchUserIdentities])

  const handleLinkIdentity = async (provider: 'github' | 'spotify' | 'discord') => {
    setLinkingProvider(provider)
    setError(null)
    try {
      const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo: window.location.href } })
      if (error) throw error
      await fetchUserIdentities()
    } catch (err: unknown) {
      setError(`Nepodařilo se propojit ${provider}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLinkingProvider(null)
    }
  }

  const handleUnlinkIdentity = async (provider: 'github' | 'spotify' | 'discord') => {
    const targetIdentity = identities.find(i => i.provider === provider)
    if (!targetIdentity) return
    setError(null)
    try {
      const { error } = await supabase.auth.unlinkIdentity(targetIdentity)
      if (error) throw error
      if (provider === 'github') setForm(f => ({ ...f, github: '' }))
      if (provider === 'spotify') setForm(f => ({ ...f, spotify: '' }))
      if (provider === 'discord') setForm(f => ({ ...f, discord: '' }))
      await fetchUserIdentities()
    } catch (err: unknown) {
      setError(`Nepodařilo se odpojit ${provider}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const isConnected = (provider: string) => identities.some(i => i.provider === provider)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setForm(f => ({ ...f, avatar_url: data.publicUrl }))
    } catch (err) { setError('Nepodařilo se nahrát obrázek.'); console.error(err) }
    finally { setUploading(false) }
  }

  const handleCv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCv(true)
    setError(null)
    try {
      const fileName = `cv-${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage.from('cv').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('cv').getPublicUrl(fileName)
      setForm(f => ({ ...f, cv_url: data.publicUrl }))
    } catch (err) { setError('Nepodařilo se nahrát CV.'); console.error(err) }
    finally { setUploadingCv(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const supabaseClient = createClient()
      if (profile?.id) {
        const { error } = await supabaseClient.from('profile').update({ ...form, updated_at: new Date().toISOString() }).eq('id', profile.id)
        if (error) throw error
      } else {
        const { error } = await supabaseClient.from('profile').insert({ ...form })
        if (error) throw error
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } catch (err) { setError('Nepodařilo se uložit profil.'); console.error(err) }
    finally { setSaving(false) }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const currentStatus = statusOptions.find(s => s.value === form.status) ?? statusOptions[0]

  return (
    <div className="space-y-4">

      {/* ── Avatar + Status card ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-100 dark:border-gray-800/80 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 relative shrink-0">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="px-5 pt-3 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="relative group -mt-14 shrink-0">
              <div className="w-24 h-24 rounded-2xl ring-4 ring-white dark:ring-[#0f0f14] overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-xl">
                {avatarPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <User size={32} className="text-white" />
                }
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 size={18} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <Camera size={20} className="text-white" />
              </button>
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#0f0f14] ${currentStatus.color} shadow-md`} />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input ref={fileRef} type="file" accept="image/*,.gif" onChange={handleFile} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-all disabled:opacity-50"
              >
                <Upload size={12} />
                {uploading ? 'Nahrávám...' : 'Změnit foto'}
              </button>
              {form.avatar_url && (
                <button
                  onClick={() => { setForm(f => ({ ...f, avatar_url: '' })); setAvatarPreview(null) }}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition-all"
                >
                  <X size={11} /> Odebrat
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2.5">Status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, status: opt.value as typeof f.status }))}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                    form.status === opt.value
                      ? `${opt.bg} ${opt.text} shadow-sm`
                      : 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 hover:border-gray-300 dark:hover:border-gray-700 bg-transparent'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${opt.color} ${form.status === opt.value ? 'shadow-sm ' + opt.glow : ''}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Základní info ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-100 dark:border-gray-800/80 p-5 space-y-4">
        <SectionTitle>Základní informace</SectionTitle>

        <Field label="Jméno" required>
          <input value={form.name} onChange={set('name')} placeholder="Jan Novák" className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Titulek 🇨🇿">
            <input value={form.title_cs} onChange={set('title_cs')} placeholder="Full-stack developer" className={inputCls} />
          </Field>
          <Field label="Titulek 🇬🇧">
            <input value={form.title_en} onChange={set('title_en')} placeholder="Full-stack developer" className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Bio 🇨🇿">
            <textarea value={form.bio_cs} onChange={set('bio_cs')} placeholder="Pár vět o tobě..." rows={4} className={inputCls + ' resize-none'} />
          </Field>
          <Field label="Bio 🇬🇧">
            <textarea value={form.bio_en} onChange={set('bio_en')} placeholder="A few words about you..." rows={4} className={inputCls + ' resize-none'} />
          </Field>
        </div>
      </div>

      {/* ── Kontakt & CV ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-100 dark:border-gray-800/80 p-5 space-y-4">
        <SectionTitle>Kontakt & CV</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" icon={<Mail size={12} />}>
            <input value={form.email} onChange={set('email')} placeholder="hi@example.com" type="email" className={inputCls} />
          </Field>

          <Field label="CV (PDF)">
            <input ref={cvRef} type="file" accept=".pdf" onChange={handleCv} className="hidden" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cvRef.current?.click()}
                disabled={uploadingCv}
                className={`${inputCls} flex items-center gap-2 cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 text-gray-500 dark:text-gray-400 transition-all disabled:opacity-50 whitespace-nowrap`}
              >
                {uploadingCv ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Upload size={13} className="shrink-0" />}
                {uploadingCv ? 'Nahrávám...' : 'Nahrát PDF'}
              </button>
            </div>
            {form.cv_url && (
              <div className="flex items-center gap-2 mt-1.5">
                <a href={form.cv_url} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1">
                  <Check size={10} strokeWidth={3} /> CV nahráno — zobrazit
                </a>
                <button type="button" onClick={() => setForm(f => ({ ...f, cv_url: '' }))}
                  className="text-gray-400 hover:text-red-400 transition-colors">
                  <X size={11} />
                </button>
              </div>
            )}
          </Field>
        </div>
      </div>

      {/* ── Sociální sítě ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0f0f14] rounded-2xl border border-gray-100 dark:border-gray-800/80 p-5 space-y-3">
        <SectionTitle>Sociální sítě</SectionTitle>

        {socialProviders.map(({ key, label, provider, Icon, iconColor, iconBg, connectCls, connectedBorder, accentBg }) => {
          const connected = isConnected(provider)
          const isLoading = linkingProvider === provider
          const displayName = identityNames[provider]

          return (
            <div
              key={key}
              className={`rounded-xl border transition-all duration-200 ${
                connected
                  ? `${connectedBorder} ${accentBg}`
                  : 'border-gray-200 dark:border-gray-800 bg-transparent hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              {/* Hlavní řádek */}
              <div className="flex items-center gap-3 p-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <span className={iconColor}><Icon size={17} /></span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                  {form[key] ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{form[key]}</p>
                  ) : (
                    <p className="text-sm text-gray-300 dark:text-gray-700">
                      {connected ? 'Propojeno' : 'Nepropojeno'}
                    </p>
                  )}
                </div>

                {connected ? (
                  <div className="flex items-center gap-2 shrink-0">
                    {displayName ? (
                      <div className="hidden sm:flex flex-col items-end gap-0.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                          <Check size={9} strokeWidth={3} className="shrink-0" />
                          {displayName}
                        </span>
                        {identitySubNames[provider] && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 pr-1 font-medium">
                            {identitySubNames[provider]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                        <Check size={9} strokeWidth={3} /> Propojeno
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUnlinkIdentity(provider)}
                      title="Odpojit"
                      className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      <Unlink size={11} />
                      <span className="hidden sm:inline">Odpojit</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleLinkIdentity(provider)}
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 shadow-sm ${connectCls}`}
                  >
                    {isLoading
                      ? <Loader2 size={11} className="animate-spin" />
                      : <span className="opacity-80"><Icon size={11} /></span>
                    }
                    Propojit
                  </button>
                )}
              </div>

              {/* GitHub token řádek — zobrazí se pouze pro GitHub */}
              {key === 'github' && (
                <div className="px-3.5 pb-3.5 pt-0">
                  <div className={`rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] px-3.5 py-3`}>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2">
                      <Key size={10} />
                      Personal Access Token
                    </label>
                    <div className="relative">
                      <input
                        value={form.github_token}
                        onChange={set('github_token')}
                        type={showToken ? 'text' : 'password'}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className={inputCls + ' pr-10 font-mono text-xs'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        tabIndex={-1}
                        aria-label={showToken ? 'Skrýt token' : 'Zobrazit token'}
                      >
                        {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-600 flex items-center gap-1">
                      Potřebuješ scope{' '}
                      <code className="text-[10px] bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 font-mono">read:user</code>
                      {' '}a{' '}
                      <code className="text-[10px] bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 font-mono">repo</code>
                    </p>
                  </div>
                </div>
              )}

              {/* Discord server — pozvánka + název serveru */}
              {key === 'discord' && (
                <div className="px-3.5 pb-3.5 pt-0 space-y-2">
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] px-3.5 py-3 space-y-3">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                      <DiscordIcon size={10} />
                      Server
                    </label>
                    {/* Název serveru */}
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-1">Název serveru</p>
                      <input
                        value={form.discord_server_name}
                        onChange={set('discord_server_name')}
                        placeholder="Můj Discord server"
                        className={inputCls}
                      />
                    </div>
                    {/* Pozvánka */}
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-1">Pozvánka na server</p>
                      <input
                        value={form.discord_url}
                        onChange={set('discord_url')}
                        placeholder="https://discord.gg/..."
                        className={inputCls}
                      />
                      <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-600">
                        Zobrazí se ve footeru místo odkazu na tvůj Discord profil
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Sticky save bar ──────────────────────────────────────── */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white/80 dark:bg-[#0f0f14]/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 shadow-xl shadow-black/10 dark:shadow-black/40">
          <div className="flex-1 min-w-0">
            {error ? (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <X size={14} className="shrink-0" />
                <span className="truncate">{error}</span>
              </div>
            ) : saved ? (
              <div className="flex items-center gap-2 text-sm text-emerald-500">
                <Check size={14} className="shrink-0" />
                <span>Profil byl uložen</span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-600 truncate">Nezapomeň uložit změny</p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/35 active:scale-[0.98]"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Ukládám...</>
            ) : saved ? (
              <><Check size={14} /> Uloženo!</>
            ) : (
              'Uložit profil'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 transition-colors'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800/80">
      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {children}
      </p>
    </div>
  )
}

function Field({ label, children, required, icon }: {
  label: string
  children: React.ReactNode
  required?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        {icon}{label}{required && <span className="text-orange-500">*</span>}
      </label>
      {children}
    </div>
  )
}