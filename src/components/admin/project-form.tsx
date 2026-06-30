'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, Plus, Loader2, ChevronDown, Star, Maximize2, Lock, BookOpen, Search, RefreshCw } from 'lucide-react'
import type { Project } from '@/lib/supabase/type'
import { createProject, updateProject, uploadProjectImage, getGithubRepos } from '@/app/[locale]/admin/(protected)/projects/actions'


type GithubRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  private: boolean
  language: string | null
  stargazers_count: number
  updated_at: string
}

const TECH_PRESETS: { label: string; slug: string; color: string }[] = [
  { label: 'Next.js', slug: 'nextdotjs', color: '000000' },
  { label: 'React', slug: 'react', color: '61DAFB' },
  { label: 'TypeScript', slug: 'typescript', color: '3178C6' },
  { label: 'JavaScript', slug: 'javascript', color: 'F7DF1E' },
  { label: 'Tailwind CSS', slug: 'tailwindcss', color: '06B6D4' },
  { label: 'Supabase', slug: 'supabase', color: '3FCF8E' },
  { label: 'Node.js', slug: 'nodedotjs', color: '339933' },
  { label: 'PostgreSQL', slug: 'postgresql', color: '4169E1' },
  { label: 'Vue.js', slug: 'vuedotjs', color: '4FC08D' },
  { label: 'Python', slug: 'python', color: '3776AB' },
  { label: 'Docker', slug: 'docker', color: '2496ED' },
  { label: 'GraphQL', slug: 'graphql', color: 'E10098' },
  { label: 'MongoDB', slug: 'mongodb', color: '47A248' },
  { label: 'Figma', slug: 'figma', color: 'F24E1E' },
  { label: 'Vite', slug: 'vite', color: '646CFF' },
  { label: 'Git', slug: 'git', color: 'F05032' },
  { label: 'Vercel', slug: 'vercel', color: 'FFFFFF' },
  { label: 'Stripe', slug: 'stripe', color: '635BFF' },
]

type Props = {
  project?: Project | null
  onClose: () => void
}

const EMPTY: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  description_cs: '',
  description_en: '',
  tags: [],
  image_url: null,
  gallery: [],
  demo_url: null,
  github_url: null,
  category: null,
  featured: false,
  order_index: 0,
  published: false,
  status: 'completed',
  tech_stack: [],
}

type FormState = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'description_cs' | 'description_en' | 'demo_url' | 'github_url' | 'category' | 'gallery'> & {
  description_cs: string
  description_en: string
  demo_url: string
  github_url: string
  category: string
  gallery: string[]
}

