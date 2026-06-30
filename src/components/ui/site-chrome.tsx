'use client'

import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'

// Pole, která Navbar a Footer skutečně potřebují
type SiteChromeProfile = {
  github?: string | null
  discord?: string | null
  discord_url?: string | null
  discord_display_name?: string | null
  discord_server_name?: string | null
  email?: string | null
  cv_url?: string | null
}

interface SiteChromeProps {
  children: React.ReactNode
  profile?: SiteChromeProfile | null
  projectCount?: number
}

export function SiteChrome({ children, profile, projectCount = 0 }: SiteChromeProps) {
  return (
    <>
      <Navbar profile={profile} />
      <div className="pt-16">{children}</div>
      <Footer profile={profile} projectCount={projectCount} />
    </>
  )
}