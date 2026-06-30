'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu, X, LogOut, LayoutDashboard, FolderOpen, Zap, Briefcase, FileText, User, Inbox, ExternalLink, Bell, Star, Mail, CheckCheck, Check } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Message, Review } from '@/lib/supabase/type' 

const navItems = [
  { href: '/admin/dashboard', label: 'Přehled', icon: LayoutDashboard, exact: true },
  { href: '/admin/messages', label: 'Zprávy', icon: Inbox },
  { href: '/admin/dashboard/profile', label: 'Profil', icon: User },
  { href: '/admin/dashboard/projects', label: 'Projekty', icon: FolderOpen },
  { href: '/admin/dashboard/skills', label: 'Dovednosti', icon: Zap },
  { href: '/admin/dashboard/experience', label: 'Zkušenosti', icon: Briefcase },
  { href: '/admin/dashboard/posts', label: 'Blog', icon: FileText },
]

type Profile = { name?: string | null; avatar_url?: string | null }

type Weather = {
  temp: number
  description: string
  icon: string
  city: string
  windspeed: number
  humidity: number
  precipitation: number
  feelsLike: number
}

type DayForecast = {
  date: string
  label: string
  icon: string
  description: string
  tempMax: number
  tempMin: number
  precipitation: number
  windspeed: number
}

type HourForecast = {
  time: string
  date: string
  displayDate: string  // půlnoc příštího dne se zobrazí jako konec tohoto dne
  timeLabel: string
  temp: number
  feelsLike: number
  icon: string
  precipitation: number
  windspeed: number
  windGusts: number
}

// ---------------------------------------------------------------------------
// Živý čas – kompaktní jednořádkový formát
// ---------------------------------------------------------------------------
function LiveClock() {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    const days = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so']
    const tick = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      const d = days[now.getDay()]
      const day = now.getDate()
      const mo = now.getMonth() + 1
      setDisplay(`${d} ${day}. ${mo}. · ${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="hidden md:flex items-center pr-3 mr-1 border-r border-white/[0.05]">
      <span className="text-[12px] font-medium text-white/55 tabular-nums tracking-[0.01em]">
        {display}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Počasí dle IP – s fallbackem pro localhost
// Na localhostu IP geolokace nefunguje (127.0.0.1) – nastav DEV_FALLBACK dle sebe
// ---------------------------------------------------------------------------
const DEV_FALLBACK = { lat: 49.298, lon: 16.529, city: 'Kuřim', country: 'CZ' }

// Přesná poloha z prohlížeče (GPS/Wi-Fi) — uživatel musí povolit
function getBrowserLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null), // uživatel zamítl / chyba / timeout
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    )
  })
}

// Z lat/lon zjistí název města (reverse geocoding) — bez API klíče
async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; country: string } | null> {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=cs`)
    if (!res.ok) return null
    const d = await res.json()
    const city = d.city || d.locality || d.principalSubdivision || ''
    const country = d.countryCode || ''
    if (!city) return null
    return { city, country }
  } catch {
    return null
  }
}

async function getGeoByIP(): Promise<{ lat: number; lon: number; city: string; country: string }> {
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (res.ok) {
      const d = await res.json()
      if (!d.error && d.latitude && d.longitude) {
        return { lat: d.latitude, lon: d.longitude, city: d.city ?? '', country: d.country_code ?? '' }
      }
    }
  } catch { /* ignoruj */ }

  try {
    const res = await fetch('https://freeipapi.com/api/json')
    if (res.ok) {
      const d = await res.json()
      if (d.latitude && d.longitude) {
        return { lat: d.latitude, lon: d.longitude, city: d.cityName ?? '', country: d.countryCode ?? '' }
      }
    }
  } catch { /* ignoruj */ }

  // Fallback pro localhost / dev
  return DEV_FALLBACK
}

