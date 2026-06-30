import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/type'
import { ProfileForm } from '@/components/admin/profile-form'
import { User } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profile')
    .select('*')
    .single<Profile>()

  return (
    /* UPRAVENO: Změněno z max-w-2xl na max-w-5xl pro luxusní široký layout */
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User size={18} className="text-orange-400" />
          Upravit profil
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
          Informace zobrazené na portfoliu
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}