export function ProjectForm({ project, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!project
  const [form, setForm] = useState<FormState>(
    project
      ? {
          name: project.name,
          description_cs: project.description_cs ?? '',
          description_en: project.description_en ?? '',
          tags: project.tags,
          tech_stack: project.tech_stack,
          image_url: project.image_url ?? null,
          gallery: project.gallery ?? [],
          demo_url: project.demo_url ?? '',
          github_url: project.github_url ?? '',
          category: project.category ?? '',
          featured: project.featured,
          order_index: project.order_index,
          published: project.published,
          status: project.status,
        }
      : { ...EMPTY, demo_url: '', github_url: '', category: '', description_cs: '', description_en: '' }
  )

  const [tagInput, setTagInput] = useState('')
  const [techInput, setTechInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // GitHub repo picker
  const [showRepoPicker, setShowRepoPicker] = useState(false)
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [repoSearch, setRepoSearch] = useState('')

  const fetchRepos = useCallback(async () => {
  setReposLoading(true)
  setError(null)
  try {
    const data = await getGithubRepos()
    setRepos(data)
    
    if (data.length === 0) {
      setError('GitHub vrátil prázdný seznam repozitářů (0 nalezených).')
    }
  } catch (err) { 
    // Tady vytáhneme přesnou zprávu, kterou posílá server
    setError(err instanceof Error ? err.message : 'Nepodařilo se načíst repozitáře.')
    setRepos([]) 
  } finally { 
    setReposLoading(false) 
  }
}, [])

  const openRepoPicker = () => {
    setShowRepoPicker(true)
    setRepoSearch('')
    if (repos.length === 0) fetchRepos()
  }

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const addTag = () => {
    const v = tagInput.trim().toLowerCase()
    if (v && !form.tags.includes(v)) set('tags', [...form.tags, v])
    setTagInput('')
  }

  const addTech = () => {
    const v = techInput.trim()
    if (v && !form.tech_stack.includes(v)) set('tech_stack', [...form.tech_stack, v])
    setTechInput('')
  }

  const uploadFiles = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of imageFiles) {
        const fd = new FormData()
        fd.append('file', file)
        const url = await uploadProjectImage(fd)
        urls.push(url)
      }
      setForm(f => {
        const hasCover = !!f.image_url
        return {
          ...f,
          image_url: hasCover ? f.image_url : urls[0],
          gallery: [...f.gallery, ...(hasCover ? urls : urls.slice(1))],
        }
      })
    } catch {
      setError('Nahrání obrázku selhalo')
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    await uploadFiles(files)
    if (fileRef.current) fileRef.current.value = ''
  }

  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    await uploadFiles(files)
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData?.items ?? [])
    const files = items
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((f): f is File => f !== null)
    if (files.length > 0) {
      e.preventDefault()
      await uploadFiles(files)
    }
  }

  const removeImage = (url: string) => {
    setForm(f => {
      if (f.image_url === url) {
        const [next, ...rest] = f.gallery
        return { ...f, image_url: next ?? null, gallery: rest }
      }
      return { ...f, gallery: f.gallery.filter(g => g !== url) }
    })
  }

  const setCover = (url: string) => {
    setForm(f => {
      if (f.image_url === url) return f
      const gallery = [...(f.image_url ? [f.image_url] : []), ...f.gallery.filter(g => g !== url)]
      return { ...f, image_url: url, gallery }
    })
  }

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Název je povinný'); return }
    setError(null)

    const payload = {
      ...form,
      description_cs: form.description_cs || null,
      description_en: form.description_en || null,
      demo_url: form.demo_url || null,
      github_url: form.github_url || null,
      category: form.category || null,
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateProject(project.id, payload)
        } else {
          await createProject(payload)
        }
        router.refresh()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Chyba')
      }
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f0f16] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
            <h2 className="text-[15px] font-semibold text-white/85">
              {isEdit ? 'Upravit projekt' : 'Nový projekt'}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Obrázky */}
            <div>
              <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">
                Obrázky
              </label>

              <div
                onDragOver={e => { e.preventDefault(); setIsDraggingOver(true) }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
                onPaste={handlePaste}
                tabIndex={0}
                className={`rounded-xl transition-colors outline-none ${
                  isDraggingOver ? 'bg-orange-500/[0.06] ring-2 ring-orange-500/40 ring-offset-0' : ''
                }`}
              >
                <div className="flex flex-wrap gap-3 p-1">
                  {/* Cover */}
                  {form.image_url && (
                    <ImageTile
                      url={form.image_url}
                      isCover
                      onRemove={() => removeImage(form.image_url!)}
                      onView={() => setLightboxUrl(form.image_url!)}
                    />
                  )}
                  {/* Gallery */}
                  {form.gallery.map(url => (
                    <ImageTile
                      key={url}
                      url={url}
                      onRemove={() => removeImage(url)}
                      onSetCover={() => setCover(url)}
                      onView={() => setLightboxUrl(url)}
                    />
                  ))}

                  {/* Add tile */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className={`w-20 h-20 rounded-xl border border-dashed flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.97] disabled:opacity-50 shrink-0 ${
                      isDraggingOver
                        ? 'border-orange-500/60 text-orange-400 bg-orange-500/[0.08]'
                        : 'border-white/[0.12] bg-white/[0.02] text-white/30 hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/[0.05]'
                    }`}
                  >
                    {uploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Upload size={15} />
                        <span className="text-[10px] font-medium">Přidat</span>
                      </>
                    )}
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                <p className="text-[11px] text-white/25 mt-2 px-1">
                  Přetáhni obrázky sem nebo vlož ze schránky (Ctrl+V)
                </p>
              </div>
            </div>

            {/* Název */}
            <Field label="Název *">
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Název projektu"
                className={inputCls}
              />
            </Field>

            {/* Popis CS + EN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Popis (CS)">
                <textarea
                  rows={5}
                  value={form.description_cs}
                  onChange={e => set('description_cs', e.target.value)}
                  placeholder="Popis česky…"
                  className={textareaCls}
                />
              </Field>
              <Field label="Popis (EN)">
                <textarea
                  rows={5}
                  value={form.description_en}
                  onChange={e => set('description_en', e.target.value)}
                  placeholder="Description in English…"
                  className={textareaCls}
                />
              </Field>
            </div>

            {/* URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Demo URL">
                <input
                  type="url"
                  value={form.demo_url}
                  onChange={e => set('demo_url', e.target.value)}
                  placeholder="https://…"
                  className={inputCls}
                />
              </Field>
              <Field label="GitHub URL">
                <div className="relative">
                  <input
                    type="url"
                    value={form.github_url}
                    onChange={e => set('github_url', e.target.value)}
                    placeholder="https://github.com/…"
                    className={`${inputCls} pr-24`}
                  />
                  <button
                    type="button"
                    onClick={openRepoPicker}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-white/45 text-[11px] font-medium hover:bg-white/[0.1] hover:text-white/75 hover:border-white/[0.15] transition-all"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    Vybrat
                  </button>
                </div>
              </Field>
            </div>

            {/* Repo picker – inline sekce (ne absolutní dropdown) */}
            {showRepoPicker && (
              <div className="rounded-xl border border-white/[0.08] bg-[#12121a] overflow-hidden flex flex-col" style={{maxHeight: '260px'}}>
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] shrink-0">
                  <Search size={13} className="text-white/30 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={repoSearch}
                    onChange={e => setRepoSearch(e.target.value)}
                    placeholder="Hledat repozitář…"
                    className="flex-1 bg-transparent text-[13px] text-white/75 placeholder:text-white/25 outline-none"
                  />
                  <button
                    type="button"
                    onClick={fetchRepos}
                    disabled={reposLoading}
                    className="text-white/25 hover:text-white/55 transition-colors"
                    title="Obnovit"
                  >
                    <RefreshCw size={12} className={reposLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRepoPicker(false)}
                    className="text-white/25 hover:text-white/55 transition-colors ml-0.5"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {reposLoading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-white/30 text-[13px]">
                      <Loader2 size={14} className="animate-spin" />
                      Načítám repozitáře…
                    </div>
                  ) : repos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase())).length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-white/25 text-[13px]">
                      Žádné repozitáře
                    </div>
                  ) : repos
                      .filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase()))
                      .map(repo => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => {
                          set('github_url', repo.html_url)
                          if (!form.name) set('name', repo.name)
                          if (!form.description_cs && repo.description) set('description_cs', repo.description)
                          setShowRepoPicker(false)
                        }}
                        className={`w-full flex items-start gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.04] group ${
                          form.github_url === repo.html_url ? 'bg-orange-500/[0.06]' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className="mt-0.5 shrink-0 text-white/25 group-hover:text-white/45 transition-colors">
                          {repo.private ? <Lock size={13} /> : <BookOpen size={13} />}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[13px] font-medium truncate ${form.github_url === repo.html_url ? 'text-orange-400' : 'text-white/75'}`}>
                              {repo.name}
                            </span>
                            {repo.private && (
                              <span className="text-[10px] font-semibold text-white/30 border border-white/[0.1] rounded-full px-1.5 py-0 shrink-0">private</span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-white/30 truncate mt-0.5">{repo.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {repo.language && (
                              <span className="text-[10px] text-white/25">{repo.language}</span>
                            )}
                            <span className="text-[10px] text-white/20">
                              {new Date(repo.updated_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        {/* Selected check */}
                        {form.github_url === repo.html_url && (
                          <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                      </button>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Category + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Kategorie">
                <input
                  type="text"
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  placeholder="web, mobile, oss…"
                  className={inputCls}
                />
              </Field>
              <Field label="Stav">
                <Select
                  value={form.status}
                  onChange={v => set('status', v)}
                  options={[
                    { value: 'completed', label: 'Dokončeno' },
                    { value: 'in_progress', label: 'Probíhá' },
                    { value: 'archived', label: 'Archivováno' },
                  ]}
                />
              </Field>
            </div>

            {/* Tech stack */}
            <Field label="Tech stack">
              {/* Vybrané */}
              {form.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {form.tech_stack.map(t => {
                    const preset = TECH_PRESETS.find(p => p.label === t)
                    return (
                      <span
                        key={t}
                        className="flex items-center gap-1.5 text-[12px] font-medium text-white/80 bg-white/[0.06] border border-white/[0.1] rounded-lg pl-1.5 pr-2 py-1"
                      >
                        {preset ? (
                          <TechIcon slug={preset.slug} color={preset.color} />
                        ) : (
                          <span className="w-4 h-4 rounded bg-white/10" />
                        )}
                        {t}
                        <button
                          type="button"
                          onClick={() => set('tech_stack', form.tech_stack.filter(x => x !== t))}
                          className="text-white/30 hover:text-rose-400 transition-colors ml-0.5"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Dostupné presety (jen ty, co ještě nejsou vybrané) */}
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
                Klikni pro rychlé přidání
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TECH_PRESETS.filter(p => !form.tech_stack.includes(p.label)).map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => set('tech_stack', [...form.tech_stack, preset.label])}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-white/45 bg-white/[0.02] border border-white/[0.06] rounded-lg pl-1.5 pr-2.5 py-1 hover:border-white/[0.15] hover:text-white/75 hover:bg-white/[0.05] transition-all"
                  >
                    <TechIcon slug={preset.slug} color={preset.color} />
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={e => setTechInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
                  placeholder="Jiná technologie…"
                  className={`${inputCls} flex-1`}
                />
                <button type="button" onClick={addTech} className={addBtnCls}>
                  <Plus size={14} />
                </button>
              </div>
            </Field>

            {/* Tags */}
            <Field label="Tagy">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[11px] text-orange-400/70 bg-orange-500/[0.06] border border-orange-500/[0.12] rounded-md px-2 py-0.5">
                    #{tag}
                    <button type="button" onClick={() => set('tags', form.tags.filter(x => x !== tag))} className="text-white/25 hover:text-rose-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="web, opensource…"
                  className={`${inputCls} flex-1`}
                />
                <button type="button" onClick={addTag} className={addBtnCls}>
                  <Plus size={14} />
                </button>
              </div>
            </Field>

            {/* Toggles */}
            <div className="flex items-center gap-7">
              <Toggle
                checked={form.published}
                onChange={v => set('published', v)}
                label="Publikováno"
              />
              <Toggle
                checked={form.featured}
                onChange={v => set('featured', v)}
                label="Featured"
              />
            </div>

            {error && (
              <p className="text-[12px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-[13px] font-medium text-white/45 hover:text-white/80 hover:bg-white/[0.05] active:bg-white/[0.08] transition-all"
            >
              Zrušit
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="h-9 px-5 rounded-xl text-[13px] font-semibold bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-400 hover:to-orange-600 active:scale-[0.98] text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_4px_12px_-2px_rgba(249,115,22,0.4)] transition-all disabled:opacity-60 disabled:active:scale-100 flex items-center gap-2"
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              {isEdit ? 'Uložit změny' : 'Vytvořit projekt'}
            </button>
          </div>
        </div>
      </div>

      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  )
}

function ImageTile({
  url,
  isCover,
  onRemove,
  onSetCover,
  onView,
}: {
  url: string
  isCover?: boolean
  onRemove: () => void
  onSetCover?: () => void
  onView: () => void
}) {
  return (
    <div className="group relative w-20 h-20 rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden shrink-0">
      <button type="button" onClick={onView} className="absolute inset-0 cursor-zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="w-full h-full object-cover" />
      </button>

      {isCover && (
        <span className="absolute top-1 left-1 flex items-center gap-0.5 text-[9px] font-semibold text-amber-300 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 pointer-events-none">
          <Star size={8} className="fill-amber-300" />
          Hlavní
        </span>
      )}

      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 pointer-events-none group-hover:pointer-events-auto">
        <button
          type="button"
          onClick={onView}
          title="Zobrazit"
          className="flex items-center justify-center w-6 h-6 rounded-md bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        >
          <Maximize2 size={11} />
        </button>
        {!isCover && onSetCover && (
          <button
            type="button"
            onClick={onSetCover}
            title="Nastavit jako hlavní"
            className="flex items-center justify-center w-6 h-6 rounded-md bg-white/10 text-white/70 hover:bg-amber-500/80 hover:text-white transition-colors"
          >
            <Star size={11} />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          title="Odstranit"
          className="flex items-center justify-center w-6 h-6 rounded-md bg-white/10 text-white/70 hover:bg-rose-500/80 hover:text-white transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.06] text-white/60 hover:bg-white/[0.12] hover:text-white transition-all"
      >
        <X size={18} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        onClick={e => e.stopPropagation()}
        className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
      />
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 cursor-pointer select-none"
    >
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-orange-500' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </span>
      <span className={`text-[13px] font-medium transition-colors ${checked ? 'text-white/85' : 'text-white/45'}`}>
        {label}
      </span>
    </button>
  )
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${inputCls} flex items-center justify-between text-left`}
      >
        <span>{current?.label}</span>
        <ChevronDown size={14} className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-10 mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#15151f] shadow-xl shadow-black/40 overflow-hidden py-1">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                opt.value === value
                  ? 'text-orange-400 bg-orange-500/[0.08]'
                  : 'text-white/65 hover:bg-white/[0.05] hover:text-white/85'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TechIcon({ slug, color }: { slug: string; color: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <span className="w-4 h-4 rounded bg-white/10 shrink-0" />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${slug}/${color}`}
      alt=""
      className="w-3.5 h-3.5 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full h-9 px-3 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-white/75 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 transition-colors'

const textareaCls =
  'w-full px-3 py-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] leading-relaxed text-white/75 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.04] transition-colors resize-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-white/20'

const addBtnCls =
  'flex items-center justify-center w-9 h-9 rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/40 hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/[0.08] active:scale-95 transition-all shrink-0'