function WeatherBadge() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [forecast, setForecast] = useState<DayForecast[]>([])
  const [hourly, setHourly] = useState<HourForecast[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const geoCache = useRef<{ lat: number; lon: number; city: string; country: string } | null>(null)

  const load = useCallback(async () => {
    try {
      if (!geoCache.current) {
        // 1) Zkusíme přesnou polohu z prohlížeče (GPS/Wi-Fi)
        const browserPos = await getBrowserLocation()
        if (browserPos) {
          const place = await reverseGeocode(browserPos.lat, browserPos.lon)
          geoCache.current = {
            lat: browserPos.lat,
            lon: browserPos.lon,
            city: place?.city ?? '',
            country: place?.country ?? '',
          }
        }
        // 2) Fallback na IP geolokaci, pokud prohlížeč nepovolil / selhal
        if (!geoCache.current) {
          geoCache.current = await getGeoByIP()
        }
      }
      const geo = geoCache.current

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
        `&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m,precipitation,apparent_temperature` +
        `&hourly=temperature_2m,weathercode,precipitation,windspeed_10m,wind_gusts_10m,apparent_temperature` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max` +
        `&timezone=auto&forecast_days=7`
      const meteoRes = await fetch(url, { cache: 'no-store' })
      if (!meteoRes.ok) return
      const meteo = await meteoRes.json()

      const temp = Math.round(meteo.current.temperature_2m)
      const feelsLike = Math.round(meteo.current.apparent_temperature)
      const code = meteo.current.weathercode as number
      const { icon, description } = wmoToEmoji(code)
      const windspeed = Math.round(meteo.current.windspeed_10m)
      const humidity = Math.round(meteo.current.relative_humidity_2m)
      const precipitation = Math.round(meteo.current.precipitation * 10) / 10

      setWeather({ temp, description, icon, city: `${geo.city}, ${geo.country}`, windspeed, humidity, precipitation, feelsLike })

      // Týdenní předpověď
      const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
      const dailyForecast: DayForecast[] = meteo.daily.time.map((dateStr: string, i: number) => {
        const d = new Date(dateStr)
        const { icon: di, description: dd } = wmoToEmoji(meteo.daily.weathercode[i])
        return {
          date: dateStr,
          label: i === 0 ? 'Dnes' : dayNames[d.getDay()],
          icon: di,
          description: dd,
          tempMax: Math.round(meteo.daily.temperature_2m_max[i]),
          tempMin: Math.round(meteo.daily.temperature_2m_min[i]),
          precipitation: Math.round(meteo.daily.precipitation_sum[i] * 10) / 10,
          windspeed: Math.round(meteo.daily.windspeed_10m_max[i]),
        }
      })
      setForecast(dailyForecast)

      // Hodinová předpověď — každé 3 hodiny, půlnoc (00:00) příštího dne patří k předchozímu dni
      const rawHourly: (HourForecast & { displayDate: string })[] = meteo.hourly.time
        .map((t: string, i: number) => {
          const hourNum = parseInt(t.slice(11, 13))
          if (hourNum % 3 !== 0) return null
          const date = t.slice(0, 10)
          const { icon: hi } = wmoToEmoji(meteo.hourly.weathercode[i])
          // Půlnoc (00:00) zobrazíme jako konec předchozího dne
          let displayDate = date
          if (hourNum === 0 && i > 0) {
            // datum předchozího záznamu
            const prevDate = meteo.hourly.time[i - 1].slice(0, 10)
            displayDate = prevDate
          }
          return {
            time: t,
            date,
            displayDate,
            timeLabel: t.slice(11, 16),
            temp: Math.round(meteo.hourly.temperature_2m[i]),
            feelsLike: Math.round(meteo.hourly.apparent_temperature[i]),
            icon: hi,
            precipitation: Math.round(meteo.hourly.precipitation[i] * 10) / 10,
            windspeed: Math.round(meteo.hourly.windspeed_10m[i]),
            windGusts: Math.round(meteo.hourly.wind_gusts_10m[i]),
          }
        })
        .filter(Boolean) as (HourForecast & { displayDate: string })[]
      setHourly(rawHourly)
      setLastUpdated(new Date())
    } catch { /* tiché selhání */ }
  }, [])

  // Načíst při prvním renderu
  useEffect(() => { load() }, [load])

  // Načíst při otevření — vždy, pokud data nejsou, nebo starší než 2 min
  const handleOpen = useCallback(() => {
    setOpen(v => {
      if (!v) {
        load()
      }
      return !v
    })
  }, [load])

  // Zavřít při kliknutí mimo
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!weather) return null

  return (
    <div className="relative hidden sm:block" ref={ref}>
      {/* Badge – trigger */}
      <button
        onClick={() => handleOpen()}
        className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg border transition-all select-none ${
          open
            ? 'border-orange-500/40 bg-orange-500/[0.06] text-orange-400'
            : 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12]'
        }`}
      >
        <span className="text-base leading-none">{weather.icon}</span>
        <div className="flex flex-col leading-none gap-[2px]">
          <span className="tabular-nums text-white/70 font-medium text-[12px]">{weather.temp}°C</span>
          <span className="text-[9px] text-white/30">{weather.city}</span>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[440px] rounded-xl border border-white/[0.08] bg-[#0f0f16] shadow-2xl overflow-hidden">
          {/* Aktuální počasí – hlavička */}
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-white/35 mb-0.5">{weather.city}</p>
                <div className="flex items-end gap-2">
                  <span className="text-[36px] leading-none font-semibold text-white/90 tabular-nums">{weather.temp}°</span>
                  <span className="text-[22px] leading-none pb-0.5">{weather.icon}</span>
                </div>
                <p className="text-[12px] text-white/50 mt-1">{weather.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 pt-1">
                <span className="text-[11px] text-white/30">Pocitová teplota</span>
                <span className="text-[13px] font-semibold text-white/60 tabular-nums">{weather.feelsLike}°C</span>
              </div>
            </div>

            {/* Detaily – mřížka */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'Vítr', value: `${weather.windspeed} km/h`, icon: '💨' },
                { label: 'Srážky', value: `${weather.precipitation} mm`, icon: '🌧️' },
                { label: 'Vlhkost', value: `${weather.humidity}%`, icon: '💧' },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                  <span className="text-[14px]">{item.icon}</span>
                  <span className="text-[12px] font-semibold text-white/65 tabular-nums">{item.value}</span>
                  <span className="text-[9px] text-white/25">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7denní předpověď */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest pb-2">7denní předpověď</p>
            <div className="space-y-0.5">
              {forecast.map((day, i) => {
                const d = new Date(day.date)
                const dayNum = d.getDate()
                const monthNum = d.getMonth() + 1
                const isSelected = selectedDay === day.date

                // Hodinová data pro tento den:
                // - všechny sloty kde date === day.date (03:00–21:00)
                // - plus půlnoc (00:00) příštího dne jako poslední slot
                // - plus půlnoc (00:00) tohoto dne jako první slot (z předchozího dne)
                const hoursForDay = hourly
                  .filter(h =>
                    h.date === day.date ||                          // běžné hodiny tohoto dne
                    (h.displayDate === day.date && h.date !== day.date) // půlnoc příštího dne (konec dne)
                  )
                  .sort((a, b) => a.time.localeCompare(b.time))
                const nowHour = new Date().getHours()
                const currentSlot = Math.floor(nowHour / 3) * 3 // 0,3,6...21
                const relevantHours = hoursForDay

                return (
                  <div key={day.date}>
                    <button
                      onClick={() => setSelectedDay(isSelected ? null : day.date)}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-orange-500/10 border border-orange-500/20'
                          : i === 0
                          ? 'bg-white/[0.04] hover:bg-white/[0.06]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Den + datum */}
                      <div className="flex flex-col leading-none w-[52px] shrink-0">
                        <span className={`text-[12px] font-semibold ${i === 0 ? 'text-orange-400' : 'text-white/55'}`}>
                          {day.label}
                        </span>
                        <span className="text-[10px] text-white/25 mt-0.5 tabular-nums">{dayNum}. {monthNum}.</span>
                      </div>
                      {/* Ikona */}
                      <span className="text-[16px] w-6 text-center shrink-0">{day.icon}</span>
                      {/* Popis */}
                      <span className="flex-1 text-[11px] text-white/35 min-w-0">{day.description}</span>
                      {/* Srážky */}
                      <div className="w-[58px] text-right shrink-0">
                        {day.precipitation > 0 ? (
                          <span className="text-[11px] text-blue-400/70 tabular-nums whitespace-nowrap">💧 {day.precipitation} mm</span>
                        ) : (
                          <span className="text-[11px] text-white/15 tabular-nums">—</span>
                        )}
                      </div>
                      {/* Vítr */}
                      <div className="w-[62px] text-right shrink-0">
                        <span className="text-[11px] text-white/30 tabular-nums">💨 {day.windspeed} km/h</span>
                      </div>
                      {/* Teploty max / min */}
                      <div className="flex items-center gap-1.5 w-[52px] justify-end shrink-0">
                        <span className="text-[13px] font-semibold text-white/80 tabular-nums">{day.tempMax}°</span>
                        <span className="text-[11px] text-white/30 tabular-nums">{day.tempMin}°</span>
                      </div>
                    </button>

                    {/* Hodinový panel */}
                    {isSelected && (() => {
                      const scrollRef = { current: null as HTMLDivElement | null }
                      const scroll = (dir: number) => {
                        if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 180, behavior: 'smooth' })
                      }
                      return (
                        <div className="mt-1 mb-1 mx-1 rounded-lg bg-[#0a0a10] border border-white/[0.07] overflow-hidden">
                          {relevantHours.length === 0 ? (
                            <p className="text-[11px] text-white/25 text-center py-3">Žádná data</p>
                          ) : (
                            <div className="relative">
                              {/* Scroll šipky */}
                              <button
                                onClick={() => scroll(-1)}
                                className="absolute left-0 top-0 bottom-0 z-10 w-7 flex items-center justify-center bg-gradient-to-r from-[#0a0a10] to-transparent text-white/30 hover:text-white/70 transition-colors"
                              >‹</button>
                              <button
                                onClick={() => scroll(1)}
                                className="absolute right-0 top-0 bottom-0 z-10 w-7 flex items-center justify-center bg-gradient-to-l from-[#0a0a10] to-transparent text-white/30 hover:text-white/70 transition-colors"
                              >›</button>
                              <div
                                className="overflow-x-auto scrollbar-none px-7"
                                style={{ scrollbarWidth: 'none' }}
                                ref={el => {
                                  scrollRef.current = el
                                  if (!el || i !== 0) return
                                  const currentIdx = relevantHours.findIndex(h => parseInt(h.timeLabel.slice(0, 2)) === currentSlot)
                                  if (currentIdx > 0) {
                                    setTimeout(() => { el.scrollLeft = Math.max(0, (currentIdx - 1) * 64) }, 0)
                                  }
                                }}
                              >
                                <div className="flex min-w-max">
                                  {relevantHours.map(h => {
                                    const hHour = parseInt(h.timeLabel.slice(0, 2))
                                    const isCurrent = i === 0 && hHour === currentSlot
                                    const isPast = i === 0 && hHour < currentSlot
                                    return (
                                      <div
                                        key={h.time}
                                        className={`flex flex-col items-center gap-[3px] px-3 py-3 border-r border-white/[0.05] last:border-0 min-w-[64px] ${
                                          isCurrent ? 'bg-orange-500/[0.12]' : ''
                                        }`}
                                      >
                                        <span className={`text-[10px] tabular-nums font-medium ${isCurrent ? 'text-orange-400' : isPast ? 'text-white/20' : 'text-white/40'}`}>
                                          {h.timeLabel}
                                        </span>
                                        <span className={`text-[15px] ${isPast && !isCurrent ? 'grayscale opacity-50' : ''}`}>{h.icon}</span>
                                        <span className={`text-[12px] font-semibold tabular-nums ${isPast && !isCurrent ? 'text-white/30' : 'text-white/80'}`}>{h.temp}°</span>
                                        <span className={`text-[9px] tabular-nums ${isPast && !isCurrent ? 'text-white/15' : 'text-white/30'}`}>pocit {h.feelsLike}°</span>
                                        {h.precipitation > 0 ? (
                                          <span className="text-[9px] text-blue-400/70 tabular-nums">💧{h.precipitation}mm</span>
                                        ) : (
                                          <span className="text-[9px] text-white/10">—</span>
                                        )}
                                        <span className={`text-[9px] tabular-nums ${isPast && !isCurrent ? 'text-white/15' : 'text-white/25'}`}>
                                          💨{h.windspeed}km/h
                                        </span>
                                        {h.windGusts > h.windspeed + 5 && (
                                          <span className="text-[9px] text-orange-400/60 tabular-nums">↑{h.windGusts}km/h</span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-white/[0.04]">
            <p className="text-[10px] text-white/20 text-center">
              Zdroj: Open-Meteo
              {lastUpdated && (
                <> · Aktualizováno {lastUpdated.getHours().toString().padStart(2,'0')}:{lastUpdated.getMinutes().toString().padStart(2,'0')}</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function wmoToEmoji(code: number): { icon: string; description: string } {
  if (code === 0) return { icon: '☀️', description: 'Jasno' }
  if (code <= 2) return { icon: '🌤️', description: 'Polojasno' }
  if (code <= 3) return { icon: '☁️', description: 'Zataženo' }
  if (code <= 49) return { icon: '🌫️', description: 'Mlha' }
  if (code <= 59) return { icon: '🌦️', description: 'Mrholení' }
  if (code <= 69) return { icon: '🌧️', description: 'Déšť' }
  if (code <= 79) return { icon: '❄️', description: 'Sněžení' }
  if (code <= 84) return { icon: '🌧️', description: 'Přeháňky' }
  if (code <= 94) return { icon: '⛈️', description: 'Bouřky' }
  return { icon: '🌩️', description: 'Bouřky s krupobitím' }
}

// ---------------------------------------------------------------------------
// Notifikační dropdown – zprávy + recenze
// ---------------------------------------------------------------------------
type NotifDropdownProps = {
  messages: Message[]
  reviews: Review[]
  onMarkAllMessagesRead: () => Promise<void>
  onMarkAllReviewsRead: () => Promise<void>
  onApproveReview: (id: string) => Promise<void>
}

function NotifDropdown({
  messages,
  reviews,
  onMarkAllMessagesRead,
  onMarkAllReviewsRead,
  onApproveReview,
}: NotifDropdownProps) {
  const [tab, setTab] = useState<'messages' | 'reviews'>('messages')
  const [loading, setLoading] = useState<string | null>(null)

  const unreadMessages = messages.filter(m => m.status === 'new')
  const pendingReviews = reviews.filter(r => !r.published)

  const totalBadge = unreadMessages.length + pendingReviews.length

  const handleMarkMessages = async () => {
    setLoading('messages')
    await onMarkAllMessagesRead()
    setLoading(null)
  }

  const handleMarkReviews = async () => {
    setLoading('reviews')
    await onMarkAllReviewsRead()
    setLoading(null)
  }

  const handleApprove = async (id: string) => {
    setLoading(id)
    await onApproveReview(id)
    setLoading(null)
  }

  return (
    <div className="flex flex-col" style={{ width: 340 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.05]">
        <span className="text-[13px] font-semibold text-white/80">Notifikace</span>
        {totalBadge > 0 && (
          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-2 py-0.5">
            {totalBadge} nových
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.05]">
        {([
          { key: 'messages', label: 'Zprávy', count: unreadMessages.length, icon: Mail },
          { key: 'reviews', label: 'Recenze', count: pendingReviews.length, icon: Star },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-all border-b-[1.5px] ${
              tab === t.key
                ? 'text-orange-400 border-orange-500'
                : 'text-white/30 border-transparent hover:text-white/55'
            }`}
          >
            <t.icon size={12} />
            {t.label}
            {t.count > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
        {tab === 'messages' && (
          <>
            {messages.length === 0 ? (
              <p className="text-center text-[12px] text-white/25 py-8">Žádné zprávy</p>
            ) : (
              messages.slice(0, 8).map(msg => (
                <Link
                  key={msg.id}
                  href={`/admin/messages`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0"
                >
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.status === 'new' ? 'bg-orange-500/15 text-orange-400' : 'bg-white/[0.05] text-white/25'
                  }`}>
                    <Mail size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[12px] font-semibold truncate ${msg.status === 'new' ? 'text-white/85' : 'text-white/45'}`}>
                        {msg.name}
                      </span>
                      {msg.status === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-white/30 truncate mt-0.5">{msg.message}</p>
                    <p className="text-[10px] text-white/20 mt-1">
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </>
        )}

        {tab === 'reviews' && (
          <>
            {reviews.length === 0 ? (
              <p className="text-center text-[12px] text-white/25 py-8">Žádné recenze</p>
            ) : (
              reviews.slice(0, 8).map(rev => (
                <div
                  key={rev.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] last:border-0"
                >
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    !rev.published ? 'bg-amber-500/15 text-amber-400' : 'bg-white/[0.05] text-white/25'
                  }`}>
                    <Star size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[12px] font-semibold truncate ${!rev.published ? 'text-white/85' : 'text-white/45'}`}>
                        {rev.name}
                      </span>
                      <div className="flex gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={9}
                            className={i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-white/15'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-white/30 truncate mt-0.5">{rev.comment}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] text-white/20">{formatTime(rev.created_at)}</p>
                      {!rev.published && (
                        <button
                          onClick={() => handleApprove(rev.id)}
                          disabled={loading === rev.id}
                          className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                        >
                          <Check size={10} />
                          {loading === rev.id ? 'Schvaluji…' : 'Schválit'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.05]">
        {tab === 'messages' && unreadMessages.length > 0 && (
          <button
            onClick={handleMarkMessages}
            disabled={loading === 'messages'}
            className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/65 transition-colors disabled:opacity-50"
          >
            <CheckCheck size={12} />
            {loading === 'messages' ? 'Označuji…' : 'Vše jako přečtené'}
          </button>
        )}
        {tab === 'reviews' && pendingReviews.length > 0 && (
          <button
            onClick={handleMarkReviews}
            disabled={loading === 'reviews'}
            className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/65 transition-colors disabled:opacity-50"
          >
            <CheckCheck size={12} />
            {loading === 'reviews' ? 'Označuji…' : 'Vše jako přečtené'}
          </button>
        )}
        <div className="flex-1" />
        <Link
          href={tab === 'messages' ? '/admin/messages' : '/admin/reviews'}
          className="text-[11px] text-orange-500/70 hover:text-orange-400 transition-colors"
        >
          Zobrazit vše →
        </Link>
      </div>
    </div>
  )
}

function formatTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'právě teď'
  if (diff < 3600) return `před ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `před ${Math.floor(diff / 3600)} h`
  return `před ${Math.floor(diff / 86400)} d`
}

// ---------------------------------------------------------------------------
// Hlavní komponenta
// ---------------------------------------------------------------------------
export function AdminHeader({
  user,
  unreadCount = 0,
  profile,
  messages = [],
  reviews = [],
  onMarkAllMessagesRead,
  onMarkAllReviewsRead,
  onApproveReview,
}: {
  user: SupabaseUser
  unreadCount?: number
  profile?: Profile | null
  messages?: Message[]
  reviews?: Review[]
  onMarkAllMessagesRead?: () => Promise<void>
  onMarkAllReviewsRead?: () => Promise<void>
  onApproveReview?: (id: string) => Promise<void>
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const totalBadge =
    messages.filter(m => m.status === 'new').length + reviews.filter(r => !r.published).length

  // Zavřít dropdown při kliknutí mimo
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin')
    router.refresh()
  }

  const currentPage = navItems.find(i =>
    i.exact ? pathname === i.href : pathname.startsWith(i.href)
  )

  const displayName = profile?.name ?? user.email?.split('@')[0] ?? 'Admin'
  const email = user.email ?? ''
  const avatarUrl = profile?.avatar_url ?? null

  const noop = useCallback(async () => {}, [])

  return (
    <>
      <header className="h-14 border-b border-white/[0.05] bg-[#08080d] flex items-center px-5 gap-0 shrink-0">

        {/* Logo – mobile only */}
        <div className="lg:hidden flex items-center gap-2 pr-4 border-r border-white/[0.05] mr-4">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-[10px]">fx</span>
          </div>
          <span className="text-[12px] font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            firefoxx.online
          </span>
        </div>

        {/* Mobile burger */}
        <button
          className="lg:hidden relative p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all mr-3"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Page title */}
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-1 rounded-full bg-white/15" />
          <p className="text-[13px] font-medium text-white/75 tracking-[-0.01em]">
            {currentPage?.label ?? 'Dashboard'}
          </p>
        </div>

        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Živý čas */}
          <LiveClock />

          {/* Počasí */}
          <WeatherBadge />

          <div className="hidden sm:block w-px h-4 bg-white/[0.06] mx-1" />

          {/* Notifikace bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(v => !v)}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/35 hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/[0.06] transition-all"
            >
              <Bell size={14} />
              {totalBadge > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none border border-[#08080d]">
                  {totalBadge > 9 ? '9+' : totalBadge}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 rounded-xl border border-white/[0.08] bg-[#0f0f16] shadow-2xl overflow-hidden">
                <NotifDropdown
                  messages={messages}
                  reviews={reviews}
                  onMarkAllMessagesRead={onMarkAllMessagesRead ?? noop}
                  onMarkAllReviewsRead={onMarkAllReviewsRead ?? noop}
                  onApproveReview={onApproveReview ?? noop}
                />
              </div>
            )}
          </div>

          {/* Web */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[12px] text-white/35 hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/[0.06] transition-all"
          >
            <ExternalLink size={11} />
            Web
          </a>

          {/* Separator */}
          <div className="hidden sm:block w-px h-4 bg-white/[0.06] mx-1" />

          {/* User chip */}
          <div className="flex items-center gap-2 h-9 pl-1 pr-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03]">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-white/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold">
                  {displayName[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + email */}
            <div className="hidden md:flex flex-col gap-[3px] leading-none">
              <span className="text-[12px] font-semibold text-white/85 truncate max-w-[110px] tracking-[-0.01em]">
                {displayName}
              </span>
              <span className="text-[10px] text-white/30 truncate max-w-[110px]">
                {email}
              </span>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-4 bg-white/[0.07] mx-1" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Odhlásit se"
              className="flex items-center justify-center w-6 h-6 rounded-md text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-[#08080d] border-r border-white/[0.05] flex flex-col h-full shadow-2xl">

            <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.05] shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-black text-[11px]">fx</span>
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  firefoxx.online
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <X size={15} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 py-2">
                Správa
              </p>
              {navItems.map(item => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                const isMessages = item.href === '/admin/messages'
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-orange-500/10 text-orange-400'
                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/75'
                    }`}
                  >
                    <item.icon size={15} />
                    <span className="flex-1">{item.label}</span>
                    {isMessages && unreadCount > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile user */}
            <div className="p-3 border-t border-white/[0.05] space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03]">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {displayName[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/80 truncate">{displayName}</p>
                  <p className="text-[10px] text-white/30 truncate">{email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/35 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
              >
                <LogOut size={15} />
                Odhlásit se
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}