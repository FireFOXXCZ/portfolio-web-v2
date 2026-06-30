'use client'

import { useRef, useEffect, useState } from 'react'
import { ComingSoon } from '@/components/ui/coming-soon'

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

export function BlogPreview() {
  const { ref, inView } = useInView()

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className={`flex items-end justify-between mb-4 transition-all duration-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-2">Zápisky</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Poslední z blogu</h2>
          </div>
        </div>

        <ComingSoon
          compact
          showBack={false}
          className="py-10 rounded-2xl border border-gray-200/60 dark:border-white/[0.06]"
        />
      </div>
    </section>
  )
}