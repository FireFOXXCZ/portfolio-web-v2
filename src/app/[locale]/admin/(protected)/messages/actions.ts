// File: app/admin/dashboard/messages/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleMessageRead(id: string, markAsRead: boolean) {
  const supabase = await createClient()
  await supabase.from('messages').update({ status: markAsRead ? 'read' : 'new' }).eq('id', id)
  revalidatePath('/admin/dashboard/messages')
  revalidatePath('/admin/dashboard')
}

export async function deleteMessage(id: string) {
  const supabase = await createClient()
  await supabase.from('messages').delete().eq('id', id)
  revalidatePath('/admin/dashboard/messages')
  revalidatePath('/admin/dashboard')
}

export async function toggleMessageArchived(id: string, archive: boolean) {
  const supabase = await createClient()
  await supabase.from('messages').update({ status: archive ? 'archived' : 'new' }).eq('id', id)
  revalidatePath('/admin/messages')
  revalidatePath('/admin/dashboard')
}