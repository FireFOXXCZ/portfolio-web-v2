export type Status = 'available' | 'busy' | 'unavailable'

export type Profile = {
  id: string
  name: string
  title_cs: string | null
  title_en: string | null
  bio_cs: string | null
  bio_en: string | null
  status: Status
  avatar_url: string | null
  cv_url: string | null
  github: string | null
  spotify: string | null
  discord: string | null
  email: string | null
  updated_at: string
  github_token: string | null
  discord_url: string | null
  discord_server_name: string | null
}

export type Project = {
  id: string
  name: string
  description_cs: string | null
  description_en: string | null
  tags: string[]
  image_url: string | null
  gallery: string[]
  demo_url: string | null
  github_url: string | null
  category: string | null
  featured: boolean
  order_index: number
  published: boolean
  created_at: string
  updated_at: string        
  tech_stack: string[]     
  status: 'in_progress' | 'completed' | 'archived'  
}

export type Skill = {
  id: string
  name: string
  category: string | null
  icon: string | null
  icon_color: string | null
  level: number
  order_index: number
  is_visible: boolean
  description_cs: string | null
  description_en: string | null
  years_experience: number | null
  created_at: string
  updated_at: string
}

export type Experience = {
  id: string
  role_cs: string | null
  role_en: string | null
  company: string
  description_cs: string | null
  description_en: string | null
  date_from: string
  date_to: string | null
  current: boolean
  order_index: number
}

export type Post = {
  id: string
  slug: string
  title_cs: string | null
  title_en: string | null
  content_cs: string | null
  content_en: string | null
  excerpt_cs: string | null
  excerpt_en: string | null
  cover_url: string | null
  tags: string[]
  published: boolean
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  locale: 'cs' | 'en'
  status: 'new' | 'read' | 'archived'   
  ip_address: string | null
  honeypot_triggered: boolean
  created_at: string
}
 
export type Review = {
  id: string
  name: string
  email: string | null
  rating: number
  comment: string
  published: boolean
  read: boolean
  created_at: string
}
  
export type GithubRepo = {
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