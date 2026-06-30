import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()

  if (!user) {
    redirect(locale === 'cs' ? '/admin' : '/en/admin')
  }

  const [
    { data: profile },
    { count: unreadCount },
  ] = await Promise.all([
    supabase.from('profile').select('name, avatar_url').single(),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('read', false),
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070709] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          user={user}
          profile={profile}
          unreadCount={unreadCount ?? 0}
        />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}