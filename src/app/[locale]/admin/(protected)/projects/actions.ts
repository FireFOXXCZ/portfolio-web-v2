'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Project, GithubRepo } from '@/lib/supabase/type'

type ProjectInput = Omit<Project, 'id' | 'created_at' | 'updated_at'>

export async function createProject(input: ProjectInput) {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').insert(input)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/projects')
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/projects')
}

export async function deleteProject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/projects')
}

export async function togglePublished(id: string, published: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ published, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/projects')
}

export async function reorderProjects(items: { id: string; order_index: number }[]) {
  const supabase = await createClient()
  await Promise.all(
    items.map(({ id, order_index }) =>
      supabase.from('projects').update({ order_index }).eq('id', id)
    )
  )
  revalidatePath('/admin/projects')
}

export async function uploadProjectImage(formData: FormData): Promise<string> {
  const supabase = await createClient()
  const file = formData.get('file') as File
  if (!file) throw new Error('Žádný soubor')

  const ext = file.name.split('.').pop()
  const path = `projects/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}

export async function bulkSetPublished(ids: string[], published: boolean) {
  if (ids.length === 0) return
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ published, updated_at: new Date().toISOString() })
    .in('id', ids)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/projects')
}

export async function bulkDeleteProjects(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .delete()
    .in('id', ids)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/projects')
}

// @/app/[locale]/admin/(protected)/projects/actions.ts

export async function getGithubRepos(): Promise<GithubRepo[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('DEBUG: Server nenašel přihlášeného uživatele v Supabase Auth.')
  }

  const { data: profile, error: dbError } = await supabase
    .from('profile')
    .select('github_token')
    .eq('id', user.id)
    .single()

  if (dbError) {
    throw new Error(`DEBUG: Chyba při čtení z DB tabulky 'profile': ${dbError.message}`)
  }

  const token = profile?.github_token
  if (!token) {
    throw new Error('DEBUG: V databázi v tabulce \'profile\' máš u svého ID sloupec \'github_token\' prázdný (null).')
  }

  try {
   const res = await fetch(
  'https://api.github.com/user/repos?per_page=100&sort=updated&visibility=all',
  { 
    headers: { 
      Authorization: `Bearer ${token}`, 
      Accept: 'application/vnd.github+json' 
    },
    cache: 'no-store'
  }
)
    
    if (!res.ok) {
      throw new Error(`DEBUG: GitHub API vrátilo chybu: ${res.status} (Asi expirovaný nebo špatný token).`)
    }
    
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'DEBUG: Fetch na GitHub kompletně selhal.')
  }
}