'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

const POSTS = [
  {
    slug: 'nextjs-supabase-portfolio',
    title: 'Jak jsem postavil portfolio s Next.js 15 a Supabase',
    excerpt: 'Projdeme architekturu celého projektu — od databázového schématu přes server actions až po deployment na Vercel.',
    date: '2024-06-10',
    readMin: 8,
    tags: ['Next.js', 'Supabase'],
  },
  {
    slug: 'typescript-best-practices',
    title: 'TypeScript v praxi: tipy které mi ušetřily hodiny debugování',
    excerpt: 'Konkrétní vzory a anti-patterny ze skutečných projektů. Discriminated unions, type guards a kdy použít unknown místo any.',
    date: '2024-05-22',
    readMin: 6,
    tags: ['TypeScript'],
  },
  {
    slug: 'tailwind-dark-mode',
    title: 'Dark mode bez bolesti hlavy — Tailwind + next-themes',
    excerpt: 'Jak implementovat robustní dark mode bez flash of unstyled content a hydration mismatch v Next.js aplikaci.',
    date: '2024-04-15',
    readMin: 5,
    tags: ['Tailwind', 'Next.js'],
  },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BlogPreview() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className={`flex items-end justify-between mb-12 transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-2">Zápisky</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Poslední z blogu</h2>
          </div>
          <Link
            href="/blog"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors group"
          >
            Všechny příspěvky
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {POSTS.map((post, i) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-gray-200/60 dark:border-white/[0.06] bg-white dark:bg-[#0f0f14] hover:border-orange-500/30 hover:shadow-sm hover:shadow-orange-500/5 transition-all duration-300 ${
                inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
              }`}
              style={{ transitionDelay: `${i * 100 + 150}ms` }}
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-orange-500 transition-colors line-clamp-1">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{post.excerpt}</p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 shrink-0">
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(post.date)}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{post.readMin} min</span>
                </div>
                <div className="flex gap-1.5">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/blog" className="flex items-center gap-1.5 text-sm font-semibold text-orange-500">
            Všechny příspěvky <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}