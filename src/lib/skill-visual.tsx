// Shared visual helpers for rendering skills consistently between the admin
// dashboard (skill-card.tsx) and the public homepage (skills-preview.tsx).

import { Code2, Server, Braces, Workflow, Palette, Wrench, Boxes } from 'lucide-react'

// The icon images come back from simpleicons.org pre-tinted to `icon_color`.
// A near-black logo (e.g. Next.js) on a translucent dark card — or a near-white
// logo on a translucent light card — basically disappears. We pick a backdrop
// that contrasts with the icon's own luminance instead of using one fixed card.
export function getIconBgClass(hex?: string | null) {
  const color = (hex ?? 'ffffff').replace('#', '').trim()
  if (!/^[0-9a-fA-F]{6}$/.test(color)) {
    return 'bg-white/[0.06] border-white/[0.1]'
  }
  const r = parseInt(color.slice(0, 2), 16)
  const g = parseInt(color.slice(2, 4), 16)
  const b = parseInt(color.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  if (luminance < 0.18) {
    // Very dark icon -> light backdrop so it doesn't vanish on a dark theme
    return 'bg-white border-white/10'
  }
  if (luminance > 0.88) {
    // Near-white icon -> dark backdrop for contrast
    return 'bg-neutral-950 border-white/10'
  }
  // Mid-tone / colorful logos already read fine on a neutral glass card
  return 'bg-white/[0.06] border-white/[0.1]'
}

export type CategoryPalette = {
  badgeBg: string
  badgeText: string
  fill: string
  glow: string
  shadow: string
  cardWash: string
  hoverBorder: string
}

// Tailwind needs complete literal class names to pick them up at build time,
// so these are spelled out per category rather than built from a variable.
// Keys are diacritic-free, lowercased category names (see normalize() below).
// `shadow` is the same accent color as `fill`, as an rgba() box-shadow glow.
// `cardWash` is a very subtle full-card background tint; `hoverBorder` tints
// the card border on hover to match.
const CATEGORY_PALETTE: Record<string, CategoryPalette> = {
  frontend: { badgeBg: 'bg-orange-500/10', badgeText: 'text-orange-400', fill: 'bg-orange-500', glow: 'bg-orange-500/25', shadow: 'shadow-[0_0_6px_rgba(249,115,22,0.55)]', cardWash: 'bg-gradient-to-br from-orange-500/[0.05] via-transparent to-transparent', hoverBorder: 'hover:border-orange-500/25' },
  backend: { badgeBg: 'bg-blue-500/10', badgeText: 'text-blue-400', fill: 'bg-blue-500', glow: 'bg-blue-500/25', shadow: 'shadow-[0_0_6px_rgba(59,130,246,0.55)]', cardWash: 'bg-gradient-to-br from-blue-500/[0.05] via-transparent to-transparent', hoverBorder: 'hover:border-blue-500/25' },
  jazyk: { badgeBg: 'bg-purple-500/10', badgeText: 'text-purple-400', fill: 'bg-purple-500', glow: 'bg-purple-500/25', shadow: 'shadow-[0_0_6px_rgba(168,85,247,0.55)]', cardWash: 'bg-gradient-to-br from-purple-500/[0.05] via-transparent to-transparent', hoverBorder: 'hover:border-purple-500/25' },
  devops: { badgeBg: 'bg-cyan-500/10', badgeText: 'text-cyan-400', fill: 'bg-cyan-500', glow: 'bg-cyan-500/25', shadow: 'shadow-[0_0_6px_rgba(6,182,212,0.55)]', cardWash: 'bg-gradient-to-br from-cyan-500/[0.05] via-transparent to-transparent', hoverBorder: 'hover:border-cyan-500/25' },
  design: { badgeBg: 'bg-pink-500/10', badgeText: 'text-pink-400', fill: 'bg-pink-500', glow: 'bg-pink-500/25', shadow: 'shadow-[0_0_6px_rgba(236,72,153,0.55)]', cardWash: 'bg-gradient-to-br from-pink-500/[0.05] via-transparent to-transparent', hoverBorder: 'hover:border-pink-500/25' },
  nastroje: { badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-400', fill: 'bg-emerald-500', glow: 'bg-emerald-500/25', shadow: 'shadow-[0_0_6px_rgba(16,185,129,0.55)]', cardWash: 'bg-gradient-to-br from-emerald-500/[0.05] via-transparent to-transparent', hoverBorder: 'hover:border-emerald-500/25' },
  ostatni: { badgeBg: 'bg-slate-500/10', badgeText: 'text-slate-400', fill: 'bg-slate-500', glow: 'bg-slate-500/25', shadow: 'shadow-[0_0_6px_rgba(100,116,139,0.55)]', cardWash: 'bg-gradient-to-br from-slate-500/[0.05] via-transparent to-transparent', hoverBorder: 'hover:border-slate-500/25' },
}

const DEFAULT_PALETTE = CATEGORY_PALETTE.ostatni

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Any category name from the DB maps to one of the palettes above by name
// (diacritic-insensitive); unknown categories fall back to a neutral slate.
export function getCategoryPalette(category?: string | null): CategoryPalette {
  if (!category) return DEFAULT_PALETTE
  return CATEGORY_PALETTE[normalize(category)] ?? DEFAULT_PALETTE
}

// Plain-Czech wording for the 1–5 level, used in the admin panel — no
// next-intl here on purpose, this UI is Czech-only and internal.
const LEVEL_LABELS = ['Začátečník', 'Mírně pokročilý', 'Pokročilý', 'Zkušený', 'Expert']

export function getLevelLabel(level: number): string {
  const clamped = Math.min(5, Math.max(1, Math.round(level)))
  return LEVEL_LABELS[clamped - 1]
}

type CategoryIconProps = {
  category?: string | null
  size?: number
  className?: string
}

// One representative icon per category, same matching rules as the palette.
//
// This is a component with a static switch — not a lookup table that hands
// back a component reference — on purpose: react-hooks' static-components
// rule flags `const Icon = pickSomeComponent(); <Icon />` because it can't
// statically prove Icon's identity is stable across renders. Every JSX tag
// below is a literal, top-level-imported component, so the rule (and React)
// can see exactly what's being rendered.
export function CategoryIcon({ category, size = 12, className }: CategoryIconProps) {
  const key = category ? normalize(category) : 'ostatni'
  switch (key) {
    case 'frontend':
      return <Code2 size={size} className={className} />
    case 'backend':
      return <Server size={size} className={className} />
    case 'jazyk':
      return <Braces size={size} className={className} />
    case 'devops':
      return <Workflow size={size} className={className} />
    case 'design':
      return <Palette size={size} className={className} />
    case 'nastroje':
      return <Wrench size={size} className={className} />
    default:
      return <Boxes size={size} className={className} />
  }
}