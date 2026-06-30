// app/[locale]/admin/(protected)/skills/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Skill } from '@/lib/supabase/type'

type SkillInput = Omit<Skill, 'id' | 'created_at' | 'updated_at'>

export async function createSkill(input: SkillInput) {
  const supabase = await createClient()
  const { error } = await supabase.from('skills').insert(input)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/skills')
}

export async function updateSkill(id: string, input: Partial<SkillInput>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('skills')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/skills')
}

export async function deleteSkill(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('skills').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/skills')
}

export async function toggleSkillVisible(id: string, is_visible: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('skills')
    .update({ is_visible, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/skills')
}

export async function reorderSkills(items: { id: string; order_index: number }[]) {
  const supabase = await createClient()
  await Promise.all(
    items.map(({ id, order_index }) =>
      supabase.from('skills').update({ order_index }).eq('id', id)
    )
  )
  revalidatePath('/admin/skills')